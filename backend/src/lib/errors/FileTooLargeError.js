const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Error para rechazos por tamaño máximo de archivo permitido.
class FileTooLargeError extends AppError {
  constructor(message = 'El archivo supera el tamaño permitido', options = {}) {
    super(message, { statusCode: 413, code: errorCodes.FILE_TOO_LARGE, ...options });
  }
}

module.exports = FileTooLargeError;