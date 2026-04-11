const prisma = require('../../lib/prisma');

/**
 * Capa de acceso a datos del módulo documents, centralizado la lectura y escritura a la Base de Datos con Prisma.
 * El service delega toda la interacción con datos a este módulo, que expone funciones atómicas para cada operación.
 */

const folderSelect = {
  id: true,
  communityId: true,
  parentId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
};

const documentSelect = {
  id: true,
  communityId: true,
  folderId: true,
  uploadedByMembershipId: true,
  name: true,
  description: true,
  originalFilename: true,
  storagePath: true,
  mimeType: true,
  extension: true,
  sizeBytes: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
};

// Construye el filtro base para navegar un "ámbito" documental:
//   - una carpeta concreta con sus subcarpetas directas y sus documentos directos.
function scopeWhere({ communityId, parentId, search }) {
  const folderWhere = { communityId, parentId: parentId || null, deletedAt: null };
  const documentWhere = { communityId, folderId: parentId || null, deletedAt: null };

  if (!search) {
    return { folderWhere, documentWhere };
  }

  return {
    folderWhere: { ...folderWhere, name: { contains: search, mode: 'insensitive' } },
    documentWhere: {
      ...documentWhere,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalFilename: { contains: search, mode: 'insensitive' } }
      ]
    }
  };
}

async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

// --- Lecturas simples por id ---
async function findFolderById({ communityId, folderId }) {
  return prisma.communityFolder.findFirst({
    where: { id: folderId, communityId },
    select: folderSelect
  });
}

async function findDocumentById({ communityId, documentId }) {
  return prisma.communityDocument.findFirst({
    where: { id: documentId, communityId },
    select: documentSelect
  });
}

// --- Lecturas por ámbito ---
async function findFoldersInScope({ communityId, parentId, search }) {
  const { folderWhere } = scopeWhere({ communityId, parentId, search });

  // Orden alfabético estable para que la navegación no "salte" entre recargas.
  return prisma.communityFolder.findMany({
    where: folderWhere,
    select: folderSelect,
    orderBy: [{ name: 'asc' }, { id: 'asc' }]
  });
}

async function findDocumentsPageInScope({ communityId, parentId, search, page, pageSize }) {
  const { documentWhere } = scopeWhere({ communityId, parentId, search });
  // Prisma pagina por offset; aquí se traduce page/pageSize al skip habitual.
  const skip = (page - 1) * pageSize;

  // Se consulta total en una sola transacción para que la paginación salga coherente.
  const [total, items] = await prisma.$transaction([
    prisma.communityDocument.count({ where: documentWhere }),
    prisma.communityDocument.findMany({
      where: documentWhere,
      select: documentSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: pageSize
    })
  ]);

  return { total, items };
}

// --- Agregados para enriquecer el listado ---
async function countChildrenByParentIds(folderIds) {
  if (!folderIds || folderIds.length === 0) {
    return [];
  }

  // groupBy evita traer todas las filas hijas solo para contar.
  return prisma.communityFolder.groupBy({
    by: ['parentId'],
    where: { parentId: { in: folderIds }, deletedAt: null },
    _count: { _all: true }
  });
}

async function countDocumentsByFolderIds(folderIds) {
  if (!folderIds || folderIds.length === 0) {
    return [];
  }

  return prisma.communityDocument.groupBy({
    by: ['folderId'],
    where: { folderId: { in: folderIds }, deletedAt: null },
    _count: { _all: true }
  });
}

// --- Comprobaciones de unicidad por ámbito ---
async function findFolderNameConflict({ communityId, parentId, name, excludeFolderId }) {
  return prisma.communityFolder.findFirst({
    where: {
      communityId,
      parentId: parentId || null,
      name,
      deletedAt: null,
      // En renombrado se excluye la propia carpeta para no detectarse a sí misma.
      ...(excludeFolderId ? { id: { not: excludeFolderId } } : {})
    },
    select: { id: true }
  });
}

async function findDocumentNameConflict({ communityId, folderId, name, excludeDocumentId }) {
  return prisma.communityDocument.findFirst({
    where: {
      communityId,
      folderId: folderId || null,
      name,
      deletedAt: null,
      ...(excludeDocumentId ? { id: { not: excludeDocumentId } } : {})
    },
    select: { id: true }
  });
}

// --- Escrituras de carpetas y documentos ---
async function createFolder(db, input) {
  return db.communityFolder.create({
    data: {
      communityId: input.communityId,
      parentId: input.parentId || null,
      name: input.name
    },
    select: folderSelect
  });
}

async function renameFolder(db, { communityId, folderId, name }) {
  const updated = await db.communityFolder.updateMany({
    where: { id: folderId, communityId, deletedAt: null },
    data: { name }
  });

  // Se usa updateMany para mantener el mismo patrón defensivo del proyecto:
  // si la fila ya no cumple el where, simplemente no se actualiza.
  if (updated.count !== 1) {
    return null;
  }

  return db.communityFolder.findFirst({
    where: { id: folderId, communityId },
    select: folderSelect
  });
}

