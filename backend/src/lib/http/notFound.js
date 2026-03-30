const { NotFoundError } = require('../errors');

/**
 * Cierra el pipeline HTTP cuando ninguna ruta ha respondido. Se delega en NotFoundError.
 */

function notFound(req, res, next) {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;