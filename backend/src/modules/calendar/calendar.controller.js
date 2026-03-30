const calendarRepository = require('./calendar.repository');
const calendarService = require('./calendar.service');

async function getCalendarMonthEvents(req, res) {
  const result = await calendarService.getCalendarMonthEvents(
    { userId: req.user.id },
    req.params.communityId,
    req.query,
    calendarRepository
  );

  return res.status(200).json(result);
}

async function createPersonalEvent(req, res) {
  const result = await calendarService.createPersonalEvent(
    { userId: req.user.id },
    req.params.communityId,
    req.body,
    calendarRepository
  );

  return res.status(201).json(result);
}

async function updatePersonalEvent(req, res) {
  const result = await calendarService.updatePersonalEvent(
    { userId: req.user.id },
    req.params.communityId,
    req.params.eventId,
    req.body,
    calendarRepository
  );

  return res.status(200).json(result);
}

async function deletePersonalEvent(req, res) {
  const result = await calendarService.deletePersonalEvent(
    { userId: req.user.id },
    req.params.communityId,
    req.params.eventId,
    calendarRepository
  );

  return res.status(200).json(result);
}

module.exports = {
  getCalendarMonthEvents,
  createPersonalEvent,
  updatePersonalEvent,
  deletePersonalEvent
};
