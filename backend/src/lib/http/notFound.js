// Middleware de cierre para rutas no resueltas.
// Convierte cualquier request sin match en el mismo NotFoundError que usa el resto del backend.
const { NotFoundError } = require('../errors');

function notFound(req, res, next) {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;