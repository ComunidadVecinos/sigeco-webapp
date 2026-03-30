const express = require('express');

// Rutas de administración y lectura comunitaria del modulo help.
// Se montan como subrecurso de communities y heredan su contexto de comunidad.

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const helpController = require('./help.controller');
const { communityIdParamSchema, helpSectionParamsSchema, createHelpSectionSchema, updateHelpSectionSchema, reorderHelpSectionsSchema } = require('./help.validation');

const router = express.Router({ mergeParams: true });

router.get('/sections', requireSession, validate({ params: communityIdParamSchema }), asyncHandler(helpController.getHelpSections));
router.post('/sections', requireSession, validate({ params: communityIdParamSchema, body: createHelpSectionSchema }), asyncHandler(helpController.createHelpSection));
router.patch('/sections/:sectionId', requireSession, validate({ params: helpSectionParamsSchema, body: updateHelpSectionSchema }), asyncHandler(helpController.updateHelpSection));
router.delete('/sections/:sectionId', requireSession, validate({ params: helpSectionParamsSchema }), asyncHandler(helpController.deleteHelpSection));
router.put('/sections/order', requireSession, validate({ params: communityIdParamSchema, body: reorderHelpSectionsSchema }), asyncHandler(helpController.reorderHelpSections));

module.exports = router;