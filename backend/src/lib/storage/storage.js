const crypto = require('crypto');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');

const { StorageUnavailableError } = require('../errors');

/**
 * Servicio de almacenamiento local usado por los módulos que publican archivos:
 * - Resolver la raíz física `storage/` del proyecto.
 * - Traducir rutas relativas persistidas en BD a URLs públicas `/uploads/...`.
 * - Reemplazar archivos de forma segura sobre el filesystem local.
 *
 * Convención de rutas públicas:
 * - Avatar de usuario:   `uploads/images/users/<userId>/avatar.<ext>`
 * - Avatar de comunidad: `uploads/images/communities/<communityId>/avatar.<ext>`
 * - Imagen de noticia:   `uploads/images/communities/<communityId>/news/<newsId>/image.<ext>`
 * - Imagen de incidencia: `uploads/images/communities/<communityId>/incidents/<incidentId>/image.<ext>`
 * 
 * - En BD se persiste siempre una ruta relativa a `storage/`, nunca una ruta absoluta.
 * - Express publica `storage/uploads` bajo la URL `/uploads`.
 */

// Raíz física del almacenamiento local del proyecto.
function getStorageRootPath() {
  return path.resolve(process.cwd(), 'storage');
}

// Subárbol que Express publica como contenido estático bajo `/uploads`.
function getUploadsRootPath() {
  return path.join(getStorageRootPath(), 'uploads');
}

// Normaliza separadores para que la ruta persistida sea estable en Windows/Linux.
function normalizeStoragePath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

// Convierte la ruta relativa persistida en una ruta absoluta del filesystem local.
function getAbsoluteStoragePath(storagePath) {
  return path.join(getStorageRootPath(), storagePath);
}

// Traduce una ruta relativa persistida a la URL pública que sirve Express.
function getPublicFileUrl(storagePath) {
  return storagePath ? `/${normalizeStoragePath(storagePath)}` : null;
}

// Construye la ruta estable del avatar de un usuario.
function buildUserAvatarStoragePath(userId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'users', userId, `avatar.${extension}`));
}

// Construye la ruta estable del avatar de una comunidad.
function buildCommunityAvatarStoragePath(communityId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'communities', communityId, `avatar.${extension}`));
}

// Construye la ruta estable de la imagen asociada a una noticia.
// Se fija por `communityId + newsId` para que cada noticia tenga como máximo una imagen pública.
function buildCommunityNewsImageStoragePath(communityId, newsId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'communities', communityId, 'news', newsId, `image.${extension}`));
}

// Construye la ruta estable de la imagen asociada a una incidencia comunitaria.
// Se fija por `communityId + incidentId` para que cada incidencia tenga como maximo una imagen publica.
function buildCommunityIncidentImageStoragePath(communityId, incidentId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'communities', communityId, 'incidents', incidentId, `image.${extension}`));
}

// Construye la ruta privada estable de un documento comunitario.
function buildCommunityDocumentStoragePath(communityId, documentId, extension) {
  return normalizeStoragePath(path.join('private', 'documents', 'communities', communityId, `${documentId}.${extension}`));
}

