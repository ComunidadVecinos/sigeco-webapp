
// Punto de entrada único para los contratos de error (facilita imports desde middlewares, servicios y adaptadores).

module.exports = {
  AccountDeletionFailedError: require('./AccountDeletionFailedError'),
  AppError: require('./AppError'),
  ConflictError: require('./ConflictError'),
  EmailServiceUnavailableError: require('./EmailServiceUnavailableError'),
  errorCodes: require('./errorCodes'),
  FileTooLargeError: require('./FileTooLargeError'),
  FileTypeUnsupportedError: require('./FileTypeUnsupportedError'),
  ForbiddenError: require('./ForbiddenError'),
  normalizeError: require('./normalizeError'),
  NotFoundError: require('./NotFoundError'),
  StorageUnavailableError: require('./StorageUnavailableError'),
  UnauthorizedError: require('./UnauthorizedError'),
  ValidationError: require('./ValidationError')
};
