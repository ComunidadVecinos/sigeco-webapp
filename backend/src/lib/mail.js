const nodemailer = require('nodemailer');
const { EmailServiceUnavailableError } = require('./errors');

/**
 * Helpers para envío de correo desde el backend.
 * Utilizado por auth para el envío de correos de recuperación de contraseña; desacoplado para poder reutilizarse en otros servicios.
 */

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

// Envía un correo usando la configuración SMTP compartida del proceso. Las excepciones se traducen a EmailServiceUnavailableError.
async function sendMail({ to, subject, text, html }) {
  try {
    return await getTransporter().sendMail({ from: getDefaultFrom(), to, subject, text, html });
  } 
  catch (error) {
    throw new EmailServiceUnavailableError(undefined, { cause: error });
  }
}

module.exports = { sendMail };