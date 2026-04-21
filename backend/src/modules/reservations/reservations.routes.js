const express = require('express');

// Rutas HTTP del módulo reservations.
// Se monta como subrecurso de comunidad para compartir `communityId` y mantener la API agrupada.
const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const reservationsController = require('./reservations.controller');
const {
  communityIdParamSchema,
  spaceParamsSchema,
  bookingParamsSchema,
  createSpaceSchema,
  updateSpaceSchema,
  updateSpaceStatusSchema,
  listSpacesQuerySchema,
  availabilityQuerySchema,
  spaceCalendarQuerySchema,
  createBookingSchema,
  listMyBookingsQuerySchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
  normalizeNullableSpaceBody
} = require('./reservations.validation');

const router = express.Router({ mergeParams: true });

// --- Espacios ---
router.post(
  '/spaces',
  requireSession,
  normalizeNullableSpaceBody,
  validate({ params: communityIdParamSchema, body: createSpaceSchema }),
  asyncHandler(reservationsController.createSpace)
);

router.get(
  '/spaces',
  requireSession,
  validate({ params: communityIdParamSchema, query: listSpacesQuerySchema }),
  asyncHandler(reservationsController.getSpaceList)
);

router.get(
  '/spaces/:spaceId/availability',
  requireSession,
  validate({ params: spaceParamsSchema, query: availabilityQuerySchema }),
  asyncHandler(reservationsController.getSpaceAvailability)
);

router.get(
  '/spaces/:spaceId/calendar',
  requireSession,
  validate({ params: spaceParamsSchema, query: spaceCalendarQuerySchema }),
  asyncHandler(reservationsController.getSpaceCalendar)
);

router.get(
  '/spaces/:spaceId',
  requireSession,
  validate({ params: spaceParamsSchema }),
  asyncHandler(reservationsController.getSpaceDetail)
);

router.patch(
  '/spaces/:spaceId/status',
  requireSession,
  validate({ params: spaceParamsSchema, body: updateSpaceStatusSchema }),
  asyncHandler(reservationsController.updateSpaceStatus)
);

router.patch(
  '/spaces/:spaceId',
  requireSession,
  normalizeNullableSpaceBody,
  validate({ params: spaceParamsSchema, body: updateSpaceSchema }),
  asyncHandler(reservationsController.updateSpace)
);

router.delete(
  '/spaces/:spaceId',
  requireSession,
  validate({ params: spaceParamsSchema }),
  asyncHandler(reservationsController.deleteSpace)
);

// --- Reservas de usuario ---
router.post(
  '/bookings',
  requireSession,
  validate({ params: communityIdParamSchema, body: createBookingSchema }),
  asyncHandler(reservationsController.createBooking)
);

router.get(
  '/bookings/me',
  requireSession,
  validate({ params: communityIdParamSchema, query: listMyBookingsQuerySchema }),
  asyncHandler(reservationsController.getMyBookings)
);

router.post(
  '/bookings/:bookingId/cancel',
  requireSession,
  validate({ params: bookingParamsSchema, body: cancelBookingSchema }),
  asyncHandler(reservationsController.cancelBooking)
);

router.get(
  '/bookings/:bookingId',
  requireSession,
  validate({ params: bookingParamsSchema }),
  asyncHandler(reservationsController.getBookingDetail)
);

// --- Administración de reservas ---
router.get(
  '/bookings',
  requireSession,
  validate({ params: communityIdParamSchema, query: listBookingsQuerySchema }),
  asyncHandler(reservationsController.getAdminBookings)
);

module.exports = router;