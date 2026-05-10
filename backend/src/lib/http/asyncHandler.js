// Wrapper pequeño para handlers async de Express.
// Evita repetir try/catch en controladores y deja que errorHandler cierre el flujo.

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;