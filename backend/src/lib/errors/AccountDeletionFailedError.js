// Error de backend para fallos inesperados durante la baja completa de una cuenta.
// Se usa cuando la limpieza transversal no puede cerrarse de forma segura.
const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

class AccountDeletionFailedError extends AppError {
  constructor(message = 'No se ha podido eliminar la cuenta', options = {}) {
    super(message, { statusCode: 500, code: errorCodes.ACCOUNT_DELETION_FAILED, ...options });
  }
}

module.exports = AccountDeletionFailedError;