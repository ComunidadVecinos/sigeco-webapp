const express = require('express');

// Rutas HTTP del módulo users.
const asyncHandler = require('../../lib/http/asyncHandler');
const { uploadAvatar } = require('../../lib/storage/avatarUpload');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const usersController = require('./users.controller');
const { updateMyProfileSchema, deleteMyAccountSchema, validateChangeActiveCommunity } = require('./users.validation');

const router = express.Router();

// Users expone solo operaciones sobre el usuario autenticado (/me).
router.get('/me', requireSession, asyncHandler(usersController.getMyProfile));
router.patch('/me', requireSession, validate({ body: updateMyProfileSchema }), asyncHandler(usersController.updateMyProfile));
router.put('/me/active-community', requireSession, validateChangeActiveCommunity, asyncHandler(usersController.changeMyActiveCommunity));
router.put('/me/avatar', requireSession, uploadAvatar, asyncHandler(usersController.updateMyAvatar));
router.delete('/me', requireSession, validate({ body: deleteMyAccountSchema }), asyncHandler(usersController.deleteMyAccount));

module.exports = router;