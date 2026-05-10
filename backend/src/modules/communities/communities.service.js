// Servicio de communities: coordina altas, cambios visibles, avatar y ciclo de vida de la comunidad.
// Flujo cubierto: usuario autenticado -> permisos/contexto -> repositorio/auth/storage/mail.
// Expone casos de uso para resumen, acceso, avatar, borrado y creación de comunidades.
// Lo consumen los controladores HTTP del módulo.
const crypto = require('crypto');
const { Prisma } = require('@prisma/client');

const passwordService = require('../../lib/password');
const { formatAddress, buildAddressSummary } = require('../../lib/address');
const mailService = require('../../lib/mail');
const { ConflictError, ForbiddenError, NotFoundError, ValidationError, errorCodes } = require('../../lib/errors');
const { inspectImageBuffer } = require('../../lib/storage/imageMetadata');
const storageService = require('../../lib/storage/storage');
const authRepository = require('../auth/auth.repository');
const { resolveUserAccessContext } = require('../auth/auth.context');
const membersService = require('../members/members.service');
const membersRepository = require('../members/members.repository');

const ACCESS_CODE_MAX_ATTEMPTS = 5;
const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_ACCESS_CODE_LENGTH = 8;
const COMMUNITY_DELETION_CONFIRMATION_TEXT = 'ELIMINAR COMUNIDAD';

// --- Helpers comunes ---
// El código de acceso evita caracteres ambiguos y debe seguir siendo único en BD.
function generateAccessCode(length = DEFAULT_ACCESS_CODE_LENGTH) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(ACCESS_CODE_ALPHABET.length);
    code += ACCESS_CODE_ALPHABET[randomIndex];
  }
  return code;
}

function getUniqueConstraintField(error) {
  const target = error?.meta?.target;
  if (Array.isArray(target) && target.length > 0) {
    return target.join(',');
  }
  return typeof target === 'string' ? target : null;
}

function constraintMatchesField(constraintTarget, fieldName) {
  if (!constraintTarget) {
    return false;
  }
  return String(constraintTarget).toLowerCase().includes(fieldName.toLowerCase());
}

function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function buildValidationError(field, detailMessage, message, code) {
  return new ValidationError(buildValidationDetail(field, detailMessage), { message, code });
}

function buildCreatorPropertyLabel(alias) {
  return `Vivienda de ${alias}`;
}

function collectUniqueStoragePaths(storagePaths) {
  return [...new Set((storagePaths || []).filter(Boolean))];
}

// --- Comunidad: mapeo de salida ---
function mapLeaderMembership(membership) {
  if (!membership) {
    return null;
  }
  return {
    membershipId: membership.id,
    alias: membership.alias || null,
    role: membership.role
  };
}

function mapCommunity(community) {
  return {
    id: community.id,
    name: community.name,
    cif: community.cif,
    address: buildAddressSummary(community),
    accessCode: community.accessCode,
    createdAt: community.createdAt.toISOString()
  };
}

function mapCommunitySummary(community) {
  return {
    id: community.id,
    name: community.name,
    cif: community.cif,
    address: buildAddressSummary(community),
    avatar: storageService.getPublicFileUrl(community.avatar?.storagePath || null),
    createdAt: community.createdAt.toISOString()
  };
}

function mapActiveMembership(activeMembership) {
  if (!activeMembership) {
    return null;
  }

  return {
    membershipId: activeMembership.id,
    communityId: activeMembership.communityId,
    role: activeMembership.role,
    alias: activeMembership.alias || null
  };
}

function buildCreateCommunityResponse(result) {
  return {
    message: 'Comunidad creada correctamente.',
    community: {
      id: result.community.id,
      name: result.community.name,
      cif: result.community.cif,
      accessCode: result.community.accessCode
    },
    membership: {
      id: result.membership.id,
      role: result.membership.role,
      alias: result.membership.alias,
      joinedAt: result.membership.joinedAt.toISOString()
    },
    creatorProperty: {
      id: result.property.id,
      label: result.property.label,
      address: formatAddress(result.property),
      province: result.property.province,
      municipality: result.property.municipality
    },
    activeMembershipId: result.membership.id
  };
}

