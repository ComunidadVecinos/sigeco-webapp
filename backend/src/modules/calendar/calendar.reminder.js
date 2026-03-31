// Helper de eventors automáticos (recordatorios) del módulo calendar.
//   --> Mantiene una ventana de recordatorio de hasta una hora (fecha y rango horario dentro del mismo día).)

function padTimeSegment(value) {
  return String(value).padStart(2, '0');
}

function formatTimeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${padTimeSegment(hours)}:${padTimeSegment(minutes)}`;
}

function subtractUtcDays(date, days) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - days));
}

function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function buildOneHourAutomaticReminderWindow(eventDate, endTime) {
  const endMinutes = parseTimeToMinutes(endTime);

  // El cierre exacto a medianoche se desplaza al día anterior para evitar crear un evento que cruce días.
  if (endMinutes === 0) {
    return { date: subtractUtcDays(eventDate, 1), startTime: '23:00', endTime: '23:59' };
  }

  // Si el cierre cae durante la primera hora del día, el recordatorio se recorta al inicio del propio día.
  if (endMinutes < 60) {
    return { date: eventDate, startTime: '00:00', endTime };
  }

  return { date: eventDate, startTime: formatTimeFromMinutes(endMinutes - 60), endTime };
}

module.exports = { buildOneHourAutomaticReminderWindow };