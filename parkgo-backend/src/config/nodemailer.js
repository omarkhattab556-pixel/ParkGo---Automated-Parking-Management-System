import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'node:dns/promises';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);

const hasSmtp = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

/**
 * Resolve the SMTP host to an IPv4 address.
 *
 * Render (and many cloud hosts) return an AAAA record for smtp.gmail.com but
 * have no working IPv6 route, so the TCP connect fails with
 * `ENETUNREACH 2a00:1450:...:587`. Nodemailer resolves A + AAAA records itself
 * (via dns.resolve4/resolve6) and ignores both `family: 4` and
 * `dns.setDefaultResultOrder`, so the only reliable fix is to hand it an
 * IPv4 literal as the host — when `host` is already an IP, nodemailer skips
 * DNS entirely. TLS still validates against the hostname because we pass it
 * as `servername` (SNI + cert check).
 */
async function resolveIpv4(hostname) {
  try {
    const [addr] = await dns.resolve4(hostname);
    return addr || null;
  } catch {
    return null;
  }
}

/**
 * Build the transporter. Gmail (and most providers) accept:
 *   - port 465 with secure=true (implicit TLS), or
 *   - port 587 with secure=false + STARTTLS (we force it via requireTLS)
 *
 * Tight timeouts prevent a misbehaving SMTP server from blocking responses.
 * Connection pooling avoids reconnecting on every email.
 */
async function buildTransporter() {
  if (!hasSmtp) return null;
  const secure = SMTP_PORT === 465;

  // Prefer an IPv4 literal to dodge broken-IPv6 hosts; fall back to the
  // hostname if resolution fails (nodemailer will then do its own lookup).
  const ipv4 = await resolveIpv4(SMTP_HOST);

  return nodemailer.createTransport({
    host: ipv4 || SMTP_HOST,
    // Keep TLS/SNI pinned to the real hostname even when connecting by IP.
    servername: SMTP_HOST,
    tls: { servername: SMTP_HOST },
    port: SMTP_PORT,
    secure,
    requireTLS: !secure,
    family: 4,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
}

export const transporter = await buildTransporter();

if (transporter) {
  // Verify on boot so misconfigured creds surface immediately in the logs
  // instead of silently failing on every email send.
  transporter
    .verify()
    .then(() => {
      console.log(
        `[email] SMTP ready — ${SMTP_USER} via ${SMTP_HOST}:${SMTP_PORT}`
      );
    })
    .catch((err) => {
      console.error(
        '[email] SMTP verify FAILED — emails will not be sent. Check SMTP_USER/SMTP_PASS:',
        err.message || err
      );
    });
} else {
  console.log(
    '[email] No SMTP config — emails will be logged to console only. ' +
      'Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable real delivery.'
  );
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log('[email:DEV]', { to, subject, text: text || html });
    return { messageId: 'dev-mode', accepted: [to] };
  }

  try {
    const info = await transporter.sendMail({
      from: `"ParkGo" <${process.env.SMTP_FROM || SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(
      `[email] sent → ${to} (${subject}) · messageId=${info.messageId}`
    );
    return info;
  } catch (err) {
    console.error(
      `[email] FAILED → ${to} (${subject}):`,
      err.message || err
    );
    // Re-throw so the caller's `.catch()` can react if it wants to,
    // but the controllers always use fire-and-forget so this never
    // blocks an HTTP response.
    throw err;
  }
};
