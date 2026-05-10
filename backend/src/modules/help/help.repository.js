// Repositorio de help: guarda y recupera las secciones que forman la ayuda comunitaria.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> secciones listas para mapear o validar.
// Expone lecturas, creación, edición, borrado lógico y reordenación de secciones de ayuda.
// Lo consume help.service.js.
const prisma = require('../../lib/prisma');

const DEFAULT_HELP_SECTIONS_LIMIT = 8;

// --- Selects compartidos ---
const communityHelpSectionSelect = {
  id: true,
  title: true,
  description: true,
  sortOrder: true
};

// --- Helpers comunes ---
function buildActiveSectionsWhere(communityId) {
  return { communityId, deletedAt: null };
}

function buildSectionsOrderBy() {
  return [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }];
}

async function findAllActiveCommunityHelpSections(db, communityId) {
  return db.communityHelpSection.findMany({
    where: buildActiveSectionsWhere(communityId),
    select: communityHelpSectionSelect,
    orderBy: buildSectionsOrderBy()
  });
}

// Tras un borrado reajustamos el orden para no dejar huecos visibles en la UI.
async function applySequentialSortOrder(db, communityId, sections) {
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const nextSortOrder = index + 1;
    if (section.sortOrder === nextSortOrder) {
      continue;
    }

    const updated = await db.communityHelpSection.updateMany({
      where: { id: section.id, communityId, deletedAt: null },
      data: { sortOrder: nextSortOrder }
    });
    if (updated.count !== 1) {
      return false;
    }
  }
  return true;
}

// --- Ayuda comunitaria: GET ---
async function findCommunityHelpSections(communityId, limit = DEFAULT_HELP_SECTIONS_LIMIT) {
  return prisma.communityHelpSection.findMany({
    where: buildActiveSectionsWhere(communityId),
    select: communityHelpSectionSelect,
    orderBy: buildSectionsOrderBy(),
    take: limit
  });
}

// --- Ayuda comunitaria: POST ---
async function createCommunityHelpSection(communityId, data, limit = DEFAULT_HELP_SECTIONS_LIMIT) {
  return prisma.$transaction(async (db) => {
    const sections = await findAllActiveCommunityHelpSections(db, communityId);
    if (sections.length >= limit) {
      return { status: 'limit_reached' };
    }

    const lastSection = sections[sections.length - 1] || null;
    const createdSection = await db.communityHelpSection.create({
      data: {
        communityId,
        title: data.title,
        description: data.description,
        sortOrder: lastSection ? lastSection.sortOrder + 1 : 1
      },
      select: communityHelpSectionSelect
    });

    const updatedSections = await findAllActiveCommunityHelpSections(db, communityId);
    return { status: 'created', section: createdSection, sections: updatedSections };
  });
}

// --- Ayuda comunitaria: PATCH ---
async function updateCommunityHelpSection(communityId, sectionId, data) {
  return prisma.$transaction(async (db) => {
    const updated = await db.communityHelpSection.updateMany({
      where: { id: sectionId, communityId, deletedAt: null },
      data
    });
    if (updated.count !== 1) {
      return null;
    }

    const [section, sections] = await Promise.all([
      db.communityHelpSection.findFirst({
        where: { id: sectionId, communityId, deletedAt: null },
        select: communityHelpSectionSelect
      }),
      findAllActiveCommunityHelpSections(db, communityId)
    ]);
    if (!section) {
      return null;
    }

    return { section, sections };
  });
}

// --- Ayuda comunitaria: DELETE lógico ---
async function softDeleteCommunityHelpSection(communityId, sectionId) {
  return prisma.$transaction(async (db) => {
    const updated = await db.communityHelpSection.updateMany({
      where: { id: sectionId, communityId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (updated.count !== 1) {
      return { status: 'not_found' };
    }

    const remainingSections = await findAllActiveCommunityHelpSections(db, communityId);
    const reordered = await applySequentialSortOrder(db, communityId, remainingSections);
    if (!reordered) {
      return { status: 'conflict' };
    }

    const sections = await findAllActiveCommunityHelpSections(db, communityId);
    return { status: 'deleted', sections };
  });
}

// --- Ayuda comunitaria: PUT de reordenación ---
async function reorderCommunityHelpSections(communityId, sectionIds) {
  return prisma.$transaction(async (db) => {
    const sections = await findAllActiveCommunityHelpSections(db, communityId);
    const activeSectionIds = new Set(sections.map((section) => section.id));
    if (sectionIds.some((sectionId) => !activeSectionIds.has(sectionId))) {
      return { status: 'not_found' };
    }
    if (sections.length !== sectionIds.length) {
      return { status: 'conflict' };
    }

    // Exigimos el conjunto completo para evitar reordenaciones parciales o desfasadas.
    for (let index = 0; index < sectionIds.length; index += 1) {
      const updated = await db.communityHelpSection.updateMany({
        where: { id: sectionIds[index], communityId, deletedAt: null },
        data: { sortOrder: index + 1 }
      });
      if (updated.count !== 1) {
        return { status: 'conflict' };
      }
    }

    const updatedSections = await findAllActiveCommunityHelpSections(db, communityId);
    return { status: 'reordered', sections: updatedSections };
  });
}

module.exports = {
  findCommunityHelpSections,
  createCommunityHelpSection,
  updateCommunityHelpSection,
  softDeleteCommunityHelpSection,
  reorderCommunityHelpSections
};