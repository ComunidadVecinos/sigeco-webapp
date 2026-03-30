// Acceso a datos del módulo help.

const prisma = require('../../lib/prisma');

const DEFAULT_HELP_SECTIONS_LIMIT = 8;
const communityHelpSectionSelect = { id: true, title: true, description: true, sortOrder: true };

function buildActiveSectionsWhere(communityId) {
  return { communityId, deletedAt: null };
}

function buildSectionsOrderBy() {
  return [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }];
}

async function findCommunityHelpSections(communityId, limit = DEFAULT_HELP_SECTIONS_LIMIT) {
  return prisma.communityHelpSection.findMany({
    where: buildActiveSectionsWhere(communityId),
    select: communityHelpSectionSelect,
    orderBy: buildSectionsOrderBy(),
    take: limit
  });
}

async function findAllActiveCommunityHelpSections(tx, communityId) {
  return tx.communityHelpSection.findMany({
    where: buildActiveSectionsWhere(communityId),
    select: communityHelpSectionSelect,
    orderBy: buildSectionsOrderBy()
  });
}

async function applySequentialSortOrder(tx, communityId, sections) {
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const nextSortOrder = index + 1;

    if (section.sortOrder === nextSortOrder) {
      continue;
    }

    const updateResult = await tx.communityHelpSection.updateMany({
      where: {
        id: section.id,
        communityId,
        deletedAt: null
      },
      data: { sortOrder: nextSortOrder }
    });

    if (updateResult.count !== 1) {
      return false;
    }
  }

  return true;
}

async function createCommunityHelpSection(communityId, data, limit = DEFAULT_HELP_SECTIONS_LIMIT) {
  return prisma.$transaction(async (tx) => {
    const sections = await findAllActiveCommunityHelpSections(tx, communityId);

    if (sections.length >= limit) {
      return { status: 'limit_reached' };
    }

    const lastSection = sections[sections.length - 1] || null;
    const createdSection = await tx.communityHelpSection.create({
      data: {
        communityId,
        title: data.title,
        description: data.description,
        sortOrder: lastSection ? lastSection.sortOrder + 1 : 1
      },
      select: communityHelpSectionSelect
    });

    const updatedSections = await findAllActiveCommunityHelpSections(tx, communityId);

    return { status: 'created', section: createdSection, sections: updatedSections };
  });
}

async function updateCommunityHelpSection(communityId, sectionId, data) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.communityHelpSection.updateMany({
      where: { id: sectionId, communityId, deletedAt: null },
      data
    });

    if (updateResult.count !== 1) {
      return null;
    }

    const [section, sections] = await Promise.all([
      tx.communityHelpSection.findFirst({
        where: { id: sectionId, communityId, deletedAt: null },
        select: communityHelpSectionSelect
      }),
      findAllActiveCommunityHelpSections(tx, communityId)
    ]);

    if (!section) {
      return null;
    }

    return { section, sections };
  });
}

async function softDeleteCommunityHelpSection(communityId, sectionId) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.communityHelpSection.updateMany({
      where: { id: sectionId, communityId, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (updateResult.count !== 1) {
      return { status: 'not_found' };
    }

    // Tras un borrado dejamos el orden sin huecos.
    const remainingSections = await findAllActiveCommunityHelpSections(tx, communityId);
    const reordered = await applySequentialSortOrder(tx, communityId, remainingSections);

    if (!reordered) {
      return { status: 'conflict' };
    }

    const sections = await findAllActiveCommunityHelpSections(tx, communityId);

    return { status: 'deleted', sections };
  });
}

async function reorderCommunityHelpSections(communityId, sectionIds) {
  return prisma.$transaction(async (tx) => {
    const sections = await findAllActiveCommunityHelpSections(tx, communityId);
    const activeSectionIds = new Set(sections.map((section) => section.id));

    if (sectionIds.some((sectionId) => !activeSectionIds.has(sectionId))) {
      return { status: 'not_found' };
    }

    if (sections.length !== sectionIds.length) {
      return { status: 'conflict' };
    }

    // Exigimos el conjunto completo para evitar reorder parciales.
    for (let index = 0; index < sectionIds.length; index += 1) {
      const updateResult = await tx.communityHelpSection.updateMany({
        where: { id: sectionIds[index], communityId, deletedAt: null },
        data: { sortOrder: index + 1 }
      });

      if (updateResult.count !== 1) {
        return { status: 'conflict' };
      }
    }

    const updatedSections = await findAllActiveCommunityHelpSections(tx, communityId);

    return { status: 'reordered', sections: updatedSections };
  });
}

module.exports = { findCommunityHelpSections, createCommunityHelpSection, updateCommunityHelpSection, softDeleteCommunityHelpSection, reorderCommunityHelpSections };