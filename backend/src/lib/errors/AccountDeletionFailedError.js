const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Error para fallos inesperados durante el borrado de cuenta.
class AccountDeletionFailedError extends AppError {
  constructor(message = 'No se ha podido eliminar la cuenta', options = {}) {
    super(message, { statusCode: 500, code: errorCodes.ACCOUNT_DELETION_FAILED, ...options });
  }
}

module.exports = AccountDeletionFailedError;