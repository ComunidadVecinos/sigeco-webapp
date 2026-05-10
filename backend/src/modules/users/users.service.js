const crypto = require('crypto');
const { Prisma } = require('@prisma/client');

// Servicio de users: gobierna perfil, avatar, comunidad activa y cierre de cuenta del usuario.
// Flujo cubierto: usuario autenticado -> validaciones/reglas -> repositorio/auth/members/storage/mail.
// Expone casos de uso para perfil propio, comunidad activa, avatar y baja de cuenta.
// Lo consumen los controladores HTTP del módulo.
const passwordService = require('../../lib/password');
const { formatAddress, buildAddressSummary } = require('../../lib/address');
const mailService = require('../../lib/mail');
const storageService = require('../../lib/storage/storage');
const { inspectImageBuffer } = require('../../lib/storage/imageMetadata');
const { isMembershipCurrentlySuspended } = require('../../lib/membership');
const { AccountDeletionFailedError, ConflictError, FileTypeUnsupportedError, NotFoundError, ValidationError, errorCodes } = require('../../lib/errors');
const authRepository = require('../auth/auth.repository');
const { resolveUserAccessContext } = require('../auth/auth.context');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

const ACCOUNT_DELETION_CONFIRMATION_TEXT = 'ELIMINAR MI CUENTA';

// --- Helpers comunes ---
function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function buildValidationError(field, detailMessage, message, code) {
  return new ValidationError(buildValidationDetail(field, detailMessage), { message, code });
}

// Extrae el campo que rompe una restricción única de Prisma para traducirlo a un error HTTP estable.
function getUniqueConstraintField(error) {
  const target = error?.meta?.target;

  if (Array.isArray(target) && target.length > 0) {
    return target[0];
  }
  return typeof target === 'string' ? target : null;
}

// --- Perfil propio: mapeo de salida ---
// La vivienda solo se expone si sigue vigente; si está borrada no debe influir en el perfil.
function getMembershipProperty(membership) {
  if (!membership.property || membership.property.deletedAt) {
    return null;
  }
  return membership.property;
}

// Convierte memberships activas en el formato público del endpoint GET /me.
function buildCommunityProfile(membership) {
  const property = getMembershipProperty(membership);

  return {
    membershipId: membership.id,
    communityId: membership.community.id,
    name: membership.community.name,
    avatarUrl: storageService.getPublicFileUrl(membership.community.avatar?.storagePath || null),
    role: membership.role,
    address: formatAddress(property) || property?.label || null,
    addressDetails: buildAddressSummary(property),
    province: property?.province || null,
    municipality: property?.municipality || null,
    memberSince: membership.joinedAt ? membership.joinedAt.toISOString() : null,
    alias: membership.alias || null,
    suspensionActive: isMembershipCurrentlySuspended(membership),
    suspensionUntil: membership.suspendedUntil ? membership.suspendedUntil.toISOString() : null
  };
}

// Contexto público mínimo que se devuelve al cambiar la comunidad activa.
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

// --- Baja de cuenta: helpers ---
// Comunidades que bloquean la baja de cuenta mientras el usuario siga siendo presidente.
function mapPresidencyBlocker(membership) {
  return {
    id: membership.community.id,
    name: membership.community.name
  };
}

// Para conservar unicidad tras la baja, reemplazamos el dominio original por `@deleted.local`.
function buildAccountDeletionEmail(currentEmail) {
  const [localPart = 'deleted'] = String(currentEmail || '').trim().toLowerCase().split('@');
  return `${localPart}@deleted.local`;
}

// El correo de confirmación es informativo: un fallo aquí no debe revertir el borrado.
async function notifyAccountDeleted({ userId, email }) {
  if (!email) {
    return;
  }

  const text = [
    'Hola,',
    '',
    'Te confirmamos que tu cuenta de SIGECO ha sido eliminada correctamente.',
    'Tus datos han sido borrados y/o anonimizados permanentemente, y a partir de este momento no podrás volver a iniciar sesión.',
    '',
    'Si no has solicitado esta eliminación, ponte en contacto con la administración o el soporte correspondiente lo antes posible.'
  ].join('\n');

  try {
    await mailService.sendMail({ to: email, subject: 'SIGECO - Confirmación de eliminación de cuenta', text });
  }
  catch (error) {
    console.warn('No se ha podido enviar el correo de confirmación de eliminación de cuenta', { userId, error });
  }
}

