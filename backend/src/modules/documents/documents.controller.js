// Capa HTTP de documents: transforma navegación y gestión documental en respuestas del API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP o stream binario.
// Expone controladores de navegación, carpetas, documentos y movimiento lógico.
// Lo consumen las rutas del módulo con asyncHandler.
const documentsRepository = require('./documents.repository');
const documentsService = require('./documents.service');

function requestContext(req) {
  return { userId: req.user.id };
}

function documentWriteInput(req) {
  return { ...req.body, file: req.file || null };
}

// --- Documentos: GET ---
async function listDocuments(req, res) {
  const result = await documentsService.listDocuments(requestContext(req), req.params.communityId, req.query, documentsRepository);
  return res.status(200).json(result);
}

async function getFolderTree(req, res) {
  const result = await documentsService.getFolderTree(requestContext(req), req.params.communityId, documentsRepository);
  return res.status(200).json(result);
}

// El controlador solo prepara headers; el stream y sus errores salen del servicio/storage.
async function streamDocument(req, res) {
  const result = await documentsService.getDocumentContent(
    requestContext(req),
    req.params.communityId,
    req.params.documentId,
    req.query,
    documentsRepository
  );

  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Content-Length', result.sizeBytes);
  res.setHeader('Content-Disposition', result.disposition);

  result.stream.on('error', (error) => {
    if (!res.headersSent) {
      res.destroy(error);
      return;
    }
    res.end();
  });

  return result.stream.pipe(res);
}

// --- Documentos: POST ---
async function createFolder(req, res) {
  const result = await documentsService.createFolder(requestContext(req), req.params.communityId, req.body, documentsRepository);
  return res.status(201).json(result);
}

async function createDocument(req, res) {
  const result = await documentsService.createDocument(
    requestContext(req),
    req.params.communityId,
    documentWriteInput(req),
    documentsRepository
  );
  return res.status(201).json(result);
}

// --- Documentos: PATCH ---
async function renameFolder(req, res) {
  const result = await documentsService.renameFolder(requestContext(req), req.params.communityId, req.params.folderId, req.body, documentsRepository);
  return res.status(200).json(result);
}

async function renameDocument(req, res) {
  const result = await documentsService.renameDocument(requestContext(req), req.params.communityId, req.params.documentId, req.body, documentsRepository);
  return res.status(200).json(result);
}

// Mover no toca el binario: solo delega el cambio lógico de carpeta/raíz al servicio.
async function moveItem(req, res) {
  const result = await documentsService.moveItem(requestContext(req), req.params.communityId, req.body, documentsRepository);
  return res.status(200).json(result);
}

// --- Documentos: DELETE ---
async function deleteFolder(req, res) {
  const result = await documentsService.deleteFolder(requestContext(req), req.params.communityId, req.params.folderId, documentsRepository);
  return res.status(200).json(result);
}

async function deleteDocument(req, res) {
  const result = await documentsService.deleteDocument(requestContext(req), req.params.communityId, req.params.documentId, documentsRepository);
  return res.status(200).json(result);
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
  streamDocument,
  moveItem
};