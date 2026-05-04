// Cliente de correo del backend.
// Centraliza la configuración SMTP y traduce fallos del proveedor a un error de infraestructura común.
const nodemailer = require('nodemailer');
const { EmailServiceUnavailableError } = require('./errors');

let transporter;

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

function getTransporter() {
  if (!transporter) {
    // Reutilizamos el transporter para no recrear conexiones en cada envío.
    transporter = nodemailer.createTransport(getMailerConfig());
  }
  return transporter;
}

// Envía un correo con la configuración compartida del proceso.
async function sendMail({ to, subject, text, html }) {
  try {
    return await getTransporter().sendMail({ from: getDefaultFrom(), to, subject, text, html });
  } 
  catch (error) {
    throw new EmailServiceUnavailableError(undefined, { cause: error });
  }
}

module.exports = { sendMail };