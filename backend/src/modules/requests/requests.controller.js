// Controladores del módulo requests.
const requestsRepository = require('./requests.repository');
const requestsService = require('./requests.service');

async function createRequest(req, res) {
  const result = await requestsService.createRequest({ userId: req.user.id }, req.body, requestsRepository);
  return res.status(201).json(result);
}

async function getMyRequests(req, res) {
  const result = await requestsService.getMyRequests(req.user.id, requestsRepository);
  return res.status(200).json(result);
}

async function getCommunityPendingRequests(req, res) {
  const result = await requestsService.getCommunityPendingRequests(req.user.id, req.query, requestsRepository);
  return res.status(200).json(result);
}

async function cancelRequest(req, res) {
  const result = await requestsService.cancelRequest(req.user.id, req.params.requestId, requestsRepository);
  return res.status(200).json(result);
}

async function archiveRequest(req, res) {
  const result = await requestsService.archiveRequest(req.user.id, req.params.requestId, requestsRepository);
  return res.status(200).json(result);
}

async function approveRequest(req, res) {
  // La identidad del revisor se toma de la sesión autenticada.
  const result = await requestsService.approveRequest(req.user.id, req.params.requestId, req.body, requestsRepository);
  return res.status(200).json(result);
}

async function rejectRequest(req, res) {
  // Rechazo y aprobación comparten el mismo contrato para mantener simetría en la revisión administrativa.
  const result = await requestsService.rejectRequest(req.user.id, req.params.requestId, req.body, requestsRepository);
  return res.status(200).json(result);
}

module.exports = { createRequest, getMyRequests, getCommunityPendingRequests, cancelRequest, archiveRequest, approveRequest, rejectRequest };