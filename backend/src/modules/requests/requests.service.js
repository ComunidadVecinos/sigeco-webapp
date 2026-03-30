const { Prisma } = require('@prisma/client');

// Servicio del módulo help.
//   - Orquesta ciclo de vida de las solicitudes de comunidad. Depeende de members.

const { buildAddressSummary } = require('../../lib/address');
const { ConflictError, NotFoundError, ForbiddenError } = require('../../lib/errors');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

function buildRequestedPropertyLabel(alias) {
  return `Vivienda de ${alias}`;
}

function buildRequestResponse(message, result, community) {
  return {
    message,
    community: { id: community.id, name: community.name },
    request: {
      id: result.request.id,
      type: result.request.type,
      status: result.request.status,
      createdAt: result.request.createdAt.toISOString()
    },
    details: { proposedAlias: result.details.proposedAlias, label: result.details.label }
  };
}

function mapMyRequest(request) {
  return {
    id: request.id,
    type: request.type,
    community: { id: request.community.id, name: request.community.name }, 
    proposedAlias: request.details?.proposedAlias || null,
    proposedAddress: buildAddressSummary(request.details),
    requestComment: request.requestComment || null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    resolvedAt: request.resolvedAt ? request.resolvedAt.toISOString() : null
  };
}

function mapManagedRequest(request) {
  return {
    id: request.id,
    type: request.type,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    resolvedAt: request.resolvedAt ? request.resolvedAt.toISOString() : null,
    cancelledAt: request.cancelledAt ? request.cancelledAt.toISOString() : null,
    archivedAt: request.archivedAt ? request.archivedAt.toISOString() : null
  };
}

function isKnownApprovalStateError(error) {
  return [
    'REQUEST_APPROVAL_DETAILS_NOT_FOUND',
    'REQUEST_APPROVAL_JOIN_MEMBERSHIP_ALREADY_EXISTS',
    'REQUEST_APPROVAL_JOIN_USER_NOT_FOUND',
    'REQUEST_APPROVAL_UPDATE_INFO_MEMBERSHIP_NOT_FOUND'
  ].includes(error?.message);
}

function mapCommunityPendingRequest(request) {
  const requesterName = [request.user?.firstName, request.user?.lastName].filter(Boolean).join(' ').trim();

  return {
    id: request.id,
    type: request.type,
    community: {
      id: request.community.id,
      name: request.community.name
    },
    requesterName: requesterName || null,
    proposedAlias: request.details?.proposedAlias || null,
    proposedAddress: buildAddressSummary(request.details),
    requestComment: request.requestComment || null,
    status: request.status,
    createdAt: request.createdAt.toISOString()
  };
}

async function requireOwnedRequest(userId, requestId, requestsRepository) {
  const request = await requestsRepository.findRequestById(requestId);

  if (!request) {
    throw new NotFoundError('Solicitud no encontrada');
  }

  if (request.userId !== userId) {
    throw new ForbiddenError('La solicitud no pertenece al usuario autenticado');
  }

  return request;
}

async function requireReviewableRequest(userId, requestId, requestsRepository) {
  const request = await requestsRepository.findRequestForReviewById(requestId);

  if (!request) {
    throw new NotFoundError('Solicitud no encontrada');
  }

  // La autorización se resuelve contra la comunidad de la propia solicitud.
  const reviewerMembership = await requireAdministrativeMembership(userId, request.communityId);

  return { request, reviewerMembership };
}

async function requireAdministrativeMembership(userId, communityId) {
  // Requests reutiliza la política de acceso de members.
  const { membership } = await membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
  return membership;
}

// Solo se permite una solicitud pendiente por usuario.
async function createCommunityRequest(context, input, requestsRepository, options) {
  const pendingRequest = await requestsRepository.findPendingRequestByUserAndCommunity(context.userId, options.community.id);

  if (pendingRequest) {
    throw new ConflictError('Ya existe una solicitud pendiente de este tipo');
  }

  const result = await requestsRepository.createRequestWithDetails({
    userId: context.userId,
    communityId: options.community.id,
    type: options.type,
    proposedAlias: input.proposedAlias,
    label: buildRequestedPropertyLabel(input.proposedAlias),
    country: input.country,
    province: input.province,
    municipality: input.municipality,
    streetType: input.streetType,
    streetName: input.streetName,
    postalCode: input.postalCode,
    streetNumberKm: input.streetNumberKm,
    block: input.block,
    floor: input.floor,
    door: input.door,
    requestComment: input.requestComment
  });

  return buildRequestResponse(options.successMessage, result, options.community);
}

async function createJoinRequest(context, input, requestsRepository) {
  const community = await requestsRepository.findCommunityByAccessCode(input.accessCode);

  if (!community) {
    throw new NotFoundError('No se ha encontrado ninguna comunidad para el código de acceso indicado');
  }

  const activeMembership = await requestsRepository.findActiveMembershipByUserAndCommunity(context.userId, community.id);

  if (activeMembership) {
    throw new ConflictError('El usuario ya pertenece a esta comunidad');
  }

  // El acceso por código solo sirve para localizar la comunidad destino (debe aprobar el administrador).
  return createCommunityRequest(context, input, requestsRepository, {
    community,
    type: 'JOIN',
    successMessage: 'Solicitud de alta creada correctamente.'
  });
}

