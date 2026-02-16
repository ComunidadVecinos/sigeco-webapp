const nodemailer = require('nodemailer');

function getMailerConfig() {
  return {
    host: process.env.SMTP_HOST || 'mailpit',
    port: Number(process.env.SMTP_PORT || 1025),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
  };
}

function getDefaultFrom() {
  return process.env.MAIL_FROM || 'no-reply@sigeco.local';
}

function createTransporter() {
  return nodemailer.createTransport(getMailerConfig());
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: getDefaultFrom(),
    to,
    subject,
    text,
    html
  });
}

module.exports = {
  sendMail
};
