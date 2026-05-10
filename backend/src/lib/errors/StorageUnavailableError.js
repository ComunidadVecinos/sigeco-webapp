// Error de infraestructura para fallos de I/O en el almacenamiento local.
// Lo usan storage y los servicios que dependen de él para distinguirlo de un error de negocio.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class StorageUnavailableError extends AppError {
  constructor(message = 'El almacenamiento no está disponible', options = {}) {
    super(message, { statusCode: 503, code: errorCodes.STORAGE_UNAVAILABLE, ...options });
  }
}

module.exports = StorageUnavailableError;