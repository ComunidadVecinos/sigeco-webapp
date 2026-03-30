const multer = require('multer');

const { FileTooLargeError, FileTypeUnsupportedError } = require('../errors');

/**
 * Middleware de subida de avatar (imágenes png y jpg) compartido por users y communities.
 * Multer se usa para parsear multipart/form-data, limitar tamaño y rechazar MIME no soportados (validacion binaria en imageMetadata).
 */

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
  fileFilter(req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new FileTypeUnsupportedError('Solo se admiten imágenes JPG y PNG'));
      return;
    }
    cb(null, true);
  }
});


// Procesa un archivo avatar en memoria y traduce errores de Multer al contrato de errores del backend.
function uploadAvatar(req, res, next) {
  upload.single('avatar')(req, res, (error) => {
    if (!error) {
      return next();
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new FileTooLargeError(`No se admiten imágenes de más de ${MAX_AVATAR_SIZE_BYTES} bytes.`));
    }
    return next(error);
  });
}

module.exports = { uploadAvatar, MAX_AVATAR_SIZE_BYTES };