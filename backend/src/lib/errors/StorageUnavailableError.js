const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Error de infraestructura para fallos de IO en el almacenamiento local.
class StorageUnavailableError extends AppError {
  constructor(message = 'El almacenamiento no está disponible', options = {}) {
    super(message, { statusCode: 503, code: errorCodes.STORAGE_UNAVAILABLE, ...options });
  }
}

module.exports = StorageUnavailableError;