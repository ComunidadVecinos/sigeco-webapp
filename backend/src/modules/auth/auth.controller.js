// Capa HTTP de auth: convierte registro, login y logout en respuestas y cookies de sesión.
// Flujo cubierto: request validada -> service -> cookie de sesión y JSON HTTP.
// Expone controladores de registro, login, logout y gestión de contraseña.
// Lo consumen las rutas del módulo con asyncHandler.
const authService = require('./auth.service');
const sessionService = require('../../lib/session');

// La autenticación real viaja en la cookie HttpOnly sid; el body solo devuelve contexto y metadatos de sesión.
function setAuthCookie(res, sid) {
  res.cookie('sid', sid, { ...sessionService.getCookieConfig(), maxAge: sessionService.getSessionTtlMs() });
}

function clearAuthCookie(res) {
  res.cookie('sid', '', { ...sessionService.getCookieConfig(), maxAge: 0 });
}

// --- Autenticación: POST de registro y login ---
async function register(req, res) {
  const result = await authService.registerUser(req.body);
  return res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);
  setAuthCookie(res, result.sid);
  return res.status(201).json({ user: result.user, context: result.context, session: result.session });
}

// --- Sesión actual: DELETE de logout ---
// Logout invalida la sesión persistida y limpia la cookie local del cliente.
async function logout(req, res) {
  const result = await authService.logoutSession(req.session.id);
  clearAuthCookie(res);
  return res.status(200).json(result);
}

// --- Contraseña: POST de cambio y reseteo ---
// El cambio de contraseña conserva la sesión actual y expulsa el resto.
async function changePassword(req, res) {
  const result = await authService.changePassword(req.user.id, req.session.id, req.body.currentPassword, req.body.newPassword);
  return res.status(200).json(result);
}

// El reseteo responde de forma genérica para no filtrar existencia de cuentas.
async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body.email);
  return res.status(200).json(result);
}

module.exports = { register, login, logout, changePassword, resetPassword };