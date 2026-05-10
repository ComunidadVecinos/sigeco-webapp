// Normalizador central de errores.
// Convierte valores arbitrarios, Zod y errores de Express al contrato AppError que entiende errorHandler.
const { ZodError } = require('zod');

const AppError = require('./AppError');
const ValidationError = require('./ValidationError');
const errorCodes = require('./errorCodes');

// Detecta el error típico de JSON malformado lanzado por express.json().
function isMalformedJsonBodyError(error) {
  return ( error instanceof SyntaxError && (error.status === 400 || error.statusCode === 400) && error.type === 'entity.parse.failed' );
}

// Normaliza cualquier valor lanzado a una instancia de AppError.
function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }
  // Errores de validación de Zod
  if (error instanceof ZodError) {
    return new ValidationError(error);
  }
  // Errores por JSON malformado (express.json() falla antes de llegar a los esquemas Zod de cada módulo).
  if (isMalformedJsonBodyError(error)) {
    return new ValidationError(
      [{ location: 'body', message: 'El cuerpo JSON no tiene un formato válido' }], { message: 'Error de validación', statusCode: 400 }
    );
  }
  // Resto de errores no controlados
  if (error instanceof Error) {
    return new AppError('Ha ocurrido un error inesperado', { statusCode: 500, code: errorCodes.INTERNAL_ERROR, cause: error, isOperational: false });
  }

  return new AppError('Ha ocurrido un error inesperado', { statusCode: 500, code: errorCodes.INTERNAL_ERROR, details: { receivedType: typeof error }, isOperational: false });
}

module.exports = normalizeError;