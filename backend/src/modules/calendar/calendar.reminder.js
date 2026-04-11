// Helpers de proyección diaria para eventos automáticos del calendario.
// Parten de instantes UTC ya normalizados y los convierten a días y horas en Europe/Madrid antes de persistir en BD.
const {
  padTimeSegment,
  formatBusinessDate,
  formatBusinessTime,
  buildBusinessDateOnly,
  addBusinessDays
} = require('./calendar.datetime');

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
  const endDate = buildBusinessDateOnly(endsAt);
  const endTime = formatBusinessTime(endsAt);
  const endMinutes = parseTimeToMinutes(endTime);

  if (endMinutes === 0) {
    return [buildAutomaticCalendarEvent({ date: addBusinessDays(endDate, -1), startTime: '00:00', endTime: '23:59', title })];
  }

  return [buildAutomaticCalendarEvent({ date: endDate, startTime: '00:00', endTime, title })];
}

function buildNewsAutomaticCalendarEvents({ title, eventStartsAt, eventEndsAt }) {
  if (!eventStartsAt) {
    return [];
  }

  const startDate = buildBusinessDateOnly(eventStartsAt);
  const startTime = formatBusinessTime(eventStartsAt);
  const startMinutes = parseTimeToMinutes(startTime);

  if (!eventEndsAt) {
    if (startMinutes === 1439) {
      return [buildAutomaticCalendarEvent({ date: addBusinessDays(startDate, 1), startTime: '00:00', endTime: '23:59', title })];
    }
    return [buildAutomaticCalendarEvent({ date: startDate, startTime, endTime: '23:59', title })];
  }

  const endDate = buildBusinessDateOnly(eventEndsAt);
  const endTime = formatBusinessTime(eventEndsAt);
  const endMinutes = parseTimeToMinutes(endTime);

  if (isSameBusinessDay(startDate, endDate)) {
    return [buildAutomaticCalendarEvent({ date: startDate, startTime, endTime, title })];
  }

  const events = [];

  if (startMinutes < 1439) {
    events.push(buildAutomaticCalendarEvent({ date: startDate, startTime, endTime: '23:59', title }));
  }

  for (let currentDate = addBusinessDays(startDate, 1); currentDate < endDate; currentDate = addBusinessDays(currentDate, 1)) {
    events.push(buildAutomaticCalendarEvent({ date: currentDate, startTime: '00:00', endTime: '23:59', title }));
  }

  if (endMinutes > 0) {
    events.push(buildAutomaticCalendarEvent({ date: endDate, startTime: '00:00', endTime, title }));
  }

  return events;
}

module.exports = { buildVotingAutomaticCalendarEvents, buildNewsAutomaticCalendarEvents };