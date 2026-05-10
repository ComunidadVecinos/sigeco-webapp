// Error de integración para fallos del proveedor SMTP.
// Permite distinguir un problema de correo de un fallo interno genérico.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class EmailServiceUnavailableError extends AppError {
  constructor(message = 'El servicio de correo no está disponible', options = {}) {
    super(message, { statusCode: 502, code: options.code || errorCodes.EMAIL_SERVICE_UNAVAILABLE, details: options.details, cause: options.cause });
  }
}

module.exports = EmailServiceUnavailableError;