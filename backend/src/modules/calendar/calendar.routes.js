// Rutas HTTP del módulo calendar.
// Se monta como subrecurso de comunidad para reutilizar el communityId de la URL (calendario alineado con el contexto activo de la aplicación)
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const calendarController = require('./calendar.controller');
const {
  communityIdParamSchema,
  personalCalendarEventParamsSchema,
  getCalendarMonthQuerySchema,
  createPersonalCalendarEventSchema,
  updatePersonalCalendarEventSchema
} = require('./calendar.validation');

const router = express.Router({ mergeParams: true });

// Solo endpoints de lectura (mensual) y CRUD de eventos personales.
//   - La sincronización de eventos automáticos queda como contrato interno entre módulos.
router.get('/', requireSession, validate({ params: communityIdParamSchema, query: getCalendarMonthQuerySchema }), asyncHandler(calendarController.getCalendarMonthEvents));
router.post('/personal', requireSession, validate({ params: communityIdParamSchema, body: createPersonalCalendarEventSchema }), asyncHandler(calendarController.createPersonalEvent));
router.patch('/personal/:eventId', requireSession, validate({ params: personalCalendarEventParamsSchema, body: updatePersonalCalendarEventSchema }), asyncHandler(calendarController.updatePersonalEvent));
router.delete('/personal/:eventId', requireSession, validate({ params: personalCalendarEventParamsSchema }), asyncHandler(calendarController.deletePersonalEvent));

module.exports = router;
