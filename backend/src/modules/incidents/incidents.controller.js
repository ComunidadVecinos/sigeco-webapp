const incidentsRepository = require('./incidents.repository');
const incidentsService = require('./incidents.service');

/**
 * El controller adapta HTTP al servicio del módulo incidents.
 * Extrae datos de req, delega la lógica al service y devuelve la respuesta.
 */

function requestUser(req) {
  return { userId: req.user.id };
}

function incidentWriteInput(req) {
  return { ...req.body, imageFile: req.file || null };
}

async function createIncident(req, res) {
  const result = await incidentsService.createIncident(
    requestUser(req),
    req.params.communityId,
    incidentWriteInput(req),
    incidentsRepository
  );
  return res.status(201).json(result);
}

async function getIncidentList(req, res) {
  const result = await incidentsService.getIncidentList(
    requestUser(req),
    req.params.communityId,
    req.query,
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function getIncidentDetail(req, res) {
  const result = await incidentsService.getIncidentDetail(
    requestUser(req),
    req.params.communityId,
    req.params.incidentId,
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function updateIncident(req, res) {
  const result = await incidentsService.updateIncident(
    requestUser(req),
    req.params.communityId,
    req.params.incidentId,
    incidentWriteInput(req),
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function deleteIncidentImage(req, res) {
  const result = await incidentsService.deleteIncidentImage(
    requestUser(req),
    req.params.communityId,
    req.params.incidentId,
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function deleteIncident(req, res) {
  const result = await incidentsService.deleteIncident(
    requestUser(req),
    req.params.communityId,
    req.params.incidentId,
    incidentsRepository
  );
  return res.status(200).json(result);
}

async function updateIncidentStatus(req, res) {
  const result = await incidentsService.updateIncidentStatus(
    requestUser(req),
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