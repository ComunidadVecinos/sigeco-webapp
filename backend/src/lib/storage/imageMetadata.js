const { FileTypeUnsupportedError } = require('../errors');

/**
 * Inspección binaria mínima para imágenes subidas por usuarios.
 * - No confiar solo en el MIME declarado por el cliente.
 * - Detectar de forma simple si el buffer parece realmente un JPG o un PNG.
 * - Solo se admiten `image/jpeg` y `image/png`.
 * - Solo devolvemos la metadata necesaria para persistir el archivo con una extensión coherente (`jpg` o `png`).
 */

const ALLOWED_IMAGE_SIGNATURES = { 'image/jpeg': { extension: 'jpg' }, 'image/png': { extension: 'png' } };

function detectImageMimeType(buffer) {
  if (!buffer || buffer.length < 8) {
    // El archivo puede venir corrupto o incompleto; se devuelve un mensaje comprensible para el usuario.
    throw new FileTypeUnsupportedError('El archivo de imagen no es válido');
  }
  // Firma binaria mínima de JPEG.
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return 'image/jpeg';
  }

  // Firma binaria estándar de PNG.
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isPng) {
    return 'image/png';
  }
  throw new FileTypeUnsupportedError('Solo se admiten imágenes JPG y PNG');
}

function getImageExtension(mimeType) {
  return ALLOWED_IMAGE_SIGNATURES[mimeType]?.extension || null;
}

// Extrae metadata mínima necesaria para persistir una imagen validada (solo necesitamos la extensión final).
function inspectImageBuffer(buffer) {
  const mimeType = detectImageMimeType(buffer);

  return { extension: getImageExtension(mimeType) };
}

module.exports = { inspectImageBuffer };