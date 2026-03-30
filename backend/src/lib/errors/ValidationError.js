const AppError = require('./AppError');
const errorCodes = require('./errorCodes');
const formatZodIssues = require('../validation/formatZodIssues');

// Error para validaciones de formularios o datos de entrada que no cumplen con los requisitos esperados.
class ValidationError extends AppError {
  constructor(detailsOrError, options = {}) {
    const details = Array.isArray(detailsOrError) ? detailsOrError : formatZodIssues(detailsOrError, options.location);

    // El mensaje general de validación se traduce para respuestas con múltiples campos erróneos.
    super(options.message || 'Error de validación', {
      statusCode: options.statusCode ?? 422,
      code: options.code ?? errorCodes.VALIDATION_ERROR,
      details,
      cause: detailsOrError instanceof Error ? detailsOrError : undefined
    });
  }
}

module.exports = ValidationError;