// Asegura que el directorio destino exista antes de escribir el archivo.
async function ensureDirectory(absoluteDirectoryPath) {
  try {
    await fs.mkdir(absoluteDirectoryPath, { recursive: true });
  } 
  catch (error) {
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

// Escritura simple a disco encapsulada para unificar el contrato de error.
async function writeFile(absolutePath, buffer) {
  try {
    await fs.writeFile(absolutePath, buffer);
  } 
  catch (error) {
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

// Comprueba si ya existe un archivo en la ruta destino.
async function pathExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } 
  catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

// Elimina una ruta absoluta si existe; la ausencia no se considera error.
async function deleteAbsolutePathIfExists(absolutePath) {
  try {
    await fs.unlink(absolutePath);
  } 
  catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

/**
 * Reemplaza un archivo físico de forma segura y devuelve un handler de `commit/rollback` para coordinar el filesystem con una transacción de BD.
 * 1. Se escribe primero un temporal.
 * 2. Si ya existía un archivo destino, se mueve a backup.
 * 3. El temporal se promociona al path final.
 * 4. El servicio llamador decide:
 *    - `commit()`: consolidar el cambio y limpiar backup/anterior.
 *    - `rollback()`: restaurar el estado previo si la operación de negocio falla.
 */
async function replaceStoredFile(storagePath, previousStoragePath, buffer) {
  const normalizedStoragePath = normalizeStoragePath(storagePath);
  const normalizedPreviousStoragePath = previousStoragePath ? normalizeStoragePath(previousStoragePath) : null;
  const absolutePath = getAbsoluteStoragePath(normalizedStoragePath);
  const tempAbsolutePath = `${absolutePath}.tmp-${crypto.randomUUID()}`;
  const backupAbsolutePath = `${absolutePath}.bak-${crypto.randomUUID()}`;
  const hasTargetFile = await pathExists(absolutePath);

  await ensureDirectory(path.dirname(absolutePath));
  await writeFile(tempAbsolutePath, buffer);

  try {
    if (hasTargetFile) {
      await fs.rename(absolutePath, backupAbsolutePath);
    }

    await fs.rename(tempAbsolutePath, absolutePath);
  } 
  catch (error) {
    await deleteStoredFile(normalizedStoragePath).catch(() => {});
    await deleteAbsolutePathIfExists(tempAbsolutePath).catch(() => {});

    if (hasTargetFile) {
      try {
        await fs.rename(backupAbsolutePath, absolutePath);
      } 
      catch (restoreError) {
        throw new StorageUnavailableError(undefined, { cause: restoreError });
      }
    }

    throw new StorageUnavailableError(undefined, { cause: error });
  }

  return {
    storagePath: normalizedStoragePath,
    async commit() {
      // Se confirma el cambio solo cuando la transacción de BD también ha sido persistida con éxito.
      if (hasTargetFile) {
        await deleteAbsolutePathIfExists(backupAbsolutePath);
      }

      if (normalizedPreviousStoragePath &&  normalizedPreviousStoragePath !== normalizedStoragePath) {
        await deleteStoredFile(normalizedPreviousStoragePath);
      }
    },
    async rollback() {
      // Si negocio falla después de escribir el archivo, se restaura el estado previo para no dejar el filesystem desalineado con la BD.
      await deleteStoredFile(normalizedStoragePath).catch(() => {});

      if (hasTargetFile) {
        try {
          await fs.rename(backupAbsolutePath, absolutePath);
        } 
        catch (error) {
          throw new StorageUnavailableError(undefined, { cause: error });
        }
        return;
      }

      if (normalizedPreviousStoragePath && normalizedPreviousStoragePath !== normalizedStoragePath) {
        await deleteStoredFile(normalizedStoragePath).catch(() => {});
      }
    }
  };
}

// Reemplaza el avatar de un usuario devolviendo un handler de commit/rollback.
async function replaceUserAvatarFile({ userId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildUserAvatarStoragePath(userId, extension), previousStoragePath, buffer);
}

// Reemplaza el avatar de una comunidad devolviendo un handler de commit/rollback.
async function replaceCommunityAvatarFile({ communityId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityAvatarStoragePath(communityId, extension), previousStoragePath, buffer);
}

// Reemplaza la imagen asociada a una noticia comunitaria manteniendo una única ruta pública estable por noticia.
async function replaceCommunityNewsImageFile({ communityId, newsId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityNewsImageStoragePath(communityId, newsId, extension), previousStoragePath, buffer);
}

// Reemplaza la imagen asociada a una incidencia comunitaria manteniendo una unica ruta publica estable por incidencia.
async function replaceCommunityIncidentImageFile({ communityId, incidentId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityIncidentImageStoragePath(communityId, incidentId, extension), previousStoragePath, buffer);
}

// Reemplaza el fichero asociado a un documento comunitario manteniendo una ruta privada estable por documento.
async function replaceCommunityDocumentFile({ communityId, documentId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityDocumentStoragePath(communityId, documentId, extension), previousStoragePath, buffer);
}

// Elimina un archivo persistido si existe, sin tratar la ausencia como error.
async function deleteStoredFile(storagePath) {
  if (!storagePath) {
    return;
  }
  const absolutePath = getAbsoluteStoragePath(storagePath);
  try {
    await fs.unlink(absolutePath);
  } 
  catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

// Confirma un fichero ya escrito y registra cualquier fallo de limpieza sin convertirlo en un error de negocio.
async function commitStoredFileSafely(storedFile, warningMessage, context = {}) {
  if (!storedFile) {
    return;
  }

  await storedFile.commit().catch((error) => {
    console.warn(warningMessage, { ...context, storagePath: storedFile.storagePath, error });
  });
}

// Intenta restaurar el fichero previo cuando la operación de negocio falla.
// Si la restauración también falla, solo se registra para no tapar el error original.
async function rollbackStoredFileSafely(storedFile, warningMessage, context = {}) {
  if (!storedFile) {
    return;
  }

  await storedFile.rollback().catch((error) => {
    console.warn(warningMessage, { ...context, storagePath: storedFile.storagePath, error });
  });
}

// Borra un fichero fuera de la transacción y registra el fallo si el filesystem no puede limpiarlo.
async function deleteStoredFileSafely(storagePath, warningMessage, context = {}) {
  if (!storagePath) {
    return;
  }

  await deleteStoredFile(storagePath).catch((error) => {
    console.warn(warningMessage, { ...context, storagePath, error });
  });
}

// Abre un stream de lectura para servir un fichero protegido ya persistido.
async function createStoredFileReadStream(storagePath) {
  if (!storagePath) {
    throw new StorageUnavailableError('No se ha indicado una ruta de almacenamiento válida');
  }

  const absolutePath = getAbsoluteStoragePath(storagePath);

  try {
    await fs.access(absolutePath);
  }
  catch (error) {
    throw new StorageUnavailableError(undefined, { cause: error });
  }

  return fsSync.createReadStream(absolutePath);
}

module.exports = {
  getUploadsRootPath,
  getPublicFileUrl,
  replaceUserAvatarFile,
  replaceCommunityAvatarFile,
  replaceCommunityNewsImageFile,
  replaceCommunityIncidentImageFile,
  replaceCommunityDocumentFile,
  createStoredFileReadStream,
  deleteStoredFile,
  commitStoredFileSafely,
  rollbackStoredFileSafely,
  deleteStoredFileSafely
};
