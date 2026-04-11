const multer = require('multer');

const { FileTooLargeError, FileTypeUnsupportedError } = require('../errors');

/**
 * Middleware de subida de imágenes en memoria.
 *
 * Casos actuales:
 * - `avatar` en `users` y `communities`
 * - `image` en `news`
 *
 * Decisiones de diseño:
 * - Se usa `memoryStorage()` porque el archivo aún no debe persistirse al entrar en la request. Primero se valida y luego el servicio decide si lo guarda.
 * - Multer resuelve el parseo de `multipart/form-data`.
 * - Aquí se validan tamaño máximo y MIME declarado.
 * - La validación binaria real se hace después con `imageMetadata`, para no confiar solo en la extensión o en el `Content-Type` enviado por el cliente.
 */

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter(req, file, cb) {
    // Filtro rápido por MIME declarado. La inspección del binario se hace en la capa de servicio antes de persistir.
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new FileTypeUnsupportedError('Solo se admiten imágenes JPG y PNG'));
      return;
    }
    cb(null, true);
  }
});


// Procesa un archivo avatar en memoria y traduce errores de Multer al contrato de errores.
function createImageUpload(fieldName) {
  return function uploadImage(req, res, next) {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) {
        return next();
      }
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        // Se traduce para no filtrar detalles de Multer.
        return next(new FileTooLargeError(`No se admiten imágenes de más de ${MAX_IMAGE_SIZE_BYTES} bytes.`));
      }
      return next(error);
    });
  };
}

const uploadAvatar = createImageUpload('avatar');

module.exports = { uploadAvatar, createImageUpload, MAX_AVATAR_SIZE_BYTES, MAX_IMAGE_SIZE_BYTES };