const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Error de integración usado cuando el proveedor SMTP no responde correctamente.
class EmailServiceUnavailableError extends AppError {
  constructor(message = 'El servicio de correo no está disponible', options = {}) {
    super(message, { statusCode: 502, code: options.code || errorCodes.EMAIL_SERVICE_UNAVAILABLE, details: options.details, cause: options.cause });
  }
}

module.exports = EmailServiceUnavailableError;