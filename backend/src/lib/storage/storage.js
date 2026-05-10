// Capa de almacenamiento local del backend.
// Resuelve rutas físicas y públicas, y coordina escrituras seguras para no desalinear filesystem y base de datos.
const crypto = require('crypto');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');
const { StorageUnavailableError } = require('../errors');

// Rutas base y construcción de paths.
function getStorageRootPath() {
  return path.resolve(process.cwd(), 'storage');
}

function getUploadsRootPath() {
  return path.join(getStorageRootPath(), 'uploads');
}

function normalizeStoragePath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

function getAbsoluteStoragePath(storagePath) {
  return path.join(getStorageRootPath(), storagePath);
}

function getPublicFileUrl(storagePath) {
  return storagePath ? `/${normalizeStoragePath(storagePath)}` : null;
}

function buildUserAvatarStoragePath(userId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'users', userId, `avatar.${extension}`));
}

function buildCommunityAvatarStoragePath(communityId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'communities', communityId, `avatar.${extension}`));
}

// Se fija por "communityId + newsId" para que cada noticia tenga como máximo una imagen pública.
function buildCommunityNewsImageStoragePath(communityId, newsId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'communities', communityId, 'news', newsId, `image.${extension}`));
}

// Se fija por "communityId + incidentId" para que cada incidencia tenga como máximo una imagen pública.
function buildCommunityIncidentImageStoragePath(communityId, incidentId, extension) {
  return normalizeStoragePath(path.join('uploads', 'images', 'communities', communityId, 'incidents', incidentId, `image.${extension}`));
}

function buildCommunityDocumentStoragePath(communityId, documentId, extension) {
  return normalizeStoragePath(path.join('private', 'documents', 'communities', communityId, `${documentId}.${extension}`));
}

// Operaciones de filesystem con contrato de error común.
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

// Escrituras coordinadas con la base de datos.
// El servicio decide después si consolida el cambio o revierte el archivo según el resultado de negocio.
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

async function replaceUserAvatarFile({ userId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildUserAvatarStoragePath(userId, extension), previousStoragePath, buffer);
}

async function replaceCommunityAvatarFile({ communityId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityAvatarStoragePath(communityId, extension), previousStoragePath, buffer);
}

async function replaceCommunityNewsImageFile({ communityId, newsId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityNewsImageStoragePath(communityId, newsId, extension), previousStoragePath, buffer);
}

// Mantiene una única ruta pública estable por incidencia.
async function replaceCommunityIncidentImageFile({ communityId, incidentId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityIncidentImageStoragePath(communityId, incidentId, extension), previousStoragePath, buffer);
}

// Mantiene una ruta privada estable por documento.
async function replaceCommunityDocumentFile({ communityId, documentId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityDocumentStoragePath(communityId, documentId, extension), previousStoragePath, buffer);
}

// Lectura, borrado y limpiezas seguras.
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