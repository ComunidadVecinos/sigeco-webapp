// Capa HTTP de incidents: convierte el flujo de incidencias en respuestas claras para el API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de alta, consulta, edición, borrado y cambio de estado de incidencias.
// Lo consumen las rutas del módulo con asyncHandler.
const incidentsRepository = require('./incidents.repository');
const incidentsService = require('./incidents.service');

function requestContext(req) {
  return { userId: req.user.id };
}

function incidentWriteInput(req) {
  return { ...req.body, imageFile: req.file || null };
}

// --- Incidencias: POST ---
async function createIncident(req, res) {
  const result = await incidentsService.createIncident(
    requestContext(req),
    req.params.communityId,
    incidentWriteInput(req),
    incidentsRepository
  );
  return res.status(201).json(result);
}

// --- Incidencias: GET ---
async function getIncidentList(req, res) {
  const result = await incidentsService.getIncidentList(
    requestContext(req),
    req.params.communityId,
    req.query,
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function getIncidentDetail(req, res) {
  const result = await incidentsService.getIncidentDetail(
    requestContext(req),
    req.params.communityId,
    req.params.incidentId,
    incidentsRepository
  );
  return res.status(200).json(result);
}

// --- Incidencias: PATCH ---
async function updateIncident(req, res) {
  const result = await incidentsService.updateIncident(
    requestContext(req),
    req.params.communityId,
    req.params.incidentId,
    incidentWriteInput(req),
    incidentsRepository
  );
  return res.status(200).json(result);
}

// --- Incidencias: DELETE ---
async function deleteIncidentImage(req, res) {
  const result = await incidentsService.deleteIncidentImage(
    requestContext(req),
    req.params.communityId,
    req.params.incidentId,
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function deleteIncident(req, res) {
  const result = await incidentsService.deleteIncident(
    requestContext(req),
    req.params.communityId,
    req.params.incidentId,
    incidentsRepository
  );
  return res.status(200).json(result);
}

// --- Incidencias: POST de cambio de estado ---
async function updateIncidentStatus(req, res) {
  const result = await incidentsService.updateIncidentStatus(
    requestContext(req),
    req.params.communityId,
    req.params.incidentId,
    req.body,
    incidentsRepository
  );
  return res.status(200).json(result);
}

module.exports = {
  createIncident,
  getIncidentList,
  getIncidentDetail,
  updateIncident,
  deleteIncidentImage,
  deleteIncident,
  updateIncidentStatus
};