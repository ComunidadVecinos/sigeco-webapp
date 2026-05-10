const fs = require('fs/promises');
const path = require('path');

const { getUploadsRootPath } = require('../src/lib/storage/storage');

// Comprueba existencia sin convertir la ausencia de ruta en un error fatal.
async function pathExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

// Replica recursivamente los assets versionados del seed dentro del storage runtime.
async function syncSeedAssetsDirectory(sourceRootPath, targetRootPath) {
  if (!(await pathExists(sourceRootPath))) {
    return;
  }

  await fs.mkdir(targetRootPath, { recursive: true });

  const entries = await fs.readdir(sourceRootPath, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntryPath = path.join(sourceRootPath, entry.name);
    const targetEntryPath = path.join(targetRootPath, entry.name);

    if (entry.isDirectory()) {
      await syncSeedAssetsDirectory(sourceEntryPath, targetEntryPath);
      continue;
    }

    if (await pathExists(targetEntryPath)) {
      continue;
    }

    await fs.mkdir(path.dirname(targetEntryPath), { recursive: true });
    await fs.copyFile(sourceEntryPath, targetEntryPath);
  }
}

async function initializeSeedAssetsStorage() {
  // Los assets del seed viven versionados en prisma/assets/uploads y se copian al storage runtime solo si faltan. 
  // El volumen Docker puede arrancar vacio.
  const uploadsRootPath = getUploadsRootPath();
  const bundledUploadsRootPath = path.resolve(process.cwd(), 'prisma', 'assets', 'uploads');

  // Garantiza la raiz de uploads aunque el volumen o la carpeta local no exista todavia.
  await fs.mkdir(uploadsRootPath, { recursive: true });
  await syncSeedAssetsDirectory(bundledUploadsRootPath, uploadsRootPath);

}

module.exports = { initializeSeedAssetsStorage };
