import { sendEmail } from '../config/nodemailer.js';

const dirRtl = 'direction: rtl; text-align: right;';

const wrap = (inner) => `
<!doctype html>
<html lang="he">
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: 'Heebo', Arial, sans-serif; color: #0f172a;">
  <div style="max-width:560px; margin:24px auto; background:#fff; border-radius:20px; padding:36px 28px; ${dirRtl} box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
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
    <div style="font-size:14px; color:#047857; font-weight:600; margin-bottom:6px;">קוד אישור</div>
    <div style="font-size:42px; font-weight:800; letter-spacing:8px; font-family: 'Courier New', monospace; color:#064e3b;">${code}</div>
  </div>
`;

export const sendWelcomeEmail = async (user, initialPassword) =>
  sendEmail({
    to: user.email,
    subject: 'ברוכים הבאים ל-ParkGo!',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">שלום ${user.first_name},</h2>
      <p style="line-height:1.6;">נרשמת בהצלחה למערכת ParkGo. להלן פרטי הכניסה שלך:</p>
      <table style="margin: 16px 0; line-height:1.8;">
        <tr><td><strong>אימייל:</strong></td><td>${user.email}</td></tr>
        <tr><td><strong>סיסמה ראשונית:</strong></td><td><code style="background:#f1f5f9; padding:4px 8px; border-radius:6px;">${initialPassword}</code></td></tr>
      </table>
      <p style="line-height:1.6;">מומלץ לשנות את הסיסמה לאחר הכניסה הראשונה.</p>
      <p style="margin-top:24px;">בברכה,<br/>צוות ParkGo</p>
    `),
    text: `Welcome ${user.first_name}! Login: ${user.email} / ${initialPassword}`,
  });

export const sendReservationCodeEmail = async (user, { code, spaceNumber, reservationStart }) =>
  sendEmail({
    to: user.email,
    subject: 'קוד אישור להזמנת חניה - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">שלום ${user.first_name},</h2>
      <p style="line-height:1.6;">הזמנת החניה שלך אושרה!</p>
      ${codeBlock(code)}
      <table style="margin: 16px 0; line-height:1.8; font-size:15px;">
        <tr><td>🅿️ <strong>מקום חניה:</strong></td><td>#${spaceNumber}</td></tr>
        <tr><td>🕐 <strong>מועד הגעה:</strong></td><td>${new Date(reservationStart).toLocaleString('he-IL')}</td></tr>
      </table>
      <p style="line-height:1.6; color:#dc2626; font-weight:500;">
        ⚠️ שמור על הקוד - תזדקק לו בעת הגעתך לחניון. אי הגעה תוך 15 דקות תגרור ביטול אוטומטי של ההזמנה.
      </p>
    `),
    text: `Confirmation code: ${code}, space #${spaceNumber}, start: ${reservationStart}`,
  });

export const sendDropOffCodeEmail = async (user, { code, spaceNumber }) =>
  sendEmail({
    to: user.email,
    subject: 'אישור חנייה - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">שלום ${user.first_name},</h2>
      <p style="line-height:1.6;">רכבך הוחנה בהצלחה.</p>
      ${codeBlock(code)}
      <p style="line-height:1.6;">🅿️ <strong>מקום:</strong> #${spaceNumber}</p>
      <p style="line-height:1.6; color:#dc2626;">⚠️ שמור על הקוד - תזדקק לו לאיסוף הרכב.</p>
    `),
    text: `Parked! Code: ${code}, space #${spaceNumber}`,
  });

export const sendLostCodeEmail = async (user, { code, spaceNumber, parkingDate }) =>
  sendEmail({
    to: user.email,
    subject: 'שחזור קוד חניה - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">שלום ${user.first_name},</h2>
      <p style="line-height:1.6;">הקוד שלך לחניה הפעילה:</p>
      ${codeBlock(code)}
      <table style="margin: 16px 0; line-height:1.8; font-size:15px;">
        <tr><td>🅿️ <strong>מקום:</strong></td><td>#${spaceNumber}</td></tr>
        <tr><td>🕐 <strong>זמן חניה:</strong></td><td>החל מ-${new Date(parkingDate).toLocaleString('he-IL')}</td></tr>
      </table>
    `),
    text: `Active parking code: ${code} at space #${spaceNumber}`,
  });

export const sendLateReturnEmail = async (user, { minutesLate, delayCount, cancelled }) =>
  sendEmail({
    to: user.email,
    subject: '⚠️ איחור בהוצאת רכב - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px; color:#dc2626;">שלום ${user.first_name},</h2>
      <p style="line-height:1.6;">הרכב שלך עדיין בחניון <strong>${minutesLate}</strong> דקות אחרי הזמן המקסימלי.</p>
      <p style="line-height:1.6;">זהו האיחור ה-<strong>${delayCount}</strong> שלך.</p>
      ${cancelled ? `
      <div style="margin-top:20px; padding:16px; background:#fef2f2; border:2px solid #ef4444; border-radius:12px;">
        <strong style="color:#991b1b;">⛔ המנוי שלך בוטל אוטומטית עקב 3 איחורים.</strong>
        <p style="margin: 8px 0 0; color:#7f1d1d;">פנה לסדרן לחידוש המנוי.</p>
      </div>` : ''}
    `),
    text: `Late return: ${minutesLate} min, delay count: ${delayCount}${cancelled ? ' — subscription cancelled' : ''}`,
  });

export const sendReservationCancelledEmail = async (user, { reason }) =>
  sendEmail({
    to: user.email,
    subject: 'הזמנת חניה בוטלה - ParkGo',
    html: wrap(`
      <h2 style="margin:0 0 12px; font-size:22px;">שלום ${user.first_name},</h2>
      <p style="line-height:1.6;">הזמנת החניה שלך בוטלה.</p>
      <p style="line-height:1.6;"><strong>סיבה:</strong> ${reason}</p>
    `),
    text: `Reservation cancelled. Reason: ${reason}`,
  });
