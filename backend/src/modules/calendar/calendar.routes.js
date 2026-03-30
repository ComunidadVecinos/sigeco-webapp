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

router.get('/', requireSession, validate({ params: communityIdParamSchema, query: getCalendarMonthQuerySchema }), asyncHandler(calendarController.getCalendarMonthEvents));
router.post('/personal', requireSession, validate({ params: communityIdParamSchema, body: createPersonalCalendarEventSchema }), asyncHandler(calendarController.createPersonalEvent));
router.patch('/personal/:eventId', requireSession, validate({ params: personalCalendarEventParamsSchema, body: updatePersonalCalendarEventSchema }), asyncHandler(calendarController.updatePersonalEvent));
router.delete('/personal/:eventId', requireSession, validate({ params: personalCalendarEventParamsSchema }), asyncHandler(calendarController.deletePersonalEvent));

module.exports = router;
