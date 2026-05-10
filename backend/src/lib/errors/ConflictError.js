// Error para conflictos de negocio: estados incompatibles, duplicados o colisiones de unicidad.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class ConflictError extends AppError {
  constructor(message = 'Conflicto en la operación solicitada', options = {}) {
    super(message, { statusCode: 409, code: options.code || errorCodes.CONFLICT, details: options.details, cause: options.cause });
  }
}

module.exports = ConflictError;