const crypto = require('crypto');

const { ConflictError, ForbiddenError, NotFoundError } = require('../../lib/errors');
const mailService = require('../../lib/mail');
const { inspectImageBuffer } = require('../../lib/storage/imageMetadata');
const storageService = require('../../lib/storage/storage');
const { hasAdministrativeRole } = require('../members/members.access');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

/**
 * Servicio del módulo incidents. Orquesta:
 * - permisos operativos y administrativos
 * - reglas de negocio sobre autoría, edición, borrado y cambios de estado
 * - mapeo del modelo interno al contrato HTTP
 * - coordinación entre base de datos y storage para la imagen opcional
 */

const DELETED_INCIDENT_AUTHOR_ALIAS = 'Usuario eliminado';
const INCIDENT_STATUS_TO_PUBLIC = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
};
const INCIDENT_STATUS_FROM_PUBLIC = {
  pending: 'PENDING',
  inProgress: 'IN_PROGRESS',
  resolved: 'RESOLVED',
  cancelled: 'CANCELLED'
};
const INCIDENT_STATUS_TRANSITIONS = {
  PENDING: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: ['IN_PROGRESS'],
  CANCELLED: ['IN_PROGRESS']
};

// --- Helpers de salida y utilidades pequeñas ---
function toPublicIncidentStatus(status) {
  return INCIDENT_STATUS_TO_PUBLIC[status] || status;
}

function pagination(page, pageSize, total) {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) };
}

function incidentView(incident) {
  const authorAlias = incident.authorMembership ? incident.authorMembership.alias || null : DELETED_INCIDENT_AUTHOR_ALIAS;

  return {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    status: toPublicIncidentStatus(incident.status),
    imageUrl: storageService.getPublicFileUrl(incident.imageStoragePath || null),
    author: { alias: authorAlias },
    createdAt: incident.createdAt.toISOString(),
    editedAt: incident.editedAt ? incident.editedAt.toISOString() : null
  };
}

// --- Helpers de imagen ---
function inspectIncidentImageFile(imageFile) {
  if (!imageFile) {
    return null;
  }
  const image = inspectImageBuffer(imageFile.buffer);
  return { extension: image.extension, mimeType: imageFile.mimetype, sizeBytes: imageFile.size };
}

function storedImageFields(storedImage, imageMeta) {
  if (!storedImage || !imageMeta) {
    return {};
  }

  return { imageStoragePath: storedImage.storagePath, imageMimeType: imageMeta.mimeType, imageSizeBytes: imageMeta.sizeBytes };
}

async function storeIncidentImage({ communityId, incidentId, previousStoragePath, imageFile }) {
  const imageMeta = inspectIncidentImageFile(imageFile);

  if (!imageMeta) {
    return { imageMeta: null, storedImage: null };
  }

  const storedImage = await storageService.replaceCommunityIncidentImageFile({
    communityId,
    incidentId,
    previousStoragePath,
    buffer: imageFile.buffer,
    extension: imageMeta.extension
  });

  return { imageMeta, storedImage };
}

async function commitStoredIncidentImage(storedImage, { communityId, incidentId }) {
  await storageService.commitStoredFileSafely(
    storedImage, 'No se han podido limpiar archivos antiguos de la imagen de la incidencia', { communityId, incidentId }
  );
}

async function rollbackStoredIncidentImage(storedImage, { communityId, incidentId, operation }) {
  await storageService.rollbackStoredFileSafely(
    storedImage, `No se ha podido restaurar la imagen previa tras un error en la ${operation}`, { communityId, incidentId }
  );
}

async function deleteStoredIncidentImage(storagePath, { communityId, incidentId, reason }) {
  await storageService.deleteStoredFileSafely(storagePath, reason, { communityId, incidentId });
}

// --- Reglas de acceso reutilizando el módulo members ---
async function requireOperationalAccess(userId, communityId) {
  return membersService.requireOperationalCommunityAccess(userId, communityId, membersRepository);
}

async function requireAdministrativeAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function getIncidentOrFail(communityId, incidentId, incidentsRepository) {
  const incident = await incidentsRepository.findIncidentById({ communityId, incidentId });
  if (!incident) {
    throw new NotFoundError('Incidencia no encontrada');
  }
  return incident;
}

// --- Reglas de negocio ---
function ensureIncidentIsActive(incident, message) {
  if (!incident.deletedAt) {
    return;
  }
  throw new ConflictError(message);
}

