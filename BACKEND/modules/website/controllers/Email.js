const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtppro.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: 'anish@outdidtech.com',
    pass: '5XuiNJvgeijM',
  },
});

// Generic send email
async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Water Purifier Service" <anish@outdidtech.com>',
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
}

// OTP Email
async function sendOtpEmail(email, otp) {
  const subject = 'Water Purifier Website - OTP for Login';
  const text = `Hello ${email},\n\nYou requested to login... Your OTP is: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Water Purifier Website</h2>
      <p>Hello <strong>${email}</strong>,</p>
      <p>Your OTP is:</p>
      <div style="font-size: 20px; font-weight: bold;">${otp}</div>
    </div>
  `;
  return sendEmail(email, subject, text, html);
}

// Subscription Confirmation Email
async function sendSubscriptionConfirmationEmail(user, order, userNewExpiry) {
  const subject = 'Water Purifier - Subscription Confirmed';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Hi ${user.name || 'Customer'},</h2>
      <p>Your subscription has been successfully activated!</p>
      <ul>
        <li><strong>Product:</strong> ${order.modelName}</li>
        <li><strong>Plan:</strong> ${order.selectedPlan?.label}</li>
        <li><strong>Duration:</strong> ${order.selectedDuration?.duration_time_limit}</li>
        <li><strong>Subscription Expiry:</strong> ${userNewExpiry.toDateString()}</li>
      </ul>
      <p>Thank you for choosing us!</p>
      <p>— Water Purifier Team</p>
    </div>
  `;
  return sendEmail(user.email, subject, '', html);
}

module.exports = {
  sendOtpEmail,
  sendSubscriptionConfirmationEmail,
};
