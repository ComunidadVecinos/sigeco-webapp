const express = require('express');

// Rutas compartidas del módulo help.

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const helpController = require('./help.controller');
const { helpSectionsQuerySchema } = require('./help.validation');

const router = express.Router();

// Expone ayuda general y, opcionalmente, ayuda de una comunidad para usuarios autenticados con membership.
router.get('/sections', requireSession, validate({ query: helpSectionsQuerySchema }), asyncHandler(helpController.getPublicHelpSections));

module.exports = router;