// --- Perfil propio: GET ---
// Reúne perfil visible y contexto activo en una sola respuesta para el frontend.
async function getMyProfile(userId, usersRepository, options = {}) {
  const user = await usersRepository.findUserProfileById(userId);
  if (!user) {
    throw new Error('No se ha podido cargar el perfil del usuario autenticado');
  }

  const authUser = await authRepository.findUserById(userId);
  if (!authUser) {
    throw new Error('No se ha podido cargar el contexto activo del usuario autenticado');
  }

  const activeMembershipId = options.activeMembershipId || null;
  const accessContext = await resolveUserAccessContext(authUser, authRepository, activeMembershipId);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    profileImageUrl: storageService.getPublicFileUrl(user.avatar?.storagePath || null),
    activeCommunityId: accessContext.activeMembership?.communityId || null,
    communities: user.memberships.map(buildCommunityProfile)
  };
}

// --- Perfil propio: PATCH ---
async function updateMyProfile(userId, input, usersRepository) {
  try {
    await usersRepository.updateUserProfile(userId, input);
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const field = getUniqueConstraintField(error);
      if (field === 'phone') {
        throw buildValidationError('phone', 'Este teléfono ya está registrado', 'Este teléfono ya está registrado', errorCodes.PHONE_ALREADY_REGISTERED);
      }
      throw buildValidationError('email', 'Este correo electrónico ya está registrado', 'Este correo electrónico ya está registrado', errorCodes.EMAIL_ALREADY_REGISTERED);
    }
    throw error;
  }
  return getMyProfile(userId, usersRepository);
}

// --- Contexto del usuario: PUT ---
async function changeMyActiveCommunity(context, input, usersRepository) {
  let membership;

  try {
    const access = await membersService.requireCommunityMembershipAccess(context.userId, input.communityId, membersRepository);
    membership = access.membership;
  }
  catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError('Comunidad no encontrada', { code: errorCodes.ACTIVE_COMMUNITY_NOT_FOUND, cause: error });
    }
    throw error;
  }

  // Aquí solo comprobamos pertenencia: una suspensión no debe impedir elegir el contexto activo.
  await usersRepository.updateActiveMembershipContext({ userId: context.userId, sessionId: context.sessionId, membershipId: membership.id });

  const user = await authRepository.findUserById(context.userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const accessContext = await resolveUserAccessContext(user, authRepository, membership.id);
  return {
    activeMembership: mapActiveMembership(accessContext.activeMembership),
    context: { actorType: accessContext.actorType }
  };
}

// --- Avatar propio: PUT ---
async function updateMyAvatar(userId, file, usersRepository) {
  if (!file) {
    throw new ValidationError([{ field: 'avatar', location: 'body', message: 'El archivo del avatar es obligatorio' }]);
  }

  const image = inspectImageBuffer(file.buffer);
  if (!image.extension) {
    throw new FileTypeUnsupportedError('Solo se admiten imágenes JPG y PNG');
  }

  const avatarContext = await usersRepository.findUserProfileImageContext(userId);
  if (!avatarContext) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const storedFile = await storageService.replaceUserAvatarFile({
    userId,
    previousStoragePath: avatarContext.avatar?.storagePath || null,
    buffer: file.buffer,
    extension: image.extension
  });

  try {
    // Primero guardamos el fichero; solo lo confirmamos cuando la BD también queda actualizada.
    const result = await usersRepository.replaceUserProfileImage(userId, { storagePath: storedFile.storagePath, mimeType: file.mimetype, sizeBytes: file.size });

    if (!result) {
      await storageService.rollbackStoredFileSafely(storedFile, 'No se ha podido restaurar el avatar previo tras no encontrarse el usuario durante la actualización', { userId });
      throw new NotFoundError('Usuario no encontrado');
    }

    await storageService.commitStoredFileSafely(
      storedFile,
      'No se ha podido finalizar la limpieza del almacenamiento del avatar',
      { userId }
    );

    return { profileImageUrl: storageService.getPublicFileUrl(result.file.storagePath) };
  }
  catch (error) {
    // Si algo falla, intentamos restaurar el estado anterior para no descoordinar BD y storage.
    await storageService.rollbackStoredFileSafely(
      storedFile,
      'No se ha podido restaurar el avatar previo tras un error al actualizar la imagen de perfil',
      { userId }
    );
    throw error;
  }
}

