// Middleware final de errores HTTP.
// Recibe cualquier fallo del pipeline, lo normaliza al contrato del backend y construye la respuesta JSON.
const { normalizeError } = require('../errors');

function sendError(res, error) {
  const payload = {
    error: { code: error.code, message: error.message }
  };
  if (error.details !== undefined) {
    payload.error.details = error.details;
  }
  return res.status(error.statusCode).json(payload);
}

// Solo registramos aquí el punto final del error; la decisión de qué error exponer vive en normalizeError.
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const error = normalizeError(err);
  const meta = { method: req.method, path: req.originalUrl, statusCode: error.statusCode, error };

  // Solo registramos fallos reales del servidor para reducir ruido en consola.
  if (error.statusCode >= 500) {
    console.error('Unhandled request error', meta);
  }
  return sendError(res, error);
}

module.exports = errorHandler;