// --- Correos del módulo ---
async function sendCommunityDeletionMail({ to, subject, text, context }) {
  if (!to) {
    return;
  }
  try {
    await mailService.sendMail({ to, subject, text });
  }
  catch (error) {
    console.warn('No se ha podido enviar el correo de eliminación de comunidad', { ...context, error });
  }
}

// La notificación es informativa: si falla, no debe impedir completar el borrado lógico.
async function notifyCommunityDeleted({ community, deletedMembers, actorMembership }) {
  const communityName = community?.name || 'la comunidad';

  for (const member of deletedMembers || []) {
    const text = [
      `Hola ${member.alias || 'miembro'},`,
      '',
      `La comunidad "${communityName}" ha sido eliminada en SIGECO.`,
      '',
      'Tu pertenencia a esta comunidad ha finalizado.'
    ].join('\n');

    await sendCommunityDeletionMail({
      to: member.user?.email,
      subject: `SIGECO - Comunidad eliminada: ${communityName}`,
      text,
      context: { communityId: community?.id, membershipId: member.id }
    });
  }

  const confirmationText = [
    `Hola ${actorMembership.alias || 'administrador'},`,
    '',
    `La comunidad "${communityName}" se ha eliminado correctamente.`,
    '',
    'La operación ya está reflejada en SIGECO.'
  ].join('\n');

  await sendCommunityDeletionMail({
    to: actorMembership.user?.email,
    subject: `SIGECO - Eliminación completada: ${communityName}`,
    text: confirmationText,
    context: { communityId: community?.id, membershipId: actorMembership.id }
  });
}

// --- Comunidades: GET ---
// Resumen orientado a administración: datos institucionales, liderazgo y número de vecinos.
async function getCommunitySummary(context, communityId, communitiesRepository) {
  const { community } = await membersService.requireAdministrativeCommunityAccess(context.userId, communityId, membersRepository);

  const [leaders, neighbors] = await Promise.all([
    communitiesRepository.findCommunityLeaders(communityId),
    membersService.listCommunityMembers(
      { communityId, page: 1, pageSize: 1 },
      membersRepository,
      { take: 1, includePagination: false }
    )
  ]);

  const president = leaders.find((membership) => membership.role === 'PRESIDENT') || null;
  const vicePresident = leaders.find((membership) => membership.role === 'VICE_PRESIDENT') || null;

  return {
    community: {
      ...mapCommunitySummary(community),
      accessCode: community.accessCode,
      president: mapLeaderMembership(president),
      vicePresident: mapLeaderMembership(vicePresident),
      neighborsCount: neighbors.total
    }
  };
}

