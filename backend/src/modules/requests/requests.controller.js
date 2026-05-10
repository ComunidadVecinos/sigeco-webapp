// Capa HTTP de requests: conecta solicitudes propias y revisión administrativa con el API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de solicitudes propias y revisión administrativa comunitaria.
// Lo consumen las rutas del módulo con asyncHandler.
const requestsRepository = require('./requests.repository');
const requestsService = require('./requests.service');

function requestContext(req) {
  return { userId: req.user.id };
}

// --- Solicitudes propias: GET ---
async function getMyRequests(req, res) {
  const result = await requestsService.getMyRequests(req.user.id, requestsRepository);
  return res.status(200).json(result);
}

// --- Bandeja comunitaria: GET ---
async function getCommunityPendingRequests(req, res) {
  const result = await requestsService.getCommunityPendingRequests(req.user.id, req.query, requestsRepository);
  return res.status(200).json(result);
}

// --- Solicitudes propias: POST ---
async function createRequest(req, res) {
  const result = await requestsService.createRequest(requestContext(req), req.body, requestsRepository);
  return res.status(201).json(result);
}

async function cancelRequest(req, res) {
  const result = await requestsService.cancelRequest(req.user.id, req.params.requestId, requestsRepository);
  return res.status(200).json(result);
}

async function archiveRequest(req, res) {
  const result = await requestsService.archiveRequest(req.user.id, req.params.requestId, requestsRepository);
  return res.status(200).json(result);
}

// --- Revisión administrativa: POST ---
// La identidad del revisor siempre se toma de la sesión autenticada.
async function approveRequest(req, res) {
  const result = await requestsService.approveRequest(req.user.id, req.params.requestId, req.body, requestsRepository);
  return res.status(200).json(result);
}

// Rechazo y aprobación comparten contrato para que la revisión administrativa sea simétrica.
async function rejectRequest(req, res) {
  const result = await requestsService.rejectRequest(req.user.id, req.params.requestId, req.body, requestsRepository);
  return res.status(200).json(result);
}

module.exports = {
  createRequest,
  getMyRequests,
  getCommunityPendingRequests,
  cancelRequest,
  archiveRequest,
  approveRequest,
  rejectRequest
};