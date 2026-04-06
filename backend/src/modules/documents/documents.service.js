const crypto = require('crypto');

const { ConflictError, NotFoundError, ValidationError, errorCodes } = require('../../lib/errors');
const { inspectPdfBuffer } = require('../../lib/storage/pdfMetadata');
const storageService = require('../../lib/storage/storage');
const membersService = require('../members/members.service');
const membersRepository = require('../members/members.repository');

/**
 * Servicio del módulo documents. Orquesta:
 * - permisos de lectura y escritura
 * - reglas de negocio sobre nombres, carpetas y cuota
 * - mapeo del modelo interno al contrato HTTP
 * - coordinación entre base de datos y filesystem
 */

// --- Helpers de salida y utilidades pequeñas ---
function validationDetail(field, message, location = 'body') {
  return [{ field, location, message }];
}

function toNumber(value) {
  return Number(value || 0n);
}

function pagination(page, pageSize, total) {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) };
}

function storageSummary(community) {
  const quotaBytes = toNumber(community.storageQuotaBytes);
  const usedBytes = toNumber(community.storageUsedBytes);
  const availableBytes = Math.max(quotaBytes - usedBytes, 0);
  const usagePercent = quotaBytes === 0 ? 0 : Number(((usedBytes / quotaBytes) * 100).toFixed(2));
  return { quotaBytes, usedBytes, availableBytes, usagePercent };
}

function folderView(folder, counts = {}) {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId || null,
    createdAt: folder.createdAt.toISOString(),
    documentsCount: counts.documentsCount || 0,
    childrenCount: counts.childrenCount || 0
  };
}

function documentUrl(communityId, documentId) {
  return `/api/communities/${communityId}/documents/files/${documentId}/content`;
}

function documentView(document, communityId) {
  return {
    id: document.id,
    name: document.name,
    description: document.description || null,
    parentId: document.folderId || null,
    sizeBytes: toNumber(document.sizeBytes),
    mimeType: document.mimeType,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    url: documentUrl(communityId, document.id)
  };
}

function folderRef(folder) {
  if (!folder) {
    return null;
  }

  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId || null,
    createdAt: folder.createdAt.toISOString()
  };
}

function folderCounts(folderIds, childCounts, documentCounts) {
  const childCountByParentId = new Map(childCounts.map((item) => [item.parentId, item._count._all]));
  const documentCountByFolderId = new Map(documentCounts.map((item) => [item.folderId, item._count._all]));

  // Deja preparados los conteos por carpeta para enriquecer la respuesta sin recalcular nada durante el mapping final.
  return new Map(
    folderIds.map((folderId) => [
      folderId,
      { childrenCount: childCountByParentId.get(folderId) || 0, documentsCount: documentCountByFolderId.get(folderId) || 0 }
    ])
  );
}

// --- Helpers de navegación jerárquica ---
async function breadcrumbs(communityId, currentFolder, documentsRepository) {
  if (!currentFolder) {
    return [];
  }

  const items = [];
  let cursor = currentFolder;

  // Sube desde la carpeta actual hasta la raíz para construir la ruta de navegación para el frontend.
  while (cursor) {
    items.unshift({
      id: cursor.id,
      name: cursor.name,
      parentId: cursor.parentId || null,
      createdAt: cursor.createdAt.toISOString()
    });
    if (!cursor.parentId) { break; }
    cursor = await documentsRepository.findFolderById({ communityId, folderId: cursor.parentId });
  }

  return items;
}

function folderTree(folders) {
  const nodeById = new Map();
  const roots = [];

  // Paso 1: crear todos los nodos sin relaciones para poder enlazarlos después.
  for (const folder of folders) {
    nodeById.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId || null,
      createdAt: folder.createdAt.toISOString(),
      children: []
    });
  }

  // Paso 2: enlazar cada carpeta con su padre o dejarla como raíz.
  for (const folder of folders) {
    const node = nodeById.get(folder.id);

    if (folder.parentId && nodeById.has(folder.parentId)) {
      nodeById.get(folder.parentId).children.push(node);
      continue;
    }
    roots.push(node);
  }
  return roots;
}

