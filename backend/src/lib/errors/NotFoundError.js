// Error para recursos que no existen o no son accesibles con el identificador recibido.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', options = {}) {
    super(message, { statusCode: 404, code: options.code || errorCodes.NOT_FOUND, details: options.details, cause: options.cause  });
  }
}

module.exports = NotFoundError;