// --- Comunidades: POST de acción administrativa ---
async function regenerateCommunityAccessCode(context, communityId, communitiesRepository) {
  await membersService.requireAdministrativeCommunityAccess(context.userId, communityId, membersRepository);

  // La colisión es improbable, pero el código debe seguir siendo único aunque varias comunidades se creen a la vez.
  for (let attempt = 0; attempt < ACCESS_CODE_MAX_ATTEMPTS; attempt += 1) {
    const accessCode = generateAccessCode();

    try {
      const community = await communitiesRepository.updateCommunityAccessCode(communityId, accessCode);
      if (!community) {
        throw new NotFoundError('Comunidad no encontrada');
      }
      return { community: { id: community.id, accessCode: community.accessCode } };
    }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const field = getUniqueConstraintField(error);
        if (constraintMatchesField(field, 'accessCode') || constraintMatchesField(field, 'access_code')) {
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error('No se ha podido generar un código de acceso único. Inténtalo de nuevo.');
}

// --- Comunidades: PATCH ---
async function updateCommunity(context, communityId, input, communitiesRepository) {
  await membersService.requireAdministrativeCommunityAccess(context.userId, communityId, membersRepository);

  const community = await communitiesRepository.updateCommunityBasicData(communityId, input);
  if (!community) {
    throw new NotFoundError('Comunidad no encontrada');
  }

  return { community: mapCommunity(community) };
}

// --- Comunidades: PUT/DELETE de avatar ---
async function updateCommunityAvatar(context, communityId, file, communitiesRepository) {
  await membersService.requireAdministrativeCommunityAccess(context.userId, communityId, membersRepository);
  if (!file) {
    throw new ValidationError([{ field: 'avatar', location: 'body', message: 'El archivo del avatar es obligatorio' }]);
  }

  const image = inspectImageBuffer(file.buffer);
  if (!image.extension) {
    throw new ValidationError([{ field: 'avatar', location: 'body', message: 'El archivo del avatar no es válido' }]);
  }

  const avatarContext = await communitiesRepository.findCommunityProfileImageContext(communityId);
  if (!avatarContext) {
    throw new NotFoundError('Comunidad no encontrada');
  }

  const storedFile = await storageService.replaceCommunityAvatarFile({
    communityId,
    previousStoragePath: avatarContext.avatar?.storagePath || null,
    buffer: file.buffer,
    extension: image.extension
  });

  try {
    // Igual que en users, el archivo nuevo solo se confirma cuando la referencia en BD ya quedó alineada.
    const result = await communitiesRepository.replaceCommunityProfileImage(communityId, {
      storagePath: storedFile.storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size
    });

    if (!result) {
      await storageService.rollbackStoredFileSafely(
        storedFile,
        'No se ha podido restaurar el avatar previo tras no encontrarse la comunidad durante la actualización',
        { communityId }
      );
      throw new NotFoundError('Comunidad no encontrada');
    }

    await storageService.commitStoredFileSafely(
      storedFile,
      'No se ha podido finalizar la limpieza del almacenamiento del avatar de la comunidad',
      { communityId }
    );

    return {
      community: {
        id: result.communityId,
        avatarFileId: result.file.id,
        avatarUrl: storageService.getPublicFileUrl(result.file.storagePath)
      }
    };
  }
  catch (error) {
    await storageService.rollbackStoredFileSafely(storedFile, 'No se ha podido restaurar el avatar previo de la comunidad', { communityId });
    throw error;
  }
}

async function deleteCommunityAvatar(context, communityId, communitiesRepository) {
  await membersService.requireAdministrativeCommunityAccess(context.userId, communityId, membersRepository);

  const avatarContext = await communitiesRepository.findCommunityProfileImageContext(communityId);
  if (!avatarContext) {
    throw new NotFoundError('Comunidad no encontrada');
  }
  if (!avatarContext.avatar?.storagePath) {
    throw new ConflictError('La comunidad no tiene avatar');
  }

  const result = await communitiesRepository.deleteCommunityProfileImage(communityId);
  if (!result) {
    throw new NotFoundError('Comunidad no encontrada');
  }

  if (result.storagePath) {
    // Primero se limpia la referencia en BD y después el fichero físico para no dejar URLs colgando.
    await storageService.deleteStoredFileSafely(
      result.storagePath,
      'No se ha podido eliminar el archivo del avatar de la comunidad tras borrar la referencia en la BD',
      { communityId }
    );
  }

  return { community: { id: result.communityId, avatarUrl: null } };
}

// --- Comunidades: DELETE lógico ---
async function deleteCommunity(context, communityId, input, communitiesRepository) {
  const communityStatus = await communitiesRepository.findCommunityStatusById(communityId);

  if (!communityStatus) {
    throw new NotFoundError('Comunidad no encontrada');
  }
  if (communityStatus.deletedAt) {
    throw new ConflictError('La comunidad ya está eliminada');
  }

  const { membership: actorMembership } = await membersService.requireAdministrativeCommunityAccess(context.userId, communityId, membersRepository);

  if (actorMembership.role !== 'PRESIDENT') {
    throw new ForbiddenError('Solo la presidencia de la comunidad puede eliminarla');
  }
  if (input.confirmationText !== COMMUNITY_DELETION_CONFIRMATION_TEXT) {
    throw buildValidationError(
      'confirmationText',
      'El texto de confirmación no coincide con el valor esperado',
      'El texto de confirmación no coincide',
      errorCodes.CONFIRMATION_TEXT_MISMATCH
    );
  }

  const userAuth = await authRepository.findUserAuthById(context.userId);
  if (!userAuth) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const passwordMatches = await passwordService.verifyPassword(input.currentPassword, userAuth.passwordHash);
  if (!passwordMatches) {
    throw buildValidationError(
      'currentPassword',
      'La contraseña actual no es válida',
      'La contraseña actual no es válida',
      errorCodes.CURRENT_PASSWORD_INVALID
    );
  }

  let deletionResult;

  // El borrado también libera accessCode, así que puede necesitar reintentos si coincide con otro valor ya existente.
  for (let attempt = 0; attempt < ACCESS_CODE_MAX_ATTEMPTS; attempt += 1) {
    const nextAccessCode = generateAccessCode();

    try {
      deletionResult = await communitiesRepository.softDeleteCommunityWithActorContext({
        communityId,
        actorUserId: context.userId,
        actorMembershipId: actorMembership.id,
        sessionId: context.sessionId,
        currentSessionActiveMembershipId: context.activeMembershipId || null,
        nextAccessCode
      });
      break;
    }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const field = getUniqueConstraintField(error);
        if (constraintMatchesField(field, 'accessCode') || constraintMatchesField(field, 'access_code')) {
          continue;
        }
      }
      throw error;
    }
  }

  if (!deletionResult) {
    throw new ConflictError('No se ha podido eliminar la comunidad por su estado actual');
  }

  await notifyCommunityDeleted({
    community: deletionResult.community,
    deletedMembers: deletionResult.deletedMembers,
    actorMembership
  });

  const storagePathsToDelete = collectUniqueStoragePaths([
    deletionResult.storedFiles?.communityAvatarStoragePath,
    ...(deletionResult.storedFiles?.newsImageStoragePaths || []),
    ...(deletionResult.storedFiles?.incidentImageStoragePaths || []),
    ...(deletionResult.storedFiles?.documentStoragePaths || [])
  ]);

  if (storagePathsToDelete.length > 0) {
    await Promise.all(storagePathsToDelete.map((storagePath) =>
      storageService.deleteStoredFileSafely(storagePath, 'No se ha podido eliminar un archivo de la comunidad tras su borrado', { communityId })));
  }

  const storedSession = await authRepository.findSessionById(context.sessionId);

  // Tras borrar la comunidad, la sesión puede quedarse sin su membership activa anterior y hay que recalcularla.
  if (!storedSession || !storedSession.user || storedSession.user.deletedAt) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const accessContext = await resolveUserAccessContext(
    storedSession.user,
    authRepository,
    storedSession.activeMembershipId || storedSession.user.lastActiveMembershipId
  );

  return {
    deleted: true,
    communityId,
    activeMembership: mapActiveMembership(accessContext.activeMembership)
  };
}