function collectFolderIds(rootFolderId, folders) {
  const childrenByParentId = new Map();

  // Índice en memoria para recorrer el árbol sin volver a consultar BD.
  for (const folder of folders) {
    const siblings = childrenByParentId.get(folder.parentId || null) || [];
    siblings.push(folder);
    childrenByParentId.set(folder.parentId || null, siblings);
  }

  const pendingIds = [rootFolderId];
  const allIds = [];

  // DFS iterativo: devuelve la carpeta inicial y todos sus descendientes.
  while (pendingIds.length > 0) {
    const currentId = pendingIds.pop();
    allIds.push(currentId);

    const children = childrenByParentId.get(currentId) || [];
    for (const child of children) {
      pendingIds.push(child.id);
    }
  }

  return allIds;
}

function totalDocumentBytes(documents) {
  return documents.reduce((total, document) => total + BigInt(document.sizeBytes || 0), 0n);
}

function contentDisposition(filename, download) {
  const encodedFilename = encodeURIComponent(filename || 'document.pdf');
  return `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodedFilename}`;
}

// --- Reglas de acceso reutilizando el módulo members ---
async function requireReadAccess(userId, communityId) {
  return membersService.requireCommunityMembershipAccess(userId, communityId, membersRepository);
}

async function requireWriteAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function getFolderOrFail(communityId, folderId, documentsRepository) {
  const folder = await documentsRepository.findFolderById({ communityId, folderId });

  if (!folder) {
    throw new NotFoundError('Carpeta no encontrada');
  }
  return folder;
}

async function getDocumentOrFail(communityId, documentId, documentsRepository) {
  const document = await documentsRepository.findDocumentById({ communityId, documentId });

  if (!document) {
    throw new NotFoundError('Documento no encontrado');
  }
  return document;
}

// --- Validaciones de estado y de unicidad por ámbito ---
function ensureFolderIsActive(folder, message) {
  if (!folder.deletedAt) {
    return;
  }
  throw new ConflictError(message);
}

function ensureDocumentIsActive(document, message) {
  if (!document.deletedAt) {
    return;
  }
  throw new ConflictError(message);
}

async function ensureFolderNameAvailable({ communityId, parentId, name, excludeFolderId }, documentsRepository) {
  const conflict = await documentsRepository.findFolderNameConflict({ communityId, parentId, name, excludeFolderId });

  if (conflict) {
    throw new ConflictError('Ya existe una carpeta con ese nombre en la ubicación seleccionada');
  }
}

async function ensureDocumentNameAvailable({ communityId, folderId, name, excludeDocumentId }, documentsRepository) {
  const conflict = await documentsRepository.findDocumentNameConflict({ communityId, folderId, name, excludeDocumentId });

  if (conflict) {
    throw new ConflictError('Ya existe un documento con ese nombre en la ubicación seleccionada');
  }
}

async function getParentFolder(communityId, parentId, documentsRepository) {
  if (!parentId) {
    return null;
  }

  // Si se informa `parentId`, debe apuntar a una carpeta existente y activa.
  const folder = await getFolderOrFail(communityId, parentId, documentsRepository);
  ensureFolderIsActive(folder, 'La carpeta seleccionada ya no está disponible');
  return folder;
}

function quotaExceededError() {
  return new ConflictError('La comunidad no dispone de espacio suficiente para subir el documento', { code: errorCodes.STORAGE_QUOTA_EXCEEDED });
}

async function listDocuments(context, communityId, input, documentsRepository) {
  const { community } = await requireReadAccess(context.userId, communityId);
  const currentFolder = await getParentFolder(communityId, input.parentId, documentsRepository);

  // Se resuelven en paralelo el contenido del ámbito actual y la ruta de navegación.
  const [folders, documentsPage, currentBreadcrumbs] = await Promise.all([
    documentsRepository.findFoldersInScope({
      communityId,
      parentId: input.parentId,
      search: input.search || undefined
    }),
    documentsRepository.findDocumentsPageInScope({
      communityId,
      parentId: input.parentId,
      search: input.search || undefined,
      page: input.page,
      pageSize: input.pageSize
    }),
    breadcrumbs(communityId, currentFolder, documentsRepository)
  ]);

  const folderIds = folders.map((folder) => folder.id);
  const [childCounts, documentCounts] = await Promise.all([documentsRepository.countChildrenByParentIds(folderIds), documentsRepository.countDocumentsByFolderIds(folderIds)]);
  const countsByFolderId = folderCounts(folderIds, childCounts, documentCounts);

  return {
    parentFolder: folderRef(currentFolder),
    breadcrumbs: currentBreadcrumbs,
    folders: folders.map((folder) => folderView(folder, countsByFolderId.get(folder.id))),
    documents: documentsPage.items.map((document) => documentView(document, communityId)),
    pagination: pagination(input.page, input.pageSize, documentsPage.total),
    storage: storageSummary(community)
  };
}

