// Clase base de errores controlados del backend.
// Fija el contrato común (statusCode, code, details, cause) que luego consume el error handler.
const errorCodes = require('./errorCodes');

class AppError extends Error {
  constructor(message, statusCodeOrOptions = 500, code = errorCodes.INTERNAL_ERROR, details = undefined) {
    const options = typeof statusCodeOrOptions === 'object' && statusCodeOrOptions !== null ? statusCodeOrOptions : { statusCode: statusCodeOrOptions, code, details };

    super(message, options.cause ? { cause: options.cause } : undefined);

    this.name = new.target.name;
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? errorCodes.INTERNAL_ERROR;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.cause = options.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

module.exports = AppError;