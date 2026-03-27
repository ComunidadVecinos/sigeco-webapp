/**
 * Envuelve handlers async de Express y redirige cualquier rechazo a `next`.
 * Evita repetir bloques try/catch en controllers y garantiza que los errores terminen en `errorHandler`.
 */

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;