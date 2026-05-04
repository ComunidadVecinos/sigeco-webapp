// Capa HTTP de help: conecta la lectura y la edición de ayuda con el contrato del API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de lectura pública, lectura comunitaria y administración de secciones de ayuda.
// Lo consumen las rutas pública y comunitaria del módulo con asyncHandler.
const helpRepository = require('./help.repository');
const helpService = require('./help.service');

function requestContext(req) {
  return { userId: req.user.id };
}

// --- Ayuda pública autenticada: GET ---
async function getPublicHelpSections(req, res) {
  const result = await helpService.getHelpSections(requestContext(req), req.query.communityId || null, helpRepository);
  return res.status(200).json(result);
}

// --- Ayuda comunitaria: GET ---
async function getHelpSections(req, res) {
  const result = await helpService.getHelpSections(requestContext(req), req.params.communityId, helpRepository);
  return res.status(200).json(result);
}

// --- Ayuda comunitaria: POST ---
async function createHelpSection(req, res) {
  const result = await helpService.createHelpSection(requestContext(req), req.params.communityId, req.body, helpRepository);
  return res.status(201).json(result);
}

// --- Ayuda comunitaria: PATCH ---
async function updateHelpSection(req, res) {
  const result = await helpService.updateHelpSection(requestContext(req), req.params.communityId, req.params.sectionId, req.body, helpRepository);
  return res.status(200).json(result);
}

// --- Ayuda comunitaria: DELETE ---
async function deleteHelpSection(req, res) {
  const result = await helpService.deleteHelpSection(requestContext(req), req.params.communityId, req.params.sectionId, helpRepository);
  return res.status(200).json(result);
}

// --- Ayuda comunitaria: PUT ---
async function reorderHelpSections(req, res) {
  const result = await helpService.reorderHelpSections(requestContext(req), req.params.communityId, req.body, helpRepository);
  return res.status(200).json(result);
}

module.exports = { getPublicHelpSections, getHelpSections, createHelpSection, updateHelpSection, deleteHelpSection, reorderHelpSections };