// Controladores del módulo help.
const helpRepository = require('./help.repository');
const helpService = require('./help.service');

async function getPublicHelpSections(req, res) {
  const result = await helpService.getHelpSections({ userId: req.user.id }, req.query.communityId || null, helpRepository);
  return res.status(200).json(result);
}

async function getHelpSections(req, res) {
  const result = await helpService.getHelpSections({ userId: req.user.id }, req.params.communityId, helpRepository);
  return res.status(200).json(result);
}

async function createHelpSection(req, res) {
  const result = await helpService.createHelpSection({ userId: req.user.id }, req.params.communityId, req.body, helpRepository);
  return res.status(201).json(result);
}

async function updateHelpSection(req, res) {
  const result = await helpService.updateHelpSection({ userId: req.user.id }, req.params.communityId, req.params.sectionId, req.body, helpRepository);
  return res.status(200).json(result);
}

async function deleteHelpSection(req, res) {
  const result = await helpService.deleteHelpSection({ userId: req.user.id }, req.params.communityId, req.params.sectionId, helpRepository);
  return res.status(200).json(result);
}

async function reorderHelpSections(req, res) {
  const result = await helpService.reorderHelpSections({ userId: req.user.id }, req.params.communityId, req.body, helpRepository);
  return res.status(200).json(result);
}

module.exports = { getPublicHelpSections, getHelpSections, createHelpSection, updateHelpSection, deleteHelpSection, reorderHelpSections };