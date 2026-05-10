// Router de reservations: reúne espacios, disponibilidad y reservas propias o administrativas.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express con CRUD de espacios, disponibilidad/calendario y reservas de usuario/admin.
// Lo consume el router de comunidades, montado como subrecurso con communityId.
const express = require('express');

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

// --- Espacios: GET de consulta ---
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

// --- Espacios: POST de creación ---
router.post(
  '/spaces',
  requireSession,
  normalizeNullableSpaceBody,
  validate({ params: communityIdParamSchema, body: createSpaceSchema }),
  asyncHandler(reservationsController.createSpace)
);

// --- Espacios: PATCH de edición ---
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

// --- Espacios: DELETE de borrado lógico ---
router.delete(
  '/spaces/:spaceId',
  requireSession,
  validate({ params: spaceParamsSchema }),
  asyncHandler(reservationsController.deleteSpace)
);

// --- Reservas propias: GET de consulta ---
router.get(
  '/bookings/me',
  requireSession,
  validate({ params: communityIdParamSchema, query: listMyBookingsQuerySchema }),
  asyncHandler(reservationsController.getMyBookings)
);

router.get(
  '/bookings/:bookingId',
  requireSession,
  validate({ params: bookingParamsSchema }),
  asyncHandler(reservationsController.getBookingDetail)
);

// --- Reservas propias: POST de creación/cancelación ---
router.post(
  '/bookings',
  requireSession,
  validate({ params: communityIdParamSchema, body: createBookingSchema }),
  asyncHandler(reservationsController.createBooking)
);

router.post(
  '/bookings/:bookingId/cancel',
  requireSession,
  validate({ params: bookingParamsSchema, body: cancelBookingSchema }),
  asyncHandler(reservationsController.cancelBooking)
);

// --- Administración de reservas: GET de consulta ---
router.get(
  '/bookings',
  requireSession,
  validate({ params: communityIdParamSchema, query: listBookingsQuerySchema }),
  asyncHandler(reservationsController.getAdminBookings)
);

module.exports = router;