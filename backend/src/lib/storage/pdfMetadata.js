const { FileTypeUnsupportedError } = require('../errors');

const PDF_SIGNATURE = Buffer.from('%PDF-');

// Valida la firma binaria mínima de un PDF sin depender solo del MIME o del nombre.
function inspectPdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PDF_SIGNATURE.length) {
    throw new FileTypeUnsupportedError('Solo se admiten documentos PDF');
  }

  const signature = buffer.subarray(0, PDF_SIGNATURE.length);

  if (!signature.equals(PDF_SIGNATURE)) {
    throw new FileTypeUnsupportedError('Solo se admiten documentos PDF');
  }

  return { extension: 'pdf' };
}

module.exports = { inspectPdfBuffer };
