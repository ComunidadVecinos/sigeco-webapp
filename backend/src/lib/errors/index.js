// Punto de entrada único para el sistema de errores del backend.
// Simplifica imports desde servicios, middlewares y utilidades sin cambiar el contrato público.

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