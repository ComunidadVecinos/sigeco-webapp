// Router de auth: agrupa los endpoints de entrada y salida de sesión junto a sus validaciones.
// Flujo cubierto: validación de body -> controlador -> cookie de sesión cuando corresponde.
// Expone el router de Express para registro, login, logout y gestión de contraseña.
// Lo consume app.js bajo "/api/auth".
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const authController = require('./auth.controller');
const { requireSession } = require('./auth.middleware');
const { registrationSchema, loginSchema, changePasswordSchema, passwordResetSchema } = require('./auth.validation');

const router = express.Router();

// --- Autenticación: POST de registro y login ---
router.post(
  '/registrations', 
  validate({ body: registrationSchema }), 
  asyncHandler(authController.register)
);

router.post(
  '/sessions', 
  validate({ body: loginSchema }), 
  asyncHandler(authController.login)
);

// --- Contraseña: POST de cambio y reseteo ---
router.post(
  '/password/change', 
  requireSession, 
  validate({ body: changePasswordSchema }), 
  asyncHandler(authController.changePassword)
);

router.post(
  '/password/reset', 
  validate({ body: passwordResetSchema }), 
  asyncHandler(authController.resetPassword)
);

// --- Sesión actual: DELETE de logout ---
router.delete(
  '/sessions/current', 
  requireSession, 
  asyncHandler(authController.logout)
);

module.exports = router;