async function createUpdateInfoRequest(context, input, requestsRepository) {
  // UPDATE_INFO exige pertenencia previa a la comunidad.
  const { community } = await membersService.requireCommunityMembershipAccess(context.userId, input.communityId, membersRepository);

  return createCommunityRequest(context, input, requestsRepository, {
    community,
    type: 'UPDATE_INFO',
    successMessage: 'Solicitud de actualización de datos creada correctamente.'
  });
}

async function createRequest(context, input, requestsRepository) {
  if (input.type === 'JOIN') {
    return createJoinRequest(context, input, requestsRepository);
  }
  return createUpdateInfoRequest(context, input, requestsRepository);
}

// Debe ser utilizado junto con getMyProfile() para mostrar el estado de las solicitudes activas del perfil de usuario.
async function getMyRequests(userId, requestsRepository) {
  const requests = await requestsRepository.findRequestsByUserId(userId);

  return { items: requests.map(mapMyRequest) };
}

async function getCommunityPendingRequests(userId, query, requestsRepository) {
  const membership = await requireAdministrativeMembership(userId, query.communityId);
  const result = await requestsRepository.findPendingRequestsByCommunity({
    communityId: query.communityId,
    type: query.type,
    page: query.page,
    pageSize: query.pageSize
  });

  return {
    community: { id: membership.community.id, name: membership.community.name },
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
    items: result.items.map(mapCommunityPendingRequest)
  };
}

async function cancelRequest(userId, requestId, requestsRepository) {
  const request = await requireOwnedRequest(userId, requestId, requestsRepository);

  if (request.archivedAt) {
    throw new ForbiddenError('Las solicitudes archivadas no se pueden cancelar');
  }

  if (request.status !== 'PENDING') {
    throw new ConflictError('Solo se pueden cancelar las solicitudes pendientes');
  }

  // Cancelar no borra el historial: cambia el estado para preservar trazabilidad.
  const updatedRequest = await requestsRepository.updateRequestState(requestId, { status: 'CANCELLED', cancelledAt: new Date() });

  return { message: 'Solicitud cancelada correctamente.', request: mapManagedRequest(updatedRequest) };
}

async function archiveRequest(userId, requestId, requestsRepository) {
  const request = await requireOwnedRequest(userId, requestId, requestsRepository);

  if (request.archivedAt) {
    throw new ForbiddenError('Esta solicitud ya está archivada');
  }

  if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)) {
    throw new ConflictError('Solo se pueden archivar solicitudes aprobadas, rechazadas o canceladas');
  }

  // Archivar es una decisión de visibilidad del usuario; no altera la resolución.
  const updatedRequest = await requestsRepository.updateRequestState(requestId, { archivedAt: new Date() });

  return { message: 'Solicitud archivada correctamente.', request: mapManagedRequest(updatedRequest) };
}

async function approveRequest(userId, requestId, input, requestsRepository) {
  const { request, reviewerMembership } = await requireReviewableRequest(userId, requestId, requestsRepository);

  if (request.archivedAt) {
    throw new NotFoundError('Solicitud no encontrada');
  }

  if (request.status !== 'PENDING') {
    throw new ConflictError('Solo se pueden aprobar las solicitudes pendientes');
  }

  let updatedRequest;
  try {
    updatedRequest = await requestsRepository.approveRequest({ requestId, resolvedByMembershipId: reviewerMembership.id, resolutionMessage: input.resolutionMessage });
  } 
  catch (error) {
    if (isKnownApprovalStateError(error)) {
      throw new ConflictError('La solicitud ya no se puede aprobar debido al estado actual de la pertenencia');
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('La solicitud ya no se puede aprobar debido al estado actual de la pertenencia');
    }

    throw error;
  }

  if (!updatedRequest) {
    throw new ConflictError('Solo se pueden aprobar las solicitudes pendientes');
  }

  return { message: 'Solicitud aprobada correctamente.', request: mapManagedRequest(updatedRequest) };
}

async function rejectRequest(userId, requestId, input, requestsRepository) {
  const { request, reviewerMembership } = await requireReviewableRequest(userId, requestId, requestsRepository);

  if (request.archivedAt) {
    throw new NotFoundError('Solicitud no encontrada');
  }

  if (request.status !== 'PENDING') {
    throw new ConflictError('Solo se pueden rechazar las solicitudes pendientes');
  }

  // Rechazar resuelve la bandeja sin tocar memberships ni propiedades del usuario.
  const updatedRequest = await requestsRepository.rejectRequest({ requestId, resolvedByMembershipId: reviewerMembership.id, resolutionMessage: input.resolutionMessage });

  if (!updatedRequest) {
    throw new ConflictError('Solo se pueden rechazar las solicitudes pendientes');
  }

  return { message: 'Solicitud rechazada correctamente.', request: mapManagedRequest(updatedRequest) };
}

module.exports = { createRequest, getMyRequests, getCommunityPendingRequests, cancelRequest, archiveRequest, approveRequest, rejectRequest };
