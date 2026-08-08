import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { SECURITY } from '../src/config/constants.js';
import {
  checkLoginAllowed,
  recordFailedLogin,
  clearLoginAttempts,
  __resetLoginAttempts,
} from '../src/services/loginAttempts.service.js';

const MAX = SECURITY.MAX_LOGIN_ATTEMPTS;
const IP = '203.0.113.10';

// No `user` is passed in most cases, so no alert email is attempted — these
// tests exercise the counting logic only, with no network involved.
const fail = (email, ip = IP) => recordFailedLogin({ email, ip, user: null });

beforeEach(() => __resetLoginAttempts());

test('allows login when nothing has failed yet', () => {
  assert.equal(checkLoginAllowed({ email: 'a@x.com', ip: IP }), null);
});

test('counts down remaining attempts on each failure', () => {
  const first = fail('a@x.com');
  assert.equal(first.locked, false);
  assert.equal(first.remainingAttempts, MAX - 1);

  const second = fail('a@x.com');
  assert.equal(second.remainingAttempts, MAX - 2);
});

test(`locks the account after ${MAX} consecutive failures`, () => {
  let result;
  for (let i = 0; i < MAX; i += 1) result = fail('a@x.com');

  assert.equal(result.locked, true);
  assert.equal(result.remainingAttempts, 0);
  assert.ok(result.retryAfterSeconds > 0);
});

test('a locked account is refused before the password is even checked', () => {
  for (let i = 0; i < MAX; i += 1) fail('a@x.com');

  const blocked = checkLoginAllowed({ email: 'a@x.com', ip: IP });
  assert.ok(blocked, 'expected the account to be locked');
  assert.equal(blocked.scope, 'account');
  assert.ok(blocked.retryAfterSeconds > 0);
});

test('locking one account does not lock a different account', () => {
  for (let i = 0; i < MAX; i += 1) fail('victim@x.com');

  assert.ok(checkLoginAllowed({ email: 'victim@x.com', ip: IP }));
  // Different email, different IP — the untouched account stays usable.
  assert.equal(checkLoginAllowed({ email: 'bystander@x.com', ip: '198.51.100.7' }), null);
});

test('email matching is case- and whitespace-insensitive', () => {
  for (let i = 0; i < MAX; i += 1) fail('  User@X.com  ');

  assert.ok(
    checkLoginAllowed({ email: 'user@x.com', ip: IP }),
    'mixed-case variant should hit the same counter'
  );
});

test('a successful login clears the failure streak', () => {
  fail('a@x.com');
  fail('a@x.com');
  clearLoginAttempts({ email: 'a@x.com', ip: IP });

  const next = fail('a@x.com');
  assert.equal(next.locked, false);
  assert.equal(next.remainingAttempts, MAX - 1, 'counter should have restarted');
});

test('repeat lockouts on the same account back off exponentially', () => {
  let first;
  for (let i = 0; i < MAX; i += 1) first = fail('a@x.com');

  // Keep failing the same account — `fails` was reset to 0 by the lock, so the
  // next MAX failures trip a second lock on the same (still-tracked) entry.
  let second;
  for (let i = 0; i < MAX; i += 1) second = fail('a@x.com');

  assert.equal(
    second.retryAfterSeconds,
    first.retryAfterSeconds * 2,
    'the second lockout should last twice as long as the first'
  );
});

test('lockout duration is capped', () => {
  let last = { retryAfterSeconds: 0 };
  // Enough repeat lockouts that uncapped doubling would far exceed the cap.
  for (let lock = 0; lock < 12; lock += 1) {
    for (let i = 0; i < MAX; i += 1) last = fail('a@x.com');
  }
  assert.equal(last.retryAfterSeconds, Math.ceil(SECURITY.MAX_LOCKOUT_MS / 1000));
});

test('per-IP lockout catches spraying across many different emails', () => {
  // Each email stays under its own threshold, so only the IP track can fire.
  const perEmail = MAX - 1;
  const emails = Math.ceil(SECURITY.MAX_IP_ATTEMPTS / perEmail) + 1;

  for (let e = 0; e < emails; e += 1) {
    for (let i = 0; i < perEmail; i += 1) fail(`user${e}@x.com`);
  }

  const blocked = checkLoginAllowed({ email: 'someone-new@x.com', ip: IP });
  assert.ok(blocked, 'expected the IP to be locked after spraying');
  assert.equal(blocked.scope, 'ip');
});

test('unknown emails are counted too, so enumeration is throttled', () => {
  let result;
  for (let i = 0; i < MAX; i += 1) result = fail('does-not-exist@x.com');
  assert.equal(result.locked, true);
});