function ensureCanEditIncident(actorMembership, incident) {
  if (incident.authorMembershipId !== actorMembership.id) {
    throw new ForbiddenError('No tienes permisos para editar esta incidencia');
  }
  if (incident.status !== 'PENDING') {
    throw new ConflictError('Solo se pueden editar incidencias pendientes');
  }
}

function ensureCanDeleteIncident(actorMembership, incident) {
  if (hasAdministrativeRole(actorMembership)) {
    return;
  }
  if (incident.authorMembershipId === actorMembership.id) {
    if (incident.status !== 'PENDING') {
      throw new ConflictError('Solo puedes eliminar incidencias pendientes');
    }
    return;
  }
  throw new ForbiddenError('No tienes permisos para eliminar esta incidencia');
}

function toInternalIncidentStatus(status) {
  return INCIDENT_STATUS_FROM_PUBLIC[status];
}

function incidentListStatusFilter(status) {
  if (status === 'open' || status === 'all') {
    return status;
  }
  return toInternalIncidentStatus(status);
}

function incidentUpdateData(input, storedImage, imageMeta) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...storedImageFields(storedImage, imageMeta),
    editedAt: new Date()
  };
}

async function runIncidentMutation(incidentsRepository, operation, failureMessage) {
  const incident = await incidentsRepository.withTransaction(operation);
  if (!incident) {
    throw new ConflictError(failureMessage);
  }
  return incident;
}

async function notifyNewIncidentToLeaders({ communityId, incident, authorAlias }, incidentsRepository) {
  try {
    const leaders = await incidentsRepository.findIncidentNotificationLeaders(communityId);
    const recipients = leaders.map((leader) => leader.user?.email).filter(Boolean);

    if (recipients.length === 0) {
      return;
    }

    const communityName = leaders[0]?.community?.name || 'la comunidad';
    const text = [
      'Hola,',
      '',
      `Se ha registrado una nueva incidencia en la comunidad "${communityName}".`,
      '',
      `Título: ${incident.title}`,
      `Abierta por: ${authorAlias || 'Usuario de la comunidad'}`,
      '',
      'Puedes revisarla desde el panel de incidencias de SIGECO.'
    ].join('\n');

    await mailService.sendMail({
      to: recipients.join(', '),
      subject: `SIGECO - Nueva incidencia en ${communityName}`,
      text
    });
  } catch (error) {
    console.warn('No se ha podido enviar el correo de nueva incidencia', {
      incidentId: incident.id,
      communityId,
      error
    });
  }
}

async function createIncident(context, communityId, input, incidentsRepository) {
  const { membership } = await requireOperationalAccess(context.userId, communityId);
  const incidentId = crypto.randomUUID();

  // La imagen se guarda primero en storage con soporte commit/rollback para coordinarla con la transacción de BD.
  const { imageMeta, storedImage } = await storeIncidentImage({
    communityId,
    incidentId,
    previousStoragePath: null,
    imageFile: input.imageFile
  });

  try {
    const createdIncident = await incidentsRepository.withTransaction((tx) =>
      incidentsRepository.createIncident(tx, {
        id: incidentId,
        communityId,
        authorMembershipId: membership.id,
        title: input.title,
        description: input.description,
        status: 'PENDING',
        ...storedImageFields(storedImage, imageMeta)
      })
    );
    await commitStoredIncidentImage(storedImage, { communityId, incidentId });
    await notifyNewIncidentToLeaders({
      communityId,
      incident: createdIncident,
      authorAlias: membership.alias
    }, incidentsRepository);
    return incidentView(createdIncident);
  }
  catch (error) {
    await rollbackStoredIncidentImage(storedImage, {
      communityId,
      incidentId,
      operation: 'creacion'
    });
    throw error;
  }
}

async function getIncidentList(context, communityId, input, incidentsRepository) {
  await requireOperationalAccess(context.userId, communityId);

  // Se resuelven en paralelo la página y el resumen por estado.
  const [pageResult, summary] = await Promise.all([
    incidentsRepository.findIncidentPage({
      communityId,
      status: incidentListStatusFilter(input.status),
      page: input.page,
      pageSize: input.pageSize
    }),
    incidentsRepository.findIncidentSummaryCounts({ communityId })
  ]);

  return {
    items: pageResult.items.map(incidentView),
    pagination: pagination(input.page, input.pageSize, pageResult.total),
    summary
  };
}

async function getIncidentDetail(context, communityId, incidentId, incidentsRepository) {
  await requireOperationalAccess(context.userId, communityId);
  const incident = await getIncidentOrFail(communityId, incidentId, incidentsRepository);
  if (incident.deletedAt) {
    throw new NotFoundError('Incidencia no encontrada');
  }
  return incidentView(incident);
}