async function getFolderTree(context, communityId, documentsRepository) {
  await requireReadAccess(context.userId, communityId);
  const folders = await documentsRepository.findAllFolders(communityId);
  return { folders: folderTree(folders) };
}

async function createFolder(context, communityId, input, documentsRepository) {
  await requireWriteAccess(context.userId, communityId);
  await getParentFolder(communityId, input.parentId, documentsRepository);
  // La unicidad del nombre se comprueba solo dentro del mismo nivel del árbol.
  await ensureFolderNameAvailable({ communityId, parentId: input.parentId, name: input.name }, documentsRepository);

  const folder = await documentsRepository.withTransaction((db) =>
    documentsRepository.createFolder(db, {
      communityId,
      parentId: input.parentId,
      name: input.name
    })
  );
  return { folder: folderView(folder) };
}

async function renameFolder(context, communityId, folderId, input, documentsRepository) {
  await requireWriteAccess(context.userId, communityId);

  const folder = await getFolderOrFail(communityId, folderId, documentsRepository);
  ensureFolderIsActive(folder, 'La carpeta ya está eliminada');
  await ensureFolderNameAvailable({
    communityId,
    parentId: folder.parentId,
    name: input.name,
    excludeFolderId: folder.id
  }, documentsRepository);

  const updatedFolder = await documentsRepository.withTransaction((db) =>
    documentsRepository.renameFolder(db, { communityId, folderId, name: input.name })
  );

  if (!updatedFolder) {
    throw new ConflictError('No se ha podido actualizar la carpeta');
  }
  return { folder: folderView(updatedFolder) };
}

async function createDocument(context, communityId, input, documentsRepository) {
  const { community, membership } = await requireWriteAccess(context.userId, communityId);

  if (!input.file) {
    throw new ValidationError(validationDetail('file', 'El archivo del documento es obligatorio'));
  }

  // No se confía solo en el MIME del multipart; se valida también la firma binaria.
  const pdf = inspectPdfBuffer(input.file.buffer);
  await getParentFolder(communityId, input.folderId, documentsRepository);
  await ensureDocumentNameAvailable({
    communityId,
    folderId: input.folderId,
    name: input.name
  }, documentsRepository);

  // Corte rápido antes de escribir en disco si ya se sabe que la cuota no alcanza.
  if (BigInt(community.storageUsedBytes) + BigInt(input.file.size) > BigInt(community.storageQuotaBytes)) {
    throw quotaExceededError();
  }

  const documentId = crypto.randomUUID();
  // Primero se escribe en storage con soporte commit/rollback.
  const storedFile = await storageService.replaceCommunityDocumentFile({
    communityId,
    documentId,
    previousStoragePath: null,
    buffer: input.file.buffer,
    extension: pdf.extension
  });

  try {
    const createdDocument = await documentsRepository.withTransaction(async (db) => {
      // La reserva de cuota y la creación del documento deben quedar en la
      // misma transacción para mantener alineados BD y espacio usado.
      const quotaReserved = await documentsRepository.reserveStorage(db, { communityId, sizeBytes: BigInt(input.file.size) });

      if (!quotaReserved) {
        throw quotaExceededError();
      }

      return documentsRepository.createDocument(db, {
        id: documentId,
        communityId,
        folderId: input.folderId,
        uploadedByMembershipId: membership.id,
        name: input.name,
        description: input.description,
        originalFilename: input.file.originalname,
        storagePath: storedFile.storagePath,
        mimeType: input.file.mimetype,
        extension: pdf.extension,
        sizeBytes: BigInt(input.file.size)
      });
    });

    // Solo se consolida el fichero cuando la transacción de BD ha terminado bien.
    await storageService.commitStoredFileSafely(
      storedFile,
      'No se ha podido finalizar la limpieza del almacenamiento del documento tras la subida',
      { communityId, documentId }
    );
    return { document: documentView(createdDocument, communityId) };
  }
  catch (error) {
    // Si algo falla después de escribir el temporal, se intenta restaurar el estado previo.
    await storageService.rollbackStoredFileSafely(
      storedFile,
      'No se ha podido restaurar el documento tras un error en la subida',
      { communityId, documentId }
    );
    throw error;
  }
}