async function createDocument(db, input) {
  return db.communityDocument.create({
    data: {
      id: input.id,
      communityId: input.communityId,
      folderId: input.folderId || null,
      uploadedByMembershipId: input.uploadedByMembershipId || null,
      name: input.name,
      description: input.description || null,
      originalFilename: input.originalFilename,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      extension: input.extension || null,
      sizeBytes: input.sizeBytes
    },
    select: documentSelect
  });
}

async function renameDocument(db, { communityId, documentId, name }) {
  const updated = await db.communityDocument.updateMany({
    where: { id: documentId, communityId, deletedAt: null },
    data: { name }
  });

  if (updated.count !== 1) {
    return null;
  }

  return db.communityDocument.findFirst({
    where: { id: documentId, communityId },
    select: documentSelect
  });
}

// El borrado operativo actual es real en BD para documentos.
async function deleteDocument(db, { communityId, documentId }) {
  const deleted = await db.communityDocument.deleteMany({
    where: { id: documentId, communityId, deletedAt: null }
  });

  return deleted.count === 1;
}

async function deleteDocumentsByIds(db, { communityId, documentIds }) {
  if (!documentIds || documentIds.length === 0) {
    return { count: 0 };
  }

  // Se usa borrado por lote para carpetas con muchos documentos.
  return db.communityDocument.deleteMany({
    where: { id: { in: documentIds }, communityId, deletedAt: null }
  });
}

async function deleteFoldersByIds(db, { communityId, folderIds }) {
  if (!folderIds || folderIds.length === 0) {
    return { count: 0 };
  }

  // El service comprueba antes que están todas las carpetas esperadas; aquí solo se ejecuta el lote.
  return db.communityFolder.deleteMany({
    where: { id: { in: folderIds }, communityId, deletedAt: null }
  });
}

// --- Gestión de cuota de almacenamiento ---
async function communityStorage(db, communityId) {
  return db.community.findFirst({
    where: { id: communityId, deletedAt: null },
    select: { id: true, storageQuotaBytes: true, storageUsedBytes: true }
  });
}

// Se reintenta un pequeño número de veces para absorber colisiones de concurrencia.
async function reserveStorage(db, { communityId, sizeBytes }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const community = await communityStorage(db, communityId);

    if (!community) {
      return false;
    }

    const nextUsedBytes = BigInt(community.storageUsedBytes) + BigInt(sizeBytes);

    if (nextUsedBytes > BigInt(community.storageQuotaBytes)) {
      return false;
    }

    // Reserva optimista: solo se actualiza si storageUsedBytes sigue valiendo lo mismo que cuando se leyó. 
    // Si otro proceso lo cambió, se reintenta.
    const updated = await db.community.updateMany({
      where: { id: communityId, deletedAt: null, storageUsedBytes: community.storageUsedBytes },
      data: { storageUsedBytes: nextUsedBytes }
    });

    if (updated.count === 1) {
      return true;
    }
  }

  return false;
}

async function releaseStorage(db, { communityId, sizeBytes }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const community = await communityStorage(db, communityId);

    if (!community) {
      return false;
    }

    const currentUsedBytes = BigInt(community.storageUsedBytes);
    // Nunca se permite dejar la cuota usada en negativo.
    const nextUsedBytes = currentUsedBytes > BigInt(sizeBytes) ? currentUsedBytes - BigInt(sizeBytes) : 0n;

    const updated = await db.community.updateMany({
      where: { id: communityId, deletedAt: null, storageUsedBytes: community.storageUsedBytes },
      data: { storageUsedBytes: nextUsedBytes }
    });

    if (updated.count === 1) {
      return true;
    }
  }

  return false;
}

// --- Lecturas auxiliares para árbol y borrado recursivo ---
async function findAllFolders(communityId) {
  // Este método se usa para montar el árbol completo y para calcular borrados recursivos.
  return prisma.communityFolder.findMany({
    where: { communityId, deletedAt: null },
    select: folderSelect,
    orderBy: [{ name: 'asc' }, { id: 'asc' }]
  });
}

async function findDocumentsByFolderIds({ communityId, folderIds }) {
  if (!folderIds || folderIds.length === 0) {
    return [];
  }

  // Devuelve todos los documentos activos contenidos en un conjunto de carpetas.
  return prisma.communityDocument.findMany({
    where: { communityId, folderId: { in: folderIds }, deletedAt: null },
    select: documentSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]
  });
}

module.exports = {
  withTransaction,
  findFolderById,
  findDocumentById,
  findFoldersInScope,
  findDocumentsPageInScope,
  countChildrenByParentIds,
  countDocumentsByFolderIds,
  findFolderNameConflict,
  findDocumentNameConflict,
  createFolder,
  renameFolder,
  createDocument,
  renameDocument,
  deleteDocument,
  deleteDocumentsByIds,
  deleteFoldersByIds,
  reserveStorage,
  releaseStorage,
  findAllFolders,
  findDocumentsByFolderIds
};