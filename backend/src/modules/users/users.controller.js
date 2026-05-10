// Capa HTTP de users: conecta perfil, avatar y baja de cuenta con el contrato del API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de perfil, comunidad activa, avatar y baja de cuenta.
// Lo consumen las rutas del módulo con asyncHandler.
const sessionService = require('../../lib/session');
const usersService = require('./users.service');
const usersRepository = require('./users.repository');

// Limpia la cookie sid cuando la sesión actual deja de ser válida para el cliente.
function clearAuthCookie(res) {
  res.cookie('sid', '', { ...sessionService.getCookieConfig(), maxAge: 0 });
}

// --- Perfil propio: GET ---
async function getMyProfile(req, res) {
  const profile = await usersService.getMyProfile(req.user.id, usersRepository, { activeMembershipId: req.session.activeMembershipId || null });
  return res.status(200).json(profile);
}

// --- Perfil propio: PATCH ---
async function updateMyProfile(req, res) {
  const profile = await usersService.updateMyProfile(req.user.id, req.body, usersRepository);
  return res.status(200).json(profile);
}

// --- Contexto del usuario: PUT ---
async function changeMyActiveCommunity(req, res) {
  // El cambio de comunidad activa debe reflejarse tanto en BD como en el contexto HTTP.
  const result = await usersService.changeMyActiveCommunity({ userId: req.user.id, sessionId: req.session.id }, req.body, usersRepository);
  return res.status(200).json(result);
}

// --- Avatar propio: PUT ---
async function updateMyAvatar(req, res) {
  const result = await usersService.updateMyAvatar(req.user.id, req.file, usersRepository);
  return res.status(200).json(result);
}

// --- Avatar y cuenta: DELETE ---
async function deleteMyAvatar(req, res) {
  const result = await usersService.deleteMyAvatar(req.user.id, usersRepository);
  return res.status(200).json(result);
}

async function deleteMyAccount(req, res) {
  const result = await usersService.deleteMyAccount({ userId: req.user.id, currentEmail: req.user.email }, req.body, usersRepository);
  // La cuenta queda invalidada en BD y, además, limpiamos la cookie de la sesión actual.
  clearAuthCookie(res);
  return res.status(200).json(result);
}

module.exports = { getMyProfile, updateMyProfile, changeMyActiveCommunity, updateMyAvatar, deleteMyAvatar, deleteMyAccount };