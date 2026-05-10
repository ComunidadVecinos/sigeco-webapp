// Servicio de help: gobierna qué ayuda se ve y cómo se administra dentro de cada comunidad.
// Flujo cubierto: usuario autenticado -> permisos de members -> repositorio -> respuesta pública.
// Expone casos de uso para leer, crear, editar, borrar y reordenar secciones de ayuda.
// Lo consumen los controladores HTTP del módulo.
const { ConflictError, NotFoundError } = require('../../lib/errors');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

const COMMUNITY_HELP_SECTIONS_LIMIT = 8;

const GENERAL_HELP = [
  {
    key: 'getting-started',
    title: 'Primeros pasos en SIGECO',
    description: 'Desde SIGECO puedes registrarte, iniciar sesión y acceder a tu perfil. Si aún no perteneces a ninguna comunidad, podrás crear una nueva comunidad o solicitar unirte a una existente mediante un código de acceso facilitado por su administración.'
  },
  {
    key: 'active-community',
    title: 'Cambio de comunidad activa',
    description: 'Si perteneces a varias comunidades, utiliza el selector de comunidad de la cabecera para cambiar el contexto de trabajo. Al cambiar de comunidad, la plataforma mostrará la información, permisos y módulos correspondientes a la comunidad seleccionada.'
  },
  {
    key: 'app-navigation',
    title: 'Navegación por la aplicación',
    description: 'El menú Comunidad da acceso a los módulos principales: tablón de noticias, foro, reserva de espacios, incidencias, votaciones y documentos. La cabecera permite acceder también al calendario, perfil, ayuda y, si tienes permisos, al área de administración.'
  },
  {
    key: 'profile-and-requests',
    title: 'Perfil, datos personales y solicitudes',
    description: 'En Mi perfil puedes consultar y actualizar tus datos personales, cambiar la contraseña, gestionar tu foto, revisar las comunidades a las que perteneces y consultar el estado de tus solicitudes de acceso o modificación de datos.'
  },
  {
    key: 'roles-and-permissions',
    title: 'Roles y permisos de usuario',
    description: 'SIGECO distingue entre miembros y perfiles administrativos. Los usuarios con rol de presidente o vicepresidente pueden acceder al panel de administración, revisar solicitudes, gestionar miembros, actualizar datos de la comunidad, administrar documentos, configurar espacios reservables y mantener contenidos de ayuda comunitaria.'
  },
  {
    key: 'community-services',
    title: 'Servicios comunitarios disponibles',
    description: 'Cada comunidad puede utilizar módulos funcionales para publicar noticias, organizar conversaciones en el foro, gestionar reservas de espacios comunes, registrar incidencias, convocar votaciones, compartir documentos PDF y consultar eventos en el calendario.'
  },
  {
    key: 'email-and-password-recovery',
    title: 'Correo y recuperación de contraseña',
    description: 'En el entorno local de demostración, los correos enviados por SIGECO, como los de recuperación de contraseña o notificaciones, se consultan en MailPit: http://localhost/mail. La aplicación principal está disponible en http://localhost.'
  }
];

// --- Ayuda comunitaria: mapeo de salida ---
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
  return {
    generalHelp: GENERAL_HELP,
    communityHelpSections
  };
}

// --- Helpers de acceso ---
// Help reutiliza el modelo de permisos de members para no duplicar reglas.
async function requireCommunityAdministrativeAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function getOrderedCommunityHelpSections(communityId, helpRepository) {
  const sections = await helpRepository.findCommunityHelpSections(communityId, COMMUNITY_HELP_SECTIONS_LIMIT);
  return mapCommunityHelpSections(sections);
}

// --- Ayuda pública y comunitaria: GET ---
async function getHelpSections(context, communityId, helpRepository) {
  // Punto de lectura único:
  // - sin communityId expone solo la ayuda global del producto
  // - con communityId mezcla ayuda global y comunitaria tras verificar acceso
  if (!communityId) {
    return buildHelpSectionsResponse();
  }
  await membersService.requireCommunityMembershipAccess(context.userId, communityId, membersRepository);
  return buildHelpSectionsResponse(await getOrderedCommunityHelpSections(communityId, helpRepository));
}

// --- Ayuda comunitaria: POST ---
async function createHelpSection(context, communityId, input, helpRepository) {
  await requireCommunityAdministrativeAccess(context.userId, communityId);
  const result = await helpRepository.createCommunityHelpSection(communityId, input, COMMUNITY_HELP_SECTIONS_LIMIT);
  if (result?.status === 'limit_reached') {
    throw new ConflictError('La comunidad ya tiene el número máximo de secciones de ayuda activas');
  }
  if (!result || result.status !== 'created') {
    throw new ConflictError('No se ha podido crear la sección de ayuda');
  }
  return {
    created: true,
    section: mapCommunityHelpSection(result.section),
    sections: mapCommunityHelpSections(result.sections)
  };
}

// --- Ayuda comunitaria: PATCH ---
async function updateHelpSection(context, communityId, sectionId, input, helpRepository) {
  await requireCommunityAdministrativeAccess(context.userId, communityId);
  const result = await helpRepository.updateCommunityHelpSection(communityId, sectionId, input);
  if (!result) {
    throw new NotFoundError('Sección de ayuda no encontrada');
  }
  return {
    updated: true,
    section: mapCommunityHelpSection(result.section),
    sections: mapCommunityHelpSections(result.sections)
  };
}

// --- Ayuda comunitaria: DELETE lógico ---
async function deleteHelpSection(context, communityId, sectionId, helpRepository) {
  // Tras borrar se devuelve la colección ya reordenada.
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

  return {
    deleted: true,
    sectionId,
    sections: mapCommunityHelpSections(result.sections)
  };
}

// --- Ayuda comunitaria: PUT de reordenación ---
async function reorderHelpSections(context, communityId, input, helpRepository) {
  // El reorder exige que la lista enviada coincida exactamente con las secciones activas actuales.
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

  return {
    reordered: true,
    sections: mapCommunityHelpSections(result.sections)
  };
}

module.exports = { getHelpSections, createHelpSection, updateHelpSection, deleteHelpSection, reorderHelpSections };