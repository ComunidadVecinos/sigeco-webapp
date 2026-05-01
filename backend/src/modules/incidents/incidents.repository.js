const prisma = require('../../lib/prisma');

/**
 * Capa de acceso a datos del módulo incidents.
 * Centraliza lecturas, escrituras y agregados con Prisma para que el service trabaje con operaciones pequeñas.
 */

const incidentAuthorSelect = { alias: true };

const incidentSelect = {
  id: true,
  authorMembershipId: true,
  title: true,
  description: true,
  status: true,
  imageStoragePath: true,
  imageMimeType: true,
  imageSizeBytes: true,
  editedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  authorMembership: { select: incidentAuthorSelect }
};

const SUMMARY_FIELD_BY_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
};

function incidentWhere({ communityId, incidentId }) {
  return { id: incidentId, communityId };
}

// Construye el filtro del listado respetando el contrato público del query status.
function listWhere({ communityId, status }) {
  const baseWhere = { communityId, deletedAt: null };

  if (!status || status === 'all') {
    return baseWhere;
  }
  if (status === 'open') {
    return { ...baseWhere, status: { in: ['PENDING', 'IN_PROGRESS'] } };
  }

  return { ...baseWhere, status };
}

async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

async function fetchIncident(db, { communityId, incidentId }) {
  return db.communityIncident.findFirst({
    where: incidentWhere({ communityId, incidentId }),
    select: incidentSelect
  });
}

async function updateActiveIncidentAndFetch(db, { communityId, incidentId, data, extraWhere = {} }) {
  const updated = await db.communityIncident.updateMany({
    where: { ...incidentWhere({ communityId, incidentId }), deletedAt: null, ...extraWhere },
    data: { ...data, updatedAt: new Date() }
  });

  // Se usa updateMany para que si la fila no cumple el where, no se actualice.
  if (updated.count !== 1) {
    return null;
  }

  return fetchIncident(db, { communityId, incidentId });
}

// --- Escrituras ---
async function createIncident(db, input) {
  return db.communityIncident.create({
    data: {
      id: input.id,
      communityId: input.communityId,
      authorMembershipId: input.authorMembershipId,
      title: input.title,
      description: input.description,
      status: input.status || 'PENDING',
      imageStoragePath: input.imageStoragePath || null,
      imageMimeType: input.imageMimeType || null,
      imageSizeBytes: input.imageSizeBytes || null
    },
    select: incidentSelect
  });
}

async function findIncidentNotificationLeaders(communityId) {
  return prisma.membership.findMany({
    where: {
      communityId,
      role: { in: ['PRESIDENT', 'VICE_PRESIDENT'] },
      deletedAt: null,
      endedAt: null,
      OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: new Date() } }]
    },
    select: {
      id: true,
      alias: true,
      role: true,
      user: {
        select: {
          email: true
        }
      },
      community: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });
}

// --- Listados y agregados ---
async function findIncidentPage({ communityId, status, page, pageSize }) {
  const where = listWhere({ communityId, status });
  const skip = (page - 1) * pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.communityIncident.count({ where }),
    prisma.communityIncident.findMany({
      where,
      select: incidentSelect,
      // El listado prioriza la actividad más reciente para que cambios de estado y otras actualizaciones relevantes suban la incidencia.
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: pageSize
    })
  ]);
  return { total, items };
}

async function findIncidentSummaryCounts({ communityId }) {
  const rows = await prisma.communityIncident.groupBy({
    by: ['status'],
    where: { communityId, deletedAt: null },
    _count: { _all: true }
  });

  const summary = { total: 0, pending: 0, inProgress: 0, resolved: 0, cancelled: 0 };

  for (const row of rows) {
    const count = row._count._all || 0;
    const field = SUMMARY_FIELD_BY_STATUS[row.status];
    summary.total += count;
    if (field) {
      summary[field] = count;
    }
  }
  return summary;
}

// --- Lecturas por id ---
async function findIncidentById({ communityId, incidentId }) {
  return fetchIncident(prisma, { communityId, incidentId });
}

// --- Actualizaciones ---
async function updateIncident(db, { communityId, incidentId, data }) {
  return updateActiveIncidentAndFetch(db, { communityId, incidentId, data });
}

async function updateIncidentStatus(db, { communityId, incidentId, currentStatus, nextStatus }) {
  return updateActiveIncidentAndFetch(db, {
    communityId,
    incidentId,
    data: { status: nextStatus },
    extraWhere: { status: currentStatus }
  });
}

async function softDeleteIncident(db, { communityId, incidentId, deletedAt }) {
  const updated = await db.communityIncident.updateMany({
    where: { ...incidentWhere({ communityId, incidentId }), deletedAt: null },
    data: { deletedAt, updatedAt: deletedAt }
  });
  return updated.count === 1;
}

async function removeIncidentImage(db, { communityId, incidentId, editedAt }) {
  return updateActiveIncidentAndFetch(db, {
    communityId,
    incidentId,
    data: {
      imageStoragePath: null,
      imageMimeType: null,
      imageSizeBytes: null,
      editedAt
    }
  });
}

async function anonymizeIncidentsByMembershipIds(db, membershipIds) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }

  // Cuando se eliminan memberships, la incidencia se conserva y solo se desvincula su autoría.
  return db.communityIncident.updateMany({
    where: { authorMembershipId: { in: membershipIds } },
    data: { authorMembershipId: null }
  });
}

module.exports = {
  withTransaction,
  createIncident,
  findIncidentNotificationLeaders,
  findIncidentPage,
  findIncidentSummaryCounts,
  findIncidentById,
  updateIncident,
  updateIncidentStatus,
  softDeleteIncident,
  removeIncidentImage,
  anonymizeIncidentsByMembershipIds
};
