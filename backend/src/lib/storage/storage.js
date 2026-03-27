const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const { StorageUnavailableError } = require('../errors');

/**
 * Servicio de almacenamiento local usada por los módulos que publican archivos.
 * Expone rutas públicas y operaciones de reemplazo seguro sobre el filesystem.
 */

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

// Traduce una ruta relativa de storage a la URL publica que sirve Express.
function getPublicFileUrl(storagePath) {
  return storagePath ? `/${normalizeStoragePath(storagePath)}` : null;
}

function buildUserAvatarStoragePath(userId, extension) {
  return normalizeStoragePath(
    path.join('uploads', 'images', 'users', userId, `avatar.${extension}`)
  );
}

function buildCommunityAvatarStoragePath(communityId, extension) {
  return normalizeStoragePath(
    path.join('uploads', 'images', 'communities', communityId, `avatar.${extension}`)
  );
}

async function ensureDirectory(absoluteDirectoryPath) {
  try {
    await fs.mkdir(absoluteDirectoryPath, { recursive: true });
  } 
  catch (error) {
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

async function writeFile(absolutePath, buffer) {
  try {
    await fs.writeFile(absolutePath, buffer);
  } 
  catch (error) {
    throw new StorageUnavailableError(undefined, { cause: error });
  }
}

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
    // Escribimos en temporal y promovemos por rename para no dejar archivos parciales si la operación falla durante el reemplazo.
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
      // Se confirma el cambio solo cuando la transacción también ha sido persistida con éxito.
      if (hasTargetFile) {
        await deleteAbsolutePathIfExists(backupAbsolutePath);
      }

      if (normalizedPreviousStoragePath &&  normalizedPreviousStoragePath !== normalizedStoragePath) {
        await deleteStoredFile(normalizedPreviousStoragePath);
      }
    },
    async rollback() {
      // Si la capa de negocio falla después de escribir el archivo, se restaura el estado previo para no dejar el filesystem desalineado con la BD.
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

//Reemplaza el avatar de un usuario devolviendo un handler de commit/rollback.
async function replaceUserAvatarFile({ userId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildUserAvatarStoragePath(userId, extension), previousStoragePath, buffer);
}

// Reemplaza el avatar de una comunidad devolviendo un handler de commit/rollback.
async function replaceCommunityAvatarFile({ communityId, previousStoragePath, buffer, extension }) {
  return replaceStoredFile(buildCommunityAvatarStoragePath(communityId, extension), previousStoragePath, buffer);
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

module.exports = { getUploadsRootPath, getPublicFileUrl, replaceUserAvatarFile, replaceCommunityAvatarFile, deleteStoredFile };