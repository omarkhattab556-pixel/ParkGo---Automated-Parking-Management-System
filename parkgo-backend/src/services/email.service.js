import { sendEmail } from '../config/nodemailer.js';

const wrap = (inner) => `
<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
  <div style="max-width:560px; margin:24px auto; background:#fff; border-radius:20px; padding:36px 28px; direction: ltr; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align:center; margin-bottom:24px;">
      <div style="display:inline-block; padding: 10px 18px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; font-weight:700; letter-spacing:1px; border-radius:12px; font-size:20px;">ParkGo</div>
    </div>
    ${inner}
    <p style="margin-top:32px; font-size:12px; color:#94a3b8; text-align:center;">
      &copy; ${new Date().getFullYear()} ParkGo. All rights reserved.
    </p>
  </div>
</body>
</html>
`;

const codeBlock = (code) => `
  <div style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg,#ecfdf5,#d1fae5); border:2px solid #10b981; border-radius:16px; text-align:center;">
    <div style="font-size:14px; color:#047857; font-weight:600; margin-bottom:6px;">Confirmation code</div>
    <div style="font-size:42px; font-weight:800; letter-spacing:8px; font-family: 'Courier New', monospace; color:#064e3b;">${code}</div>
  </div>
`;

/**
 * Emails are English-only, so timestamps use an English locale rather than
 * the Israeli one. The facility's timezone still applies.
 */
const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-GB', {
    timeZone: 'Asia/Jerusalem',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const sendWelcomeEmail = async (user, initialPassword) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome to ParkGo!',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">Hello ${user.first_name},</h2>
      <p style="line-height:1.6;">You have successfully registered with ParkGo. Here are your login details:</p>
      <table style="margin: 16px 0; line-height:1.8;">
        <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
        <tr><td><strong>Initial password:</strong></td><td><code style="background:#f1f5f9; padding:4px 8px; border-radius:6px;">${initialPassword}</code></td></tr>
      </table>
      <p style="line-height:1.6;">We recommend changing your password after your first login.</p>
      <p style="margin-top:24px;">Best regards,<br/>The ParkGo Team</p>
    `),
    text: `Welcome ${user.first_name}! Login: ${user.email} / ${initialPassword}`,
  });

export const sendReservationCodeEmail = async (user, { code, spaceNumber, reservationStart }) =>
  sendEmail({
    to: user.email,
    subject: 'Parking Reservation Confirmation Code - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">Hello ${user.first_name},</h2>
      <p style="line-height:1.6;">Your parking reservation is confirmed!</p>
      ${codeBlock(code)}
      <table style="margin: 16px 0; line-height:1.8; font-size:15px;">
        <tr><td>🅿️ <strong>Parking space:</strong></td><td>#${spaceNumber}</td></tr>
        <tr><td>🕐 <strong>Arrival time:</strong></td><td>${formatDateTime(reservationStart)}</td></tr>
      </table>
      <p style="line-height:1.6; color:#dc2626; font-weight:500;">
        ⚠️ Keep this code — you will need it when you arrive at the facility. If you do not arrive within 15 minutes, your reservation will be cancelled automatically.
      </p>
    `),
    text: `Confirmation code: ${code}, space #${spaceNumber}, start: ${reservationStart}`,
  });

export const sendDropOffCodeEmail = async (user, { code, spaceNumber }) =>
  sendEmail({
    to: user.email,
    subject: 'Parking Confirmation - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">Hello ${user.first_name},</h2>
      <p style="line-height:1.6;">Your vehicle has been parked successfully.</p>
      ${codeBlock(code)}
      <p style="line-height:1.6;">🅿️ <strong>Space:</strong> #${spaceNumber}</p>
      <p style="line-height:1.6; color:#dc2626;">⚠️ Keep this code — you will need it to retrieve your vehicle.</p>
    `),
    text: `Parked! Code: ${code}, space #${spaceNumber}`,
  });

export const sendLostCodeEmail = async (user, { code, spaceNumber, parkingDate }) =>
  sendEmail({
    to: user.email,
    subject: 'Parking Code Recovery - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">Hello ${user.first_name},</h2>
      <p style="line-height:1.6;">Here is the code for your active parking session:</p>
      ${codeBlock(code)}
      <table style="margin: 16px 0; line-height:1.8; font-size:15px;">
        <tr><td>🅿️ <strong>Space:</strong></td><td>#${spaceNumber}</td></tr>
        <tr><td>🕐 <strong>Parked since:</strong></td><td>${formatDateTime(parkingDate)}</td></tr>
      </table>
    `),
    text: `Active parking code: ${code} at space #${spaceNumber}`,
  });

export const sendLateReturnEmail = async (user, { minutesLate, delayCount, cancelled }) =>
  sendEmail({
    to: user.email,
    subject: '⚠️ Late Vehicle Retrieval - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px; color:#dc2626;">Hello ${user.first_name},</h2>
      <p style="line-height:1.6;">Your vehicle is still in the facility <strong>${minutesLate}</strong> minutes past the maximum allowed time.</p>
      <p style="line-height:1.6;">This is delay number <strong>${delayCount}</strong> on your account.</p>
      ${cancelled ? `
      <div style="margin-top:20px; padding:16px; background:#fef2f2; border:2px solid #ef4444; border-radius:12px;">
        <strong style="color:#991b1b;">⛔ Your subscription has been cancelled automatically after 3 delays.</strong>
        <p style="margin: 8px 0 0; color:#7f1d1d;">Please contact an attendant to renew your subscription.</p>
      </div>` : ''}
    `),
    text: `Late return: ${minutesLate} min, delay count: ${delayCount}${cancelled ? ' — subscription cancelled' : ''}`,
  });

export const sendReservationCancelledEmail = async (user, { reason }) =>
  sendEmail({
    to: user.email,
    subject: 'Parking Reservation Cancelled - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">Hello ${user.first_name},</h2>
      <p style="line-height:1.6;">Your parking reservation has been cancelled.</p>
      <p style="line-height:1.6;"><strong>Reason:</strong> ${reason}</p>
    `),
    text: `Reservation cancelled. Reason: ${reason}`,
  });
