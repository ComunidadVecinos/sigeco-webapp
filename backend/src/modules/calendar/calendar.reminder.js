// Helpers de proyección diaria para eventos automáticos del calendario.
// Parten de instantes UTC ya normalizados y los convierten a días y horas en Europe/Madrid antes de persistir en BD.
const {
  padTimeSegment,
  formatBusinessDate,
  formatBusinessTime,
  buildBusinessDateOnly,
  addBusinessDays
} = require('./calendar.datetime');

const MAX_CALENDAR_TITLE_LENGTH = 160;

function buildCalendarTitle(prefix, title) {
  const fullTitle = `${prefix}: ${String(title || '').trim()}`;
  if (fullTitle.length <= MAX_CALENDAR_TITLE_LENGTH) {
    return fullTitle;
  }
  return `${fullTitle.slice(0, MAX_CALENDAR_TITLE_LENGTH - 3).trimEnd()}...`;
}

function formatTimeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${padTimeSegment(hours)}:${padTimeSegment(minutes)}`;
}

function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function isSameBusinessDay(leftDate, rightDate) {
  return leftDate.getUTCFullYear() === rightDate.getUTCFullYear()
    && leftDate.getUTCMonth() === rightDate.getUTCMonth()
    && leftDate.getUTCDate() === rightDate.getUTCDate();
}

function buildAutomaticCalendarEvent({ date, startTime, endTime, title }) {
  return { sourceOccurrenceKey: formatBusinessDate(date), eventDate: date, startTime, endTime, title };
}

function buildVotingAutomaticCalendarEvents({ title, endsAt }) {
  const calendarTitle = buildCalendarTitle('Cierre votación', title);
  const endDate = buildBusinessDateOnly(endsAt);
  const endTime = formatBusinessTime(endsAt);
  const endMinutes = parseTimeToMinutes(endTime);

  if (endMinutes === 0) {
    return [buildAutomaticCalendarEvent({ date: addBusinessDays(endDate, -1), startTime: '00:00', endTime: '23:59', title: calendarTitle })];
  }

  return [buildAutomaticCalendarEvent({ date: endDate, startTime: '00:00', endTime, title: calendarTitle })];
}

function buildNewsAutomaticCalendarEvents({ title, eventStartsAt, eventEndsAt }) {
  if (!eventStartsAt) {
    return [];
  }

  const calendarTitle = buildCalendarTitle('Evento', title);
  const startDate = buildBusinessDateOnly(eventStartsAt);
  const startTime = formatBusinessTime(eventStartsAt);
  const startMinutes = parseTimeToMinutes(startTime);

  if (!eventEndsAt) {
    if (startMinutes === 1439) {
      return [buildAutomaticCalendarEvent({ date: addBusinessDays(startDate, 1), startTime: '00:00', endTime: '23:59', title: calendarTitle })];
    }
    return [buildAutomaticCalendarEvent({ date: startDate, startTime, endTime: '23:59', title: calendarTitle })];
  }

  const endDate = buildBusinessDateOnly(eventEndsAt);
  const endTime = formatBusinessTime(eventEndsAt);
  const endMinutes = parseTimeToMinutes(endTime);

  if (isSameBusinessDay(startDate, endDate)) {
    return [buildAutomaticCalendarEvent({ date: startDate, startTime, endTime, title: calendarTitle })];
  }

  const events = [];

  if (startMinutes < 1439) {
    events.push(buildAutomaticCalendarEvent({ date: startDate, startTime, endTime: '23:59', title: calendarTitle }));
  }

  for (let currentDate = addBusinessDays(startDate, 1); currentDate < endDate; currentDate = addBusinessDays(currentDate, 1)) {
    events.push(buildAutomaticCalendarEvent({ date: currentDate, startTime: '00:00', endTime: '23:59', title: calendarTitle }));
  }

  if (endMinutes > 0) {
    events.push(buildAutomaticCalendarEvent({ date: endDate, startTime: '00:00', endTime, title: calendarTitle }));
  }

  return events;
}

module.exports = { buildVotingAutomaticCalendarEvents, buildNewsAutomaticCalendarEvents };
