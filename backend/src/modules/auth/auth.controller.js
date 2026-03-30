// Controlador HTTP del modulo auth.
const authService = require('./auth.service');
const sessionService = require('../../lib/session');

// La lógica de credenciales, sesiones e integraciones vive en el service.
function setSessionCookie(res, sid) {
  res.cookie('sid', sid, { ...sessionService.getCookieConfig(), maxAge: sessionService.getSessionTtlMs() });
}

function clearSessionCookie(res) {
  res.cookie('sid', '', { ...sessionService.getCookieConfig(), maxAge: 0 });
}

// Registro no crea sesión automáticamente: obliga a pasar por login.
async function register(req, res) {
  const result = await authService.registerUser(req.body);
  return res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);
  // La sesión viaja en cookie HttpOnly
  setSessionCookie(res, result.sid);
  return res.status(201).json({ user: result.user, context: result.context, session: result.session });
}

// Logout limpia siempre la cookie de cliente tras invalidar la sesión persistida.
//   --> El identificador en cookie por sí solo no conserva autoridad si la BD ya la invalido.
async function logout(req, res) {
  const result = await authService.logoutSession(req.session.id);
  clearSessionCookie(res);
  return res.status(200).json(result);
}

// Cambio de contraseña requiere sesión autenticada y usa req.session.id para conservar la sesión actual (el resto se invalida).
async function changePassword(req, res) {
  const result = await authService.changePassword( req.user.id, req.session.id, req.body.currentPassword, req.body.newPassword );
  return res.status(200).json(result);
}

// Reset trabaja sobre email genérico, sin comprobar ni dominio ni existencia de la cuenta.
async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body.email);
  return res.status(200).json(result);
}

module.exports = { register, login, logout, changePassword, resetPassword };