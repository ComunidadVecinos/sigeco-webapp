// Controladores HTTP del módulo users.
const sessionService = require('../../lib/session');
const usersService = require('./users.service');
const usersRepository = require('./users.repository');

function clearSessionCookie(res) {
  res.cookie('sid', '', { ...sessionService.getCookieConfig(), maxAge: 0 });
}

async function getMyProfile(req, res) {
  const profile = await usersService.getMyProfile(req.user.id, usersRepository, { activeMembershipId: req.session.activeMembershipId || null });
  return res.status(200).json(profile);
}

async function updateMyProfile(req, res) {
  const profile = await usersService.updateMyProfile(req.user.id, req.body, usersRepository);
  return res.status(200).json(profile);
}

async function changeMyActiveCommunity(req, res) {
  // El cambio de comunidad activa debe reflejarse tanto en BD como en el contexto HTTP.
  const result = await usersService.changeMyActiveCommunity({ userId: req.user.id, sessionId: req.session.id }, req.body, usersRepository);
  return res.status(200).json(result);
}

async function updateMyAvatar(req, res) {
  const result = await usersService.updateMyAvatar(req.user.id, req.file, usersRepository);
  return res.status(200).json(result);
}

async function deleteMyAccount(req, res) {
  const result = await usersService.deleteMyAccount({ userId: req.user.id, currentEmail: req.user.email }, req.body, usersRepository);
  // El borrado invalida sesiones en BD y fuerza la limpieza de la cookie actual en la respuesta.
  clearSessionCookie(res);
  return res.status(200).json(result);
}

module.exports = {  getMyProfile, updateMyProfile, changeMyActiveCommunity, updateMyAvatar, deleteMyAccount };
