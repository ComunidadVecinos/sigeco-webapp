const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Error para archivos con formato no permitido.
class FileTypeUnsupportedError extends AppError {
  constructor(message = 'El tipo de archivo no está permitido', options = {}) {
    super(message, { statusCode: 415, code: errorCodes.FILE_TYPE_UNSUPPORTED, ...options });
  }
}

module.exports = FileTypeUnsupportedError;