// Error para archivos que superan el tamaño permitido por la aplicación.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class FileTooLargeError extends AppError {
  constructor(message = 'El archivo supera el tamaño permitido', options = {}) {
    super(message, { statusCode: 413, code: errorCodes.FILE_TOO_LARGE, ...options });
  }
}

module.exports = FileTooLargeError;