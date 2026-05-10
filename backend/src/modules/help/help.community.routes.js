const express = require('express');

// Router comunitario de help: reúne la gestión interna de secciones de ayuda de cada comunidad.
// Flujo cubierto: sesión -> validación de params/body -> controlador.
// Expone el router de Express para listar, crear, editar, borrar y reordenar secciones de ayuda comunitaria.
// Lo consume el router de communities como subrecurso con communityId.
const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const helpController = require('./help.controller');
const { communityIdParamSchema, helpSectionParamsSchema, createHelpSectionSchema, updateHelpSectionSchema, reorderHelpSectionsSchema } = require('./help.validation');

const router = express.Router({ mergeParams: true });

// --- Ayuda comunitaria: GET de consulta ---
router.get(
  '/sections', 
  requireSession, 
  validate({ params: communityIdParamSchema }), 
  asyncHandler(helpController.getHelpSections)
);

// --- Ayuda comunitaria: POST de creación ---
router.post(
  '/sections', 
  requireSession, 
  validate({ params: communityIdParamSchema, body: createHelpSectionSchema }), 
  asyncHandler(helpController.createHelpSection)
);

// --- Ayuda comunitaria: PATCH de edición ---
router.patch(
  '/sections/:sectionId', 
  requireSession, 
  validate({ params: helpSectionParamsSchema, body: updateHelpSectionSchema }), 
  asyncHandler(helpController.updateHelpSection)
);

// --- Ayuda comunitaria: PUT de reordenación ---
router.put(
  '/sections/order', 
  requireSession, 
  validate({ params: communityIdParamSchema, body: reorderHelpSectionsSchema }), 
  asyncHandler(helpController.reorderHelpSections)
);

// --- Ayuda comunitaria: DELETE de borrado lógico ---
router.delete(
  '/sections/:sectionId', 
  requireSession, 
  validate({ params: helpSectionParamsSchema }), 
  asyncHandler(helpController.deleteHelpSection)
);

module.exports = router;