// --- Avatar propio: DELETE ---
async function deleteMyAvatar(userId, usersRepository) {
  const avatarContext = await usersRepository.findUserProfileImageContext(userId);

  if (!avatarContext) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (!avatarContext.avatar?.storagePath) {
    throw new ConflictError('El usuario no tiene avatar');
  }

  const result = await usersRepository.deleteUserProfileImage(userId);

  if (!result) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (result.storagePath) {
    // La referencia deja de existir en BD y luego intentamos limpiar el fichero físico.
    await storageService.deleteStoredFileSafely(
      result.storagePath,
      'No se ha podido eliminar el archivo del avatar tras borrar la referencia en la BD',
      { userId }
    );
  }

  return { profileImageUrl: null };
}

// --- Baja de cuenta: DELETE lógico ---
async function deleteMyAccount(context, input, usersRepository) {
  if (input.email !== context.currentEmail) {
    throw buildValidationError(
      'email',
      'El correo electrónico debe coincidir con el del usuario autenticado',
      'El correo electrónico no coincide para la eliminación de la cuenta',
      errorCodes.ACCOUNT_DELETION_EMAIL_MISMATCH
    );
  }

  if (input.confirmationText !== ACCOUNT_DELETION_CONFIRMATION_TEXT) {
    throw buildValidationError(
      'confirmationText',
      'El texto de confirmación no coincide con el valor esperado',
      'El texto de confirmación no coincide',
      errorCodes.CONFIRMATION_TEXT_MISMATCH
    );
  }

  const activePresidencies = await usersRepository.findActivePresidenciesByUserId(context.userId);

  if (activePresidencies.length > 0) {
    throw new ConflictError('No puedes eliminar tu cuenta porque eres presidente de una o más comunidades. Transfiere primero la presidencia y vuelve a intentarlo.', {
      code: errorCodes.ACCOUNT_DELETION_BLOCKED_BY_PRESIDENCY,
      details: {
        communities: activePresidencies.map(mapPresidencyBlocker)
      }
    });
  }

  const tombstonePasswordHash = await passwordService.hashPassword(crypto.randomUUID());
  let result;

  try {
    // Reemplazamos datos sensibles por un "tombstone" antes de marcar la cuenta como eliminada.
    result = await usersRepository.deleteUserAccount(context.userId, {
      firstName: 'Usuario',
      lastName: 'Eliminado',
      email: buildAccountDeletionEmail(context.currentEmail),
      phone: null,
      passwordHash: tombstonePasswordHash
    });
  }
  catch (error) {
    throw new AccountDeletionFailedError(undefined, { cause: error });
  }

  if (!result) {
    throw new ConflictError('No se ha podido eliminar la cuenta debido a un error con el estado actual');
  }

  if (result.profileImageStoragePath) {
    // El fichero se limpia fuera de la transacción para que un fallo de filesystem no rehaga el borrado.
    await storageService.deleteStoredFileSafely(result.profileImageStoragePath, 'No se ha podido eliminar la imagen de perfil tras el borrado de la cuenta', { userId: context.userId });
  }

  await notifyAccountDeleted({ userId: context.userId, email: context.currentEmail });

  return {
    message: 'Cuenta eliminada correctamente.',
    futureDataPolicy: {
      votesCalendarReservations: 'open_votes_removed_closed_votes_preserved_calendar_personal_events_soft_deleted',
      forum: 'posts_soft_deleted_comments_anonymized',
      news: 'preserved_author_anonymized_events_preserved',
      incidents: 'preserved_author_anonymized'
    }
  };
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyActiveCommunity,
  updateMyAvatar,
  deleteMyAvatar,
  deleteMyAccount
};