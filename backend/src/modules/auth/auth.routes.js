// Rutas HTTP del modulo auth.
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const authController = require('./auth.controller');
const { requireSession } = require('./auth.middleware');
const { registrationSchema, loginSchema, changePasswordSchema, passwordResetSchema } = require('./auth.validation');

const router = express.Router();

// Orden:
// - validate sanea entrada antes del controller
// - requireSession se aplica donde el contrato exige identidad autenticada
router.post('/registrations', validate({ body: registrationSchema }), asyncHandler(authController.register));
router.post('/sessions', validate({ body: loginSchema }), asyncHandler(authController.login));
router.delete('/sessions/current', requireSession, asyncHandler(authController.logout));
router.post('/password/change', requireSession, validate({ body: changePasswordSchema }), asyncHandler(authController.changePassword));
router.post('/password/reset', validate({ body: passwordResetSchema }), asyncHandler(authController.resetPassword));

module.exports = router;