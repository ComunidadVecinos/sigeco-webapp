// Error para requests autenticadas que no tienen permisos suficientes para continuar.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class ForbiddenError extends AppError {
  constructor(message = 'Acceso no autorizado', options = {}) {
    super(message, { statusCode: 403, code: options.code || errorCodes.FORBIDDEN, details: options.details, cause: options.cause });
  }
}

module.exports = ForbiddenError;