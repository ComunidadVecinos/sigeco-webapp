const multer = require('multer');

const { FileTooLargeError, FileTypeUnsupportedError } = require('../errors');

const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      cb(new FileTypeUnsupportedError('Solo se admiten documentos PDF'));
      return;
    }

    cb(null, true);
  }
});

function uploadDocument(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new FileTooLargeError(`No se admiten documentos de más de ${MAX_DOCUMENT_SIZE_BYTES} bytes.`));
    }

    return next(error);
  });
}

module.exports = { uploadDocument, MAX_DOCUMENT_SIZE_BYTES };
