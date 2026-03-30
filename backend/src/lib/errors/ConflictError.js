const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Error para conflictos de estado o unicidad detectados por negocio.
class ConflictError extends AppError {
  constructor(message = 'Conflicto en la operación solicitada', options = {}) {
    super(message, { statusCode: 409, code: options.code || errorCodes.CONFLICT, details: options.details, cause: options.cause });
  }
}

module.exports = ConflictError;