// --- Comunidades: POST de creación ---
async function createCommunity(context, input, communitiesRepository) {
  const existingCommunity = await communitiesRepository.findCommunityByCif(input.community.cif);

  if (existingCommunity) {
    throw new ConflictError('El CIF ya está siendo utilizado por otra comunidad');
  }

  // La comunidad nace con presidencia, vivienda inicial y cambio de contexto activo en la sesión creadora.
  for (let attempt = 0; attempt < ACCESS_CODE_MAX_ATTEMPTS; attempt += 1) {
    const accessCode = generateAccessCode();

    try {
      const result = await communitiesRepository.createCommunityWithCreatorContext({
        userId: context.userId,
        sessionId: context.sessionId,
        alias: input.alias,
        accessCode,
        community: input.community,
        creatorProperty: {
          ...input.creatorProperty,
          label: buildCreatorPropertyLabel(input.alias)
        }
      });

      if (!result) {
        throw new ConflictError('El contexto autenticado ya no es válido');
      }
      return buildCreateCommunityResponse(result);
    }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const field = getUniqueConstraintField(error);
        if (constraintMatchesField(field, 'accessCode') || constraintMatchesField(field, 'access_code')) {
          continue;
        }
        if (constraintMatchesField(field, 'cif')) {
          throw new ConflictError('El CIF ya está siendo utilizado por otra comunidad');
        }
      }
      throw error;
    }
  }

  throw new ConflictError('No se ha podido generar un código de acceso único. Inténtalo de nuevo.');
}

module.exports = {
  getCommunitySummary,
  regenerateCommunityAccessCode,
  updateCommunity,
  updateCommunityAvatar,
  deleteCommunityAvatar,
  deleteCommunity,
  createCommunity
};