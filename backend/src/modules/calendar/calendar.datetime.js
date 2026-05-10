// Utilidades horarias del calendario: convierten fechas de negocio y UTC para todo el backend.
// Flujo cubierto: instantes UTC <-> día/hora de negocio en Europe/Madrid.
// Expone helpers de composición, formato y desplazamiento temporal reutilizados por calendar, reservations, news y voting.
// Lo consumen calendar.service.js, calendar.reminder.js y otros módulos que proyectan eventos.
const {
  padTimeSegment,
  buildBusinessDateTime,
  formatBusinessDate,
  formatBusinessTime,
  buildBusinessDateOnly,
  addBusinessDays,
  addMinutesToInstant
} = require('../../lib/datetime/businessTime');

module.exports = {
  padTimeSegment,
  buildBusinessDateTime,
  formatBusinessDate,
  formatBusinessTime,
  buildBusinessDateOnly,
  addBusinessDays,
  addMinutesToInstant
};