async function renameDocument(context, communityId, documentId, input, documentsRepository) {
  await requireWriteAccess(context.userId, communityId);

  const document = await getDocumentOrFail(communityId, documentId, documentsRepository);
  ensureDocumentIsActive(document, 'El documento ya está eliminado');
  await ensureDocumentNameAvailable({
    communityId,
    folderId: document.folderId,
    name: input.name,
    excludeDocumentId: document.id
  }, documentsRepository);

  const updatedDocument = await documentsRepository.withTransaction((db) =>
    documentsRepository.renameDocument(db, { communityId, documentId, name: input.name })
  );

  if (!updatedDocument) {
    throw new ConflictError('No se ha podido actualizar el documento');
  }
  return { document: documentView(updatedDocument, communityId) };
}

async function deleteDocument(context, communityId, documentId, documentsRepository) {
  await requireWriteAccess(context.userId, communityId);

  const document = await getDocumentOrFail(communityId, documentId, documentsRepository);
  ensureDocumentIsActive(document, 'El documento ya está eliminado');

  await documentsRepository.withTransaction(async (db) => {
    const deleted = await documentsRepository.deleteDocument(db, { communityId, documentId });

    if (!deleted) {
      throw new ConflictError('No se ha podido eliminar el documento');
    }

    await documentsRepository.releaseStorage(db, { communityId, sizeBytes: BigInt(document.sizeBytes) });
  });

  // El borrado físico se hace fuera de la transacción para no mezclar filesystem con rollback de BD si el disco falla.
  await storageService.deleteStoredFileSafely(
    document.storagePath,
    'No se ha podido eliminar el fichero del documento tras el borrado lógico',
    { communityId, documentId }
  );
  return { deleted: true, documentId };
}

async function deleteFolder(context, communityId, folderId, documentsRepository) {
  await requireWriteAccess(context.userId, communityId);

  const folder = await getFolderOrFail(communityId, folderId, documentsRepository);
  ensureFolderIsActive(folder, 'La carpeta ya está eliminada');

  // Para borrar una carpeta hay que resolver antes todo su subárbol.
  const allFolders = await documentsRepository.findAllFolders(communityId);
  const folderIds = collectFolderIds(folderId, allFolders);
  const documents = await documentsRepository.findDocumentsByFolderIds({ communityId, folderIds });
  const releasedBytes = totalDocumentBytes(documents);

  await documentsRepository.withTransaction(async (db) => {
    // Primero se eliminan los documentos para evitar referencias colgando.
    await documentsRepository.deleteDocumentsByIds(db, { communityId, documentIds: documents.map((document) => document.id) });
    const deletedFolders = await documentsRepository.deleteFoldersByIds(db, { communityId, folderIds });

    if (deletedFolders.count !== folderIds.length) {
      throw new ConflictError('No se ha podido eliminar la carpeta');
    }

    if (releasedBytes > 0n) {
      await documentsRepository.releaseStorage(db, { communityId, sizeBytes: releasedBytes });
    }
  });

  // Una vez confirmada la transacción, se limpian del disco todos los PDFs afectados.
  await Promise.all(
    documents.map((document) =>
      storageService.deleteStoredFileSafely(
        document.storagePath,
        'No se ha podido eliminar un fichero documental tras el borrado de carpeta',
        { communityId, folderId, documentId: document.id }
      )
    )
  );
  return { deleted: true, folderId, deletedDocuments: documents.length };
}

async function getDocumentContent(context, communityId, documentId, options, documentsRepository) {
  await requireReadAccess(context.userId, communityId);
  const document = await getDocumentOrFail(communityId, documentId, documentsRepository);

  if (document.deletedAt) {
    throw new NotFoundError('Documento no encontrado');
  }

  let stream;

  try {
    // El archivo se sirve desde storage privado, nunca como recurso público estático.
    stream = await storageService.createStoredFileReadStream(document.storagePath);
  }
  catch (error) {
    if (error?.cause?.code === 'ENOENT') {
      throw new NotFoundError('Documento no disponible');
    }
    throw error;
  }

  return {
    stream,
    mimeType: document.mimeType,
    sizeBytes: toNumber(document.sizeBytes),
    disposition: contentDisposition(document.originalFilename || `${document.name}.pdf`, options.download),
    filename: document.originalFilename || `${document.name}.pdf`
  };
}

module.exports = {
  listDocuments,
  getFolderTree,
  createFolder,
  renameFolder,
  deleteFolder,
  createDocument,
  renameDocument,
  deleteDocument,
  getDocumentContent
};