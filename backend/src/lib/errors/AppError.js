const errorCodes = require('./errorCodes');

/**
 * Clase base para errores del backend. Estandariza la forma de describir errores esperados en el backend con un contrato común.
 * Todas las capas pueden lanzar AppError o una subclase para describir un fallo esperado con `statusCode`, `code`, `details`...
 */

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