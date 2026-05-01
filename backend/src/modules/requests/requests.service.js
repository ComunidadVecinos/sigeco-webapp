const { Prisma } = require('@prisma/client');

// Servicio del módulo requests.
//   - Orquesta ciclo de vida de las solicitudes de comunidad. Depende de members.

const { buildAddressSummary } = require('../../lib/address');
const mailService = require('../../lib/mail');
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

function formatRequestType(type) {
  if (type === 'JOIN') {
    return 'alta en la comunidad';
  }

  if (type === 'UPDATE_INFO') {
    return 'actualización de datos';
  }

  return 'solicitud';
}

function formatRequestAddress(details) {
  const address = buildAddressSummary(details);

  return address.formatted || [
    details?.streetType,
    details?.streetName,
    details?.streetNumberKm,
    details?.block ? `Bloque ${details.block}` : null,
    details?.floor ? `Piso ${details.floor}` : null,
    details?.door ? `Puerta ${details.door}` : null,
    details?.postalCode,
    details?.municipality,
    details?.province
  ].filter(Boolean).join(', ');
}

function normalizeComparableValue(value) {
  return (value || '').trim();
}

function updateInfoHasChanges(input, membership) {
  const property = membership.property && !membership.property.deletedAt ? membership.property : {};
  const comparisons = [
    [input.proposedAlias, membership.alias],
    [input.country, property.country],
    [input.province, property.province],
    [input.municipality, property.municipality],
    [input.streetType, property.streetType],
    [input.streetName, property.streetName],
    [input.postalCode, property.postalCode],
    [input.streetNumberKm, property.streetNumberKm],
    [input.block, property.block],
    [input.floor, property.floor],
    [input.door, property.door]
  ];

  return comparisons.some(([proposedValue, currentValue]) => (
    normalizeComparableValue(proposedValue) !== normalizeComparableValue(currentValue)
  ));
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

function getRequesterGreeting(request) {
  const fullName = [request.user?.firstName, request.user?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || request.details?.proposedAlias || 'usuario';
}

function buildRequestResolutionBody(request, approved, resolutionMessage) {
  const communityName = request.community?.name || 'tu comunidad';
  const greeting = getRequesterGreeting(request);
  const reasonLine = resolutionMessage ? [`Motivo: "${resolutionMessage}"`, ''] : [];

  if (approved) {
    return [
      `Hola ${greeting},`,
      '',
      `Tu solicitud para la comunidad "${communityName}" ha sido aprobada.`,
      request.type === 'JOIN'
        ? 'Te damos la bienvenida a la comunidad.'
        : 'Los datos de tu comunidad han sido actualizados.',
      '',
      ...reasonLine,
      'Puedes consultarlo desde SIGECO.'
    ];
  }

  return [
    `Hola ${greeting},`,
    '',
    `Tu solicitud para la comunidad "${communityName}" ha sido rechazada.`,
    '',
    ...reasonLine,
    'Puedes consultar el estado desde SIGECO.'
  ];
}

async function notifyRequestResolution(request, status, resolutionMessage) {
  const targetEmail = request.user?.email;

  if (!targetEmail) {
    return;
  }

  const communityName = request.community?.name || 'tu comunidad';
  const approved = status === 'APPROVED';
  const subject = approved
    ? `SIGECO - Solicitud aprobada en ${communityName}`
    : `SIGECO - Solicitud rechazada en ${communityName}`;
  const body = buildRequestResolutionBody(request, approved, resolutionMessage);

  try {
    await mailService.sendMail({
      to: targetEmail,
      subject,
      text: body.join('\n')
    });
  } catch (error) {
    console.warn('No se ha podido enviar el correo de resolución de solicitud', {
      requestId: request.id,
      communityId: request.communityId,
      status,
      error
    });
  }
}

async function notifyNewRequestToLeaders({ request, details, community, requestComment }, requestsRepository) {
  const leaders = await requestsRepository.findCommunityNotificationLeaders(community.id);
  const recipients = leaders.map((leader) => leader.user?.email).filter(Boolean);

  if (recipients.length === 0) {
    return;
  }

  const requestType = formatRequestType(request.type);
  const address = formatRequestAddress(details);
  const noteLine = requestComment ? [`Nota: "${requestComment}"`, ''] : [];
  const text = [
    'Hola,',
    '',
    `Hay una nueva solicitud de ${requestType} en la comunidad "${community.name}".`,
    '',
    ...noteLine,
    'Datos de la solicitud:',
    `- Alias propuesto: ${details.proposedAlias || '-'}`,
    `- Vivienda: ${address || '-'}`,
    `- Tipo: ${requestType}`,
    '',
    'Puedes revisarla desde el panel de administración de SIGECO.'
  ].join('\n');

  try {
    await mailService.sendMail({
      to: recipients.join(', '),
      subject: `SIGECO - Nueva solicitud en ${community.name}`,
      text
    });
  } catch (error) {
    console.warn('No se ha podido enviar el correo de nueva solicitud', {
      requestId: request.id,
      communityId: community.id,
      error
    });
  }
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

  await notifyNewRequestToLeaders({
    request: result.request,
    details: result.details,
    community: options.community,
    requestComment: input.requestComment
  }, requestsRepository);

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
  const membership = await requestsRepository.findUpdateInfoContext(context.userId, input.communityId);

  if (!membership || !updateInfoHasChanges(input, membership)) {
    throw new ConflictError('Debes modificar al menos un dato para enviar la solicitud.');
  }

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

  await notifyRequestResolution(request, 'APPROVED', input.resolutionMessage);

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

  await notifyRequestResolution(request, 'REJECTED', input.resolutionMessage);

  return { message: 'Solicitud rechazada correctamente.', request: mapManagedRequest(updatedRequest) };
}

module.exports = { createRequest, getMyRequests, getCommunityPendingRequests, cancelRequest, archiveRequest, approveRequest, rejectRequest };
