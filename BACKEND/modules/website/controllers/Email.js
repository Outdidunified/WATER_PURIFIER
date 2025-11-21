const nodemailer = require('nodemailer');

// Create transporter
// const transporter = nodemailer.createTransport({
//   host: 'smtppro.zoho.in',
//   port: 465,
//   secure: true,
//   auth: {
//     user: 'anish@outdidtech.com',
//     pass: '5XuiNJvgeijM',
//   },
// });

// Create a transporter object
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Gmail SMTP server
    port: 465, // 465 for SSL or 587 for TLS
    secure: true, // true for SSL
    auth: {
        user: "info@outdidunified.com", // Your Gmail email address
        pass: "yylh zjwo psvr slqb", // App Password (not your regular Gmail password)
    },
});

// Generic send email
async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Water Purifier Service" <info@outdidunified.com>',
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
async function sendOtpEmail(email, otp, password = null) {
  const subject = 'Water Purifier Website - OTP for Login';
  const text = `Hello ${email},\n\nYour OTP is: ${otp}${password ? `\nYour temporary password: ${password}` : ''}`;

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Water Purifier Website</h2>
      <p>Hello <strong>${email}</strong>,</p>
      <p>Your OTP is:</p>
      <div style="font-size: 20px; font-weight: bold;">${otp}</div>
      ${password ? `<p>Your temporary password is: <strong>${password}</strong></p>` : ''}
      <p>Use this password for email login.</p>
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
  sendEmail,
  sendOtpEmail,
  sendSubscriptionConfirmationEmail,
};
