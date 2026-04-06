const documentsRepository = require('./documents.repository');
const documentsService = require('./documents.service');

/**
 * El controller adapta HTTP al servicio. Este archivo contiene la lógica del controlador del módulo documents.
 * Extrae datos de `req`, delega la lógica al service y devuelve la respuesta.
 */

function requestUser(req) {
  return { userId: req.user.id };
}

async function listDocuments(req, res) {
  const result = await documentsService.listDocuments(requestUser(req), req.params.communityId, req.query, documentsRepository);
  return res.status(200).json(result);
}

async function getFolderTree(req, res) {
  const result = await documentsService.getFolderTree(requestUser(req), req.params.communityId, documentsRepository);
  return res.status(200).json(result);
}

async function createFolder(req, res) {
  const result = await documentsService.createFolder(requestUser(req), req.params.communityId, req.body, documentsRepository);
  return res.status(201).json(result);
}

async function renameFolder(req, res) {
  const result = await documentsService.renameFolder(requestUser(req), req.params.communityId, req.params.folderId, req.body, documentsRepository);
  return res.status(200).json(result);
}

async function deleteFolder(req, res) {
  const result = await documentsService.deleteFolder(requestUser(req), req.params.communityId, req.params.folderId, documentsRepository);
  return res.status(200).json(result);
}

async function createDocument(req, res) {
  const input = { ...req.body, file: req.file || null };
  const result = await documentsService.createDocument(requestUser(req), req.params.communityId, input, documentsRepository);
  return res.status(201).json(result);
}

async function renameDocument(req, res) {
  const result = await documentsService.renameDocument(requestUser(req), req.params.communityId, req.params.documentId, req.body, documentsRepository);
  return res.status(200).json(result);
}

async function deleteDocument(req, res) {
  const result = await documentsService.deleteDocument(requestUser(req), req.params.communityId, req.params.documentId, documentsRepository);
  return res.status(200).json(result);
}

async function streamDocument(req, res) {
  const result = await documentsService.getDocumentContent(requestUser(req), req.params.communityId, req.params.documentId, req.query, documentsRepository);

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

module.exports = {
  listDocuments,
  getFolderTree,
  createFolder,
  renameFolder,
  deleteFolder,
  createDocument,
  renameDocument,
  deleteDocument,
  streamDocument
};