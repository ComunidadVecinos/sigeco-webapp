// Controladores HTTP del módulo reservations.
const reservationsRepository = require('./reservations.repository');
const reservationsService = require('./reservations.service');

function requestContext(req) {
  return { userId: req.user.id };
}

async function createSpace(req, res) {
  const result = await reservationsService.createSpace(requestContext(req), req.params.communityId, req.body, reservationsRepository);
  return res.status(201).json(result);
}

async function getSpaceList(req, res) {
  const result = await reservationsService.getSpaceList(requestContext(req), req.params.communityId, req.query, reservationsRepository);
  return res.status(200).json(result);
}

async function getSpaceDetail(req, res) {
  const result = await reservationsService.getSpaceDetail(requestContext(req), req.params.communityId, req.params.spaceId, reservationsRepository);
  return res.status(200).json(result);
}

async function updateSpace(req, res) {
  const result = await reservationsService.updateSpace(requestContext(req), req.params.communityId, req.params.spaceId, req.body, reservationsRepository);
  return res.status(200).json(result);
}

async function updateSpaceStatus(req, res) {
  const result = await reservationsService.updateSpaceStatus(requestContext(req), req.params.communityId, req.params.spaceId, req.body, reservationsRepository);
  return res.status(200).json(result);
}

async function deleteSpace(req, res) {
  const result = await reservationsService.deleteSpace(requestContext(req), req.params.communityId, req.params.spaceId, reservationsRepository);
  return res.status(200).json(result);
}

async function getSpaceAvailability(req, res) {
  const result = await reservationsService.getSpaceAvailability(requestContext(req), req.params.communityId, req.params.spaceId, req.query, reservationsRepository);
  return res.status(200).json(result);
}

async function getSpaceCalendar(req, res) {
  const result = await reservationsService.getSpaceCalendar(requestContext(req), req.params.communityId, req.params.spaceId, req.query, reservationsRepository);
  return res.status(200).json(result);
}

async function createBooking(req, res) {
  const result = await reservationsService.createBooking(requestContext(req), req.params.communityId, req.body, reservationsRepository);
  return res.status(201).json(result);
}

async function getMyBookings(req, res) {
  const result = await reservationsService.getMyBookings(requestContext(req), req.params.communityId, req.query, reservationsRepository);
  return res.status(200).json(result);
}

async function getBookingDetail(req, res) {
  const result = await reservationsService.getBookingDetail(requestContext(req), req.params.communityId, req.params.bookingId, reservationsRepository);
  return res.status(200).json(result);
}

async function cancelBooking(req, res) {
  const result = await reservationsService.cancelBooking(requestContext(req), req.params.communityId, req.params.bookingId, req.body || {}, reservationsRepository);
  return res.status(200).json(result);
}

async function getAdminBookings(req, res) {
  const result = await reservationsService.getAdminBookings(requestContext(req), req.params.communityId, req.query, reservationsRepository);
  return res.status(200).json(result);
}

module.exports = {
  createSpace,
  getSpaceList,
  getSpaceDetail,
  updateSpace,
  updateSpaceStatus,
  deleteSpace,
  getSpaceAvailability,
  getSpaceCalendar,
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  getAdminBookings
};