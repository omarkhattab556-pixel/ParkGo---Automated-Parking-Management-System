import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const hasSmtp = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

/**
 * Tight timeouts so a misbehaving SMTP server can never block API responses.
 * Email sending always runs in the background (fire-and-forget) from the
 * controllers, but we still want a hard ceiling on retries/sockets.
 */
export const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    })
  : null;

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log('[email:DEV]', { to, subject, text: text || html });
    return { messageId: 'dev-mode', accepted: [to] };
  }
  return transporter.sendMail({
    from: `"ParkGo" <${process.env.SMTP_FROM || 'noreply@parkgo.com'}>`,
    to,
    subject,
    html,
    text,
  });
};
