import dotenv from 'dotenv';

dotenv.config();

/**
 * Email delivery via Brevo's transactional HTTP API.
 *
 * We use the HTTP API (not SMTP) because cloud hosts like Render frequently
 * have broken/limited outbound SMTP and IPv6 routing, which made the old
 * nodemailer + Gmail SMTP setup unreliable. The HTTPS API sidesteps all of
 * that — it's a single POST to https://api.brevo.com/v3/smtp/email.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

// "Name <email>" or a bare email. Brevo requires the sender to be a verified
// sender/domain in your Brevo account, otherwise the send is rejected.
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM;
const FROM_NAME = process.env.BREVO_FROM_NAME || 'ParkGo';

const hasBrevo = Boolean(BREVO_API_KEY && FROM_EMAIL);

if (hasBrevo) {
  console.log(`[email] Brevo API ready — sending as "${FROM_NAME}" <${FROM_EMAIL}>`);
} else {
  console.log(
    '[email] No Brevo config — emails will be logged to console only. ' +
      'Set BREVO_API_KEY and BREVO_FROM_EMAIL in .env to enable real delivery.'
  );
}

/**
 * Send one transactional email.
 *
 * Keeps the exact same signature the rest of the codebase already relies on:
 *   sendEmail({ to, subject, html, text }) => info
 *
 * In dev (no key) it logs instead of sending, matching the previous behaviour.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!hasBrevo) {
    console.log('[email:DEV]', { to, subject, text: text || html });
    return { messageId: 'dev-mode', accepted: [to] };
  }

  const payload = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    // Brevo requires htmlContent OR textContent; include text as a fallback.
    ...(text ? { textContent: text } : {}),
  };

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
      // Don't let a hung request block the process indefinitely.
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');

      // Brevo's most common production failure is IP allow-listing: the key is
      // valid but the sending host's IP isn't authorised, so *every* email
      // silently 401s. The raw message buries the fix, so surface it directly —
      // this bit us once already.
      if (res.status === 401 && body.includes('unrecognised IP address')) {
        console.error(
          '[email] Brevo rejected this server\'s IP address.\n' +
            '        No email can be sent until it is authorised.\n' +
            '        Fix: add this IP at https://app.brevo.com/security/authorised_ips\n' +
            '        (or disable IP restrictions there entirely if the host IP is dynamic).'
        );
      }

      throw new Error(`Brevo ${res.status} ${res.statusText}: ${body}`);
    }

    const info = await res.json().catch(() => ({}));
    console.log(
      `[email] sent → ${to} (${subject}) · messageId=${info.messageId || 'n/a'}`
    );
    return info;
  } catch (err) {
    console.error(`[email] FAILED → ${to} (${subject}):`, err.message || err);
    // Re-throw so callers can react; controllers use fire-and-forget, so this
    // never blocks an HTTP response.
    throw err;
  }
};
