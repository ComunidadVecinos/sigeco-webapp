// Utilidades temporales compartidas por los módulos que proyectan eventos en el calendario comunitario.
// Los pares fecha + hora siempre se interpretan en la zona de negocio Europe/Madrid y los instantes reales se guardan en UTC.
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