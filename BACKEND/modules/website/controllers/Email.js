const nodemailer = require('nodemailer');

// Create a transporter object with SMTP details
const transporter = nodemailer.createTransport({
  host: 'smtppro.zoho.in', // SMTP server address
  port: 465, // Use 465 for SSL, 587 for TLS
  secure: true, // Use SSL (true) or TLS (false)
  auth: {
    user: 'anish@outdidtech.com', // Your email address
    pass: '5XuiNJvgeijM', // Your email password
  },
});

// Function to send an email
async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Water Purifier Service" <anish@outdidtech.com>', // Sender's address
      to: to, // Recipient's address
      subject: subject, // Subject line
      text: text, // Plain text body
      html: html, // HTML body
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Function to configure and send the OTP email for login
async function EmailConfig(email, otp) {
  try {
    const subject = 'Water Purifier Website - OTP for Login';
    const text = `Hello ${email},\n\nYou requested to login to your Water Purifier account. Please use the following One-Time Password (OTP):\n\n${otp}\n\nIf you did not request this, please ignore the email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">Water Purifier Website</h2>
        <p style="color: #555; line-height: 1.5; font-size: 16px;">
          Hello <strong>${email}</strong>,<br><br>
          You requested to log in to your account. Please use the following One-Time Password (OTP) to proceed:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 20px; font-weight: bold; color: #007BFF; padding: 10px 20px; border: 1px dashed #007BFF; border-radius: 5px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="color: #555; line-height: 1.5; font-size: 16px;">
          This OTP is valid for a limited time. Do not share it with anyone. If you did not initiate this login request, please ignore this email or contact our support team.
        </p>
        <p style="color: #555; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Thank you,<br>
          <strong>Water Purifier Team</strong><br>
          <a href="https://waterpurifierwebsite.com" style="color: #007BFF; text-decoration: none;">Visit Our Website</a>
        </p>
      </div>
    `;

    const result = await sendEmail(email, subject, text, html);
    return result;
  } catch (error) {
    console.error('Error in EmailConfig:', error);
    return false;
  }
}

module.exports = { EmailConfig };
