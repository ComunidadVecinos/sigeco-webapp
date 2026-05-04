// Error para requests sin sesión válida o sin autenticación suficiente.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', options = {}) {
    super(message, { statusCode: 401, code: options.code || errorCodes.UNAUTHORIZED, details: options.details, cause: options.cause });
  }
}

module.exports = UnauthorizedError;