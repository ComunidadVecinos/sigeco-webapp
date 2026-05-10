// Utilidades temporales del backend.
// La regla clave está aquí: los instantes se guardan en UTC, pero el calendario de negocio se interpreta en Europe/Madrid.
const { DateTime } = require('luxon');

const BUSINESS_TIME_ZONE = 'Europe/Madrid';
const DATE_ONLY_FORMAT = 'yyyy-MM-dd';
const TIME_ONLY_FORMAT = 'HH:mm';
const DATE_TIME_FORMAT = `${DATE_ONLY_FORMAT} ${TIME_ONLY_FORMAT}`;

// Parseo y validación de entradas de fecha/hora.
function parseInstantToUtcDate(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const parsedDateTime = DateTime.fromISO(value, { setZone: true });
  return parsedDateTime.isValid ? parsedDateTime.toUTC().toJSDate() : null;
}

function isValidInstantString(value) {
  return Boolean(parseInstantToUtcDate(value));
}

function padTimeSegment(value) {
  return String(value).padStart(2, '0');
}

// Normalización de fechas de negocio.
function extractDateOnlyParts(dateInput) {
  if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number);
    return { year, month, day };
  }
  // Cuando recibimos un Date que representa un "date-only" persistido en UTC,
  // lo reexpresamos primero como hora de Madrid para recuperar su día visible.
  const businessDate = DateTime.fromJSDate(dateInput, { zone: 'utc' }).setZone(BUSINESS_TIME_ZONE);
  return { year: businessDate.year, month: businessDate.month, day: businessDate.day };
}

function formatDateOnlyParts(dateInput) {
  const { year, month, day } = extractDateOnlyParts(dateInput);
  return `${year}-${padTimeSegment(month)}-${padTimeSegment(day)}`;
}

function isValidDateOnlyString(value) {
  const parsedDate = DateTime.fromFormat(value, DATE_ONLY_FORMAT, { zone: 'utc' });
  return parsedDate.isValid && parsedDate.toFormat(DATE_ONLY_FORMAT) === value;
}

function dateOnlyStringToUtcDate(value) {
  const parsedDate = DateTime.fromFormat(value, DATE_ONLY_FORMAT, { zone: 'utc' });
  return parsedDate.isValid ? parsedDate.toUTC().toJSDate() : null;
}

// Conversión entre calendario de negocio e instantes UTC.
function buildBusinessDateTime(dateInput, time) {
  // Combina fecha y hora de negocio en Madrid y la convierte al instante UTC que se valida, persiste y expone por API.
  const parsedDateTime = DateTime.fromFormat(`${formatDateOnlyParts(dateInput)} ${time}`, DATE_TIME_FORMAT, { zone: BUSINESS_TIME_ZONE, setZone: true });
  return parsedDateTime.isValid ? parsedDateTime.toUTC().toJSDate() : null;
}

function formatBusinessDate(date) {
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(BUSINESS_TIME_ZONE).toFormat(DATE_ONLY_FORMAT);
}

function formatBusinessTime(date) {
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(BUSINESS_TIME_ZONE).toFormat(TIME_ONLY_FORMAT);
}

function buildBusinessDateOnly(dateInput) {
  return dateOnlyStringToUtcDate(formatDateOnlyParts(dateInput));
}

function addBusinessDays(dateInput, days) {
  const nextDate = DateTime.fromFormat(formatDateOnlyParts(dateInput), DATE_ONLY_FORMAT, { zone: BUSINESS_TIME_ZONE }).plus({ days });
  return dateOnlyStringToUtcDate(nextDate.toFormat(DATE_ONLY_FORMAT));
}

function startOfBusinessDayUtc(dateInput) {
  // Los filtros por día usan el inicio del día de negocio en Madrid, no UTC, para evitar desfases en listados y segmentaciones.
  const businessDate = formatDateOnlyParts(dateInput);
  return DateTime.fromFormat(businessDate, DATE_ONLY_FORMAT, { zone: BUSINESS_TIME_ZONE, setZone: true }).startOf('day').toUTC().toJSDate();
}

function startOfNextBusinessDayUtc(dateInput) {
  const businessDate = formatDateOnlyParts(dateInput);
  return DateTime.fromFormat(businessDate, DATE_ONLY_FORMAT, { zone: BUSINESS_TIME_ZONE, setZone: true }).plus({ days: 1 }).startOf('day').toUTC().toJSDate();
}

function addMinutesToInstant(date, minutes) {
  return new Date(date.getTime() + (minutes * 60 * 1000));
}

module.exports = {
  BUSINESS_TIME_ZONE,
  parseInstantToUtcDate,
  isValidInstantString,
  padTimeSegment,
  isValidDateOnlyString,
  dateOnlyStringToUtcDate,
  buildBusinessDateTime,
  formatBusinessDate,
  formatBusinessTime,
  buildBusinessDateOnly,
  addBusinessDays,
  startOfBusinessDayUtc,
  startOfNextBusinessDayUtc,
  addMinutesToInstant
};