async function updateIncident(context, communityId, incidentId, input, incidentsRepository) {
  const { membership } = await requireOperationalAccess(context.userId, communityId);
  const existingIncident = await getIncidentOrFail(communityId, incidentId, incidentsRepository);

  ensureIncidentIsActive(existingIncident, 'La incidencia ya no esta disponible');
  ensureCanEditIncident(membership, existingIncident);

  const { imageMeta, storedImage } = await storeIncidentImage({
    communityId,
    incidentId,
    previousStoragePath: existingIncident.imageStoragePath || null,
    imageFile: input.imageFile
  });

  try {
    const updatedIncident = await runIncidentMutation(
      incidentsRepository,
      (tx) =>
        incidentsRepository.updateIncident(tx, {
          communityId,
          incidentId,
          data: incidentUpdateData(input, storedImage, imageMeta)
        }),
      'No se ha podido actualizar la incidencia'
    );
    await commitStoredIncidentImage(storedImage, { communityId, incidentId });
    return incidentView(updatedIncident);
  }
  catch (error) {
    await rollbackStoredIncidentImage(storedImage, { communityId, incidentId, operation: 'actualizacion' });
    throw error;
  }
}

async function deleteIncidentImage(context, communityId, incidentId, incidentsRepository) {
  const { membership } = await requireOperationalAccess(context.userId, communityId);
  const existingIncident = await getIncidentOrFail(communityId, incidentId, incidentsRepository);

  ensureIncidentIsActive(existingIncident, 'La incidencia ya no esta disponible');
  ensureCanEditIncident(membership, existingIncident);

  if (!existingIncident.imageStoragePath) {
    throw new ConflictError('La incidencia no tiene imagen');
  }

  const updatedIncident = await runIncidentMutation(
    incidentsRepository,
    (tx) =>
      incidentsRepository.removeIncidentImage(tx, { communityId, incidentId, editedAt: new Date() }),
    'No se ha podido eliminar la imagen de la incidencia'
  );

  await deleteStoredIncidentImage(existingIncident.imageStoragePath, {
    communityId,
    incidentId,
    reason: 'No se ha podido eliminar la imagen tras borrar la referencia en la incidencia'
  });

  return incidentView(updatedIncident);
}

async function deleteIncident(context, communityId, incidentId, incidentsRepository) {
  const { membership } = await requireOperationalAccess(context.userId, communityId);
  const existingIncident = await getIncidentOrFail(communityId, incidentId, incidentsRepository);

  ensureIncidentIsActive(existingIncident, 'La incidencia ya está eliminada');
  ensureCanDeleteIncident(membership, existingIncident);

  const deletedAt = new Date();

  // El borrado en BD es lógico; el archivo se limpia despues para no mezclar filesystem con la transacción.
  const deleted = await incidentsRepository.withTransaction((tx) =>
    incidentsRepository.softDeleteIncident(tx, { communityId, incidentId, deletedAt })
  );

  if (!deleted) {
    throw new ConflictError('No se ha podido eliminar la incidencia');
  }

  await deleteStoredIncidentImage(existingIncident.imageStoragePath, {
    communityId,
    incidentId,
    reason: 'No se ha podido eliminar la imagen de la incidencia'
  });

  return { deleted: true, incidentId };
}

async function updateIncidentStatus(context, communityId, incidentId, input, incidentsRepository) {
  await requireAdministrativeAccess(context.userId, communityId);

  const existingIncident = await getIncidentOrFail(communityId, incidentId, incidentsRepository);

  ensureIncidentIsActive(existingIncident, 'La incidencia ya no esta disponible');

  const nextStatus = toInternalIncidentStatus(input.status);

  if (existingIncident.status === nextStatus) {
    throw new ConflictError('La incidencia ya esta en ese estado');
  }

  if (!INCIDENT_STATUS_TRANSITIONS[existingIncident.status]?.includes(nextStatus)) {
    throw new ConflictError('La transicion de estado no es valida');
  }

  const updatedIncident = await runIncidentMutation(
    incidentsRepository,
    (tx) =>
      incidentsRepository.updateIncidentStatus(tx, { communityId, incidentId, currentStatus: existingIncident.status, nextStatus }),
    'No se ha podido actualizar el estado de la incidencia'
  );

  return incidentView(updatedIncident);
}

module.exports = {
  createIncident,
  getIncidentList,
  getIncidentDetail,
  updateIncident,
  deleteIncidentImage,
  deleteIncident,
  updateIncidentStatus
};
