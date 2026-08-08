/**
 * Brute-force protection for the login endpoint.
 *
 * Two independent tracks, both in-memory (same trade-off as
 * rateLimit.middleware.js — fine for a single instance, swap for Redis if the
 * API is ever horizontally scaled):
 *
 *   1. Per-account  — N consecutive failures on one email locks that account
 *                     for a cooling-off period, and emails the owner a security
 *                     alert. This is the requirement: stop someone guessing
 *                     their way into a *specific* account.
 *
 *   2. Per-IP       — a wider net for credential stuffing, where an attacker
 *                     sprays many different emails and so never trips any
 *                     single account's counter.
 *
 * Lockouts escalate: each additional lockout on the same account doubles the
 * duration (capped), so a persistent attacker gets progressively slower while a
 * genuine user who mistypes twice is barely inconvenienced.
 *
 * Privacy note: the alert email is sent only to the address on record, and it
 * never reveals whether the guessed password was close, nor what was tried.
 */
import { SECURITY } from '../config/constants.js';
import { sendSuspiciousLoginEmail } from './email.service.js';

/** email(lowercased) -> { fails, lockedUntil, lockCount, alertedForLock } */
const accounts = new Map();
/** ip -> { fails, lockedUntil } */
const ips = new Map();

// Drop stale entries so the maps don't grow unbounded. Anything that has no
// active lock and hasn't failed recently is forgotten.
const sweep = () => {
  const now = Date.now();
  for (const [key, v] of accounts) {
    if ((v.lockedUntil ?? 0) <= now && (v.lastFailAt ?? 0) + SECURITY.ATTEMPT_WINDOW_MS <= now) {
      accounts.delete(key);
    }
  }
  for (const [key, v] of ips) {
    if ((v.lockedUntil ?? 0) <= now && (v.lastFailAt ?? 0) + SECURITY.IP_WINDOW_MS <= now) {
      ips.delete(key);
    }
  }
};
setInterval(sweep, 5 * 60_000).unref?.();

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

/** Lockout duration for the Nth lock on an account, with exponential backoff. */
const lockDurationMs = (lockCount) => {
  const factor = 2 ** Math.max(0, lockCount - 1);
  return Math.min(SECURITY.LOCKOUT_MS * factor, SECURITY.MAX_LOCKOUT_MS);
};

/**
 * Is this login attempt currently blocked? Call before verifying the password.
 * Returns null when allowed, or { scope, retryAfterSeconds } when locked.
 */
export const checkLoginAllowed = ({ email, ip }) => {
  const now = Date.now();

  const ipEntry = ips.get(ip);
  if (ipEntry && ipEntry.lockedUntil > now) {
    return {
      scope: 'ip',
      retryAfterSeconds: Math.ceil((ipEntry.lockedUntil - now) / 1000),
    };
  }

  const acct = accounts.get(normalizeEmail(email));
  if (acct && acct.lockedUntil > now) {
    return {
      scope: 'account',
      retryAfterSeconds: Math.ceil((acct.lockedUntil - now) / 1000),
    };
  }

  return null;
};

/**
 * Record a failed login.
 *
 * `user` is the matched user row, or null when the email doesn't exist. We
 * still count failures for unknown emails (so enumeration is also throttled),
 * but obviously send no alert email for them.
 *
 * Returns { locked, remainingAttempts, retryAfterSeconds }.
 */
export const recordFailedLogin = ({ email, ip, user, userAgent }) => {
  const now = Date.now();
  const key = normalizeEmail(email);

  // ---- per-IP track -------------------------------------------------------
  let ipEntry = ips.get(ip);
  if (!ipEntry || ipEntry.windowStart + SECURITY.IP_WINDOW_MS <= now) {
    ipEntry = { fails: 0, windowStart: now, lockedUntil: 0 };
    ips.set(ip, ipEntry);
  }
  ipEntry.fails += 1;
  ipEntry.lastFailAt = now;
  if (ipEntry.fails >= SECURITY.MAX_IP_ATTEMPTS) {
    ipEntry.lockedUntil = now + SECURITY.IP_LOCKOUT_MS;
    ipEntry.fails = 0;
    ipEntry.windowStart = now;
  }

  // ---- per-account track --------------------------------------------------
  let acct = accounts.get(key);
  // Start a fresh streak if the previous failures have aged out.
  if (!acct || (acct.lastFailAt ?? 0) + SECURITY.ATTEMPT_WINDOW_MS <= now) {
    acct = { fails: 0, lockedUntil: 0, lockCount: acct?.lockCount ?? 0 };
    accounts.set(key, acct);
  }
  acct.fails += 1;
  acct.lastFailAt = now;

  if (acct.fails >= SECURITY.MAX_LOGIN_ATTEMPTS) {
    acct.lockCount += 1;
    const duration = lockDurationMs(acct.lockCount);
    acct.lockedUntil = now + duration;
    acct.fails = 0;

    // Fire-and-forget: a mail failure must never break the login response, but
    // it must never be silent either — this alert is a security control, and a
    // provider outage that swallows it needs to show up in the logs loudly
    // enough to be noticed and acted on.
    if (user) {
      sendSuspiciousLoginEmail(user, {
        attempts: SECURITY.MAX_LOGIN_ATTEMPTS,
        lockMinutes: Math.round(duration / 60_000),
        ip,
        userAgent,
        attemptedAt: new Date(now).toISOString(),
      })
        .then(() => {
          console.log(`[security] lockout alert sent → ${user.email}`);
        })
        .catch((err) => {
          console.error(
            `[security] ALERT NOT DELIVERED → ${user.email} — the account was ` +
              `locked but its owner was NOT notified. Reason: ${err?.message || err}`
          );
        });
    } else {
      // No account behind this email, so there is nobody to warn. Still worth a
      // line: a burst of these is the signature of email enumeration.
      console.warn(`[security] lockout on unknown email from ip=${ip} — no alert sent`);
    }

    return {
      locked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(duration / 1000),
    };
  }

  return {
    locked: false,
    remainingAttempts: SECURITY.MAX_LOGIN_ATTEMPTS - acct.fails,
    retryAfterSeconds: 0,
  };
};

/** Clear an account's failure streak after a successful login. */
export const clearLoginAttempts = ({ email, ip }) => {
  accounts.delete(normalizeEmail(email));
  const ipEntry = ips.get(ip);
  // Only reset the IP's running count, not an active lock — a successful login
  // from a locked IP shouldn't hand the attacker a clean slate.
  if (ipEntry && ipEntry.lockedUntil <= Date.now()) ips.delete(ip);
};

/** Test seam: wipe all tracked state. */
export const __resetLoginAttempts = () => {
  accounts.clear();
  ips.clear();
};
