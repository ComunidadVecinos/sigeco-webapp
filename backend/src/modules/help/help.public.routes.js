const express = require('express');

// Router público de help: expone la ayuda visible y la lectura filtrada por comunidad.
// Flujo cubierto: sesión -> validación de query -> controlador.
// Expone el router de Express para consultar las secciones de ayuda visibles para el usuario autenticado.
// Lo consume app.js bajo "/api/help".
const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const helpController = require('./help.controller');
const { helpSectionsQuerySchema } = require('./help.validation');

const router = express.Router();

// --- Ayuda pública autenticada sin comunidad: GET de consulta ---
router.get(
  '/sections', 
  requireSession, 
  validate({ query: helpSectionsQuerySchema }), 
  asyncHandler(helpController.getPublicHelpSections)
);

module.exports = router;