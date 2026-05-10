const express = require('express');

// Router de users: agrupa los endpoints del usuario autenticado y sus cambios más habituales.
// Flujo cubierto: sesión -> validación de body -> controlador.
// Expone el router de Express para perfil, comunidad activa, avatar y baja de cuenta.
// Lo consume app.js al montar el módulo users.
const asyncHandler = require('../../lib/http/asyncHandler');
const { uploadAvatar } = require('../../lib/storage/avatarUpload');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const usersController = require('./users.controller');
const { updateMyProfileSchema, deleteMyAccountSchema, validateChangeActiveCommunity } = require('./users.validation');

const router = express.Router();

// --- Perfil propio: GET de consulta ---
router.get(
  '/me', 
  requireSession, 
  asyncHandler(usersController.getMyProfile)
);

// --- Perfil propio: PATCH de edición ---
router.patch(
  '/me', 
  requireSession, 
  validate({ body: updateMyProfileSchema }), 
  asyncHandler(usersController.updateMyProfile)
);

// --- Contexto del usuario: PUT de cambio explícito ---
router.put(
  '/me/active-community', 
  requireSession, 
  validateChangeActiveCommunity, 
  asyncHandler(usersController.changeMyActiveCommunity)
);

// --- Avatar propio: PUT de subida/reemplazo ---
router.put(
  '/me/avatar', 
  requireSession, 
  uploadAvatar, 
  asyncHandler(usersController.updateMyAvatar)
);

// --- Avatar y cuenta: DELETE de eliminación ---
router.delete(
  '/me/avatar', 
  requireSession, 
  asyncHandler(usersController.deleteMyAvatar)
);

router.delete(
  '/me', 
  requireSession, 
  validate({ body: deleteMyAccountSchema }), 
  asyncHandler(usersController.deleteMyAccount)
);

module.exports = router;