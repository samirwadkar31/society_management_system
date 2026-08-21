const nodemailer = require('nodemailer');

async function sendMail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured. Would send to', to);
    console.log(subject);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Kutumb Society" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
  return { skipped: false };
}

module.exports = { sendMail };
