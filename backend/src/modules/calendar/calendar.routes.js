// Router de calendar: reúne la vista mensual y el CRUD de eventos personales con su validación.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para consulta mensual y CRUD de eventos personales.
// Lo consume el router de comunidades como subrecurso con `communityId`.
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const calendarController = require('./calendar.controller');
const { communityIdParamSchema, personalCalendarEventParamsSchema, getCalendarMonthQuerySchema, createPersonalCalendarEventSchema, updatePersonalCalendarEventSchema } = require('./calendar.validation');
const router = express.Router({ mergeParams: true });

// --- Calendario comunitario: GET de consulta mensual ---
router.get(
  '/', 
  requireSession, 
  validate({ params: communityIdParamSchema, query: getCalendarMonthQuerySchema }), 
  asyncHandler(calendarController.getCalendarMonthEvents)
);

// --- Eventos personales: POST de creación ---
router.post(
  '/personal', 
  requireSession, 
  validate({ params: communityIdParamSchema, body: createPersonalCalendarEventSchema }), 
  asyncHandler(calendarController.createPersonalEvent)
);

// --- Eventos personales: PATCH de edición ---
router.patch(
  '/personal/:eventId', 
  requireSession, 
  validate({ params: personalCalendarEventParamsSchema, body: updatePersonalCalendarEventSchema }), 
  asyncHandler(calendarController.updatePersonalEvent)
);

// --- Eventos personales: DELETE de borrado lógico ---
router.delete(
  '/personal/:eventId', 
  requireSession, 
  validate({ params: personalCalendarEventParamsSchema }), 
  asyncHandler(calendarController.deletePersonalEvent)
);

module.exports = router;