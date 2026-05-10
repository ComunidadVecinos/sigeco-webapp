// Capa HTTP de calendar: baja las peticiones del calendario a llamadas de servicio y respuesta JSON.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de consulta mensual y CRUD de eventos personales.
// Lo consumen las rutas del módulo con asyncHandler.
const calendarRepository = require('./calendar.repository');
const calendarService = require('./calendar.service');

function requestContext(req) {
  return { userId: req.user.id };
}

// --- Calendario comunitario: GET ---
async function getCalendarMonthEvents(req, res) {
  const result = await calendarService.getCalendarMonthEvents(
    requestContext(req),
    req.params.communityId,
    req.query,
    calendarRepository
  );
  return res.status(200).json(result);
}

// --- Eventos personales: POST ---
async function createPersonalEvent(req, res) {
  const result = await calendarService.createPersonalEvent(
    requestContext(req),
    req.params.communityId,
    req.body,
    calendarRepository
  );
  return res.status(201).json(result);
}

// --- Eventos personales: PATCH ---
async function updatePersonalEvent(req, res) {
  const result = await calendarService.updatePersonalEvent(
    requestContext(req),
    req.params.communityId,
    req.params.eventId,
    req.body,
    calendarRepository
  );
  return res.status(200).json(result);
}

// --- Eventos personales: DELETE ---
async function deletePersonalEvent(req, res) {
  const result = await calendarService.deletePersonalEvent(
    requestContext(req),
    req.params.communityId,
    req.params.eventId,
    calendarRepository
  );
  return res.status(200).json(result);
}

module.exports = { getCalendarMonthEvents, createPersonalEvent, updatePersonalEvent, deletePersonalEvent };