const { ConflictError, NotFoundError } = require('../../lib/errors');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

// Servicio del módulo help.
//   - Combina ayuda general fija con ayuda comunitaria y delega permisos en members.

const COMMUNITY_HELP_SECTIONS_LIMIT = 8;

const GENERAL_HELP = [
  {
    key: 'platform-overview',
    title: 'Cómo usar SIGECO',
    description: 'Desde tu sesión puedes consultar tu perfil, ver las comunidades a las que perteneces y trabajar siempre sobre tu comunidad activa. Si cambias de comunidad, la plataforma adaptará la información y las opciones disponibles a ese contexto.'
  },
  {
    key: 'community-participation',
    title: 'Participación en la comunidad',
    description: 'Dentro de cada comunidad puedes revisar la información publicada por su administración, consultar a sus miembros y gestionar tus solicitudes relacionadas con el acceso o la actualización de datos. Algunas acciones pueden variar según tu rol dentro de la comunidad.'
  },
  {
    key: 'support-contact',
    title: 'Soporte y seguimiento',
    description: 'Si no encuentras aquí la respuesta que necesitas, revisa primero las secciones de ayuda específicas de tu comunidad. Para incidencias sobre normas internas, miembros o contenido, contacta con la administración de la comunidad; para problemas de acceso o uso general de la plataforma, solicita soporte desde los canales habilitados.'
  }
];

function mapCommunityHelpSection(section) {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    sortOrder: section.sortOrder
  };
}

function mapCommunityHelpSections(sections) {
  return sections.map(mapCommunityHelpSection);
}

function buildHelpSectionsResponse(communityHelpSections = []) {
  return { generalHelp: GENERAL_HELP, communityHelpSections };
}

async function requireCommunityAdministrativeAccess(userId, communityId) {
  // Help reutiliza el modelo de permisos de members para no duplicar reglas
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function getOrderedCommunityHelpSections(communityId, helpRepository) {
  const sections = await helpRepository.findCommunityHelpSections(communityId, COMMUNITY_HELP_SECTIONS_LIMIT);
  return mapCommunityHelpSections(sections);
}

async function getHelpSections(context, communityId, helpRepository) {
  // Punto de lectura único:
  // - sin communityId expone solo la ayuda global del producto
  // - con communityId mezcla ayuda global y comunitaria tras verificar acceso
  if (!communityId) {
    return buildHelpSectionsResponse();
  }

  // La lectura comunitaria depende de pertenencia.
  await membersService.requireCommunityMembershipAccess(context.userId, communityId, membersRepository);
  return buildHelpSectionsResponse(await getOrderedCommunityHelpSections(communityId, helpRepository));
}

async function createHelpSection(context, communityId, input, helpRepository) {
  // Las escrituras quedan reservadas a perfiles administrativos.
  await requireCommunityAdministrativeAccess(context.userId, communityId);

  const result = await helpRepository.createCommunityHelpSection(communityId, input, COMMUNITY_HELP_SECTIONS_LIMIT);

  if (result?.status === 'limit_reached') {
    throw new ConflictError('La comunidad ya tiene el número máximo de secciones de ayuda activas');
  }

  if (!result || result.status !== 'created') {
    throw new ConflictError('No se ha podido crear la sección de ayuda');
  }

  return { created: true, section: mapCommunityHelpSection(result.section), sections: mapCommunityHelpSections(result.sections) };
}

async function updateHelpSection(context, communityId, sectionId, input, helpRepository) {
  await requireCommunityAdministrativeAccess(context.userId, communityId);
  const result = await helpRepository.updateCommunityHelpSection(communityId, sectionId, input);
  if (!result) {
    throw new NotFoundError('Sección de ayuda no encontrada');
  }
  return { updated: true, section: mapCommunityHelpSection(result.section), sections: mapCommunityHelpSections(result.sections) };
}

async function deleteHelpSection(context, communityId, sectionId, helpRepository) {
  // Tras borrar se devuelve la colección reordenada.
  await requireCommunityAdministrativeAccess(context.userId, communityId);

  const result = await helpRepository.softDeleteCommunityHelpSection(communityId, sectionId);

  if (result?.status === 'not_found') {
    throw new NotFoundError('Sección de ayuda no encontrada');
  }

  if (result?.status === 'conflict') {
    throw new ConflictError('No se ha podido eliminar la sección de ayuda');
  }

  if (!result || result.status !== 'deleted') {
    throw new ConflictError('No se ha podido eliminar la sección de ayuda');
  }

  return { deleted: true, sectionId, sections: mapCommunityHelpSections(result.sections) };
}

async function reorderHelpSections(context, communityId, input, helpRepository) {
  // El reorder falla en conflicto cuando el conjunto enviado no coincide exactamente con las secciones activas actuales.
  await requireCommunityAdministrativeAccess(context.userId, communityId);

  const result = await helpRepository.reorderCommunityHelpSections(communityId, input.sectionIds);

  if (result?.status === 'not_found') {
    throw new NotFoundError('Sección de ayuda no encontrada');
  }
  if (result?.status === 'conflict') {
    throw new ConflictError('El orden de secciones de ayuda indicado no coincide con el estado actual de la comunidad');
  }
  if (!result || result.status !== 'reordered') {
    throw new ConflictError('El orden de secciones de ayuda indicado no coincide con el estado actual de la comunidad');
  }

  return { reordered: true, sections: mapCommunityHelpSections(result.sections) };
}

module.exports = { getHelpSections, createHelpSection, updateHelpSection, deleteHelpSection, reorderHelpSections };