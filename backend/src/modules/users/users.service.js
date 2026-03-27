const crypto = require('crypto');
const { Prisma } = require('@prisma/client');

// Servicio del módulo users.
//   - Orquesta perfil, avatar, contexto activo y borrado de cuenta apoyándose en auth, members y storage.

const passwordService = require('../../lib/password');
const { formatAddress, buildAddressSummary } = require('../../lib/address');
const storageService = require('../../lib/storage/storage');
const { inspectImageBuffer } = require('../../lib/storage/imageMetadata');
const { isMembershipCurrentlySuspended } = require('../../lib/membership');
const { AccountDeletionFailedError, ConflictError, FileTypeUnsupportedError, NotFoundError, ValidationError, errorCodes } = require('../../lib/errors');
const authRepository = require('../auth/auth.repository');
const { resolveUserAccessContext } = require('../auth/auth.context');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

const ACCOUNT_DELETION_CONFIRMATION_TEXT = 'ELIMINAR MI CUENTA';

function selectRepresentativeProperty(membership) {
  if (!membership.property || membership.property.deletedAt) {
    return null;
  }

  return membership.property;
}

function buildCommunityProfile(membership) {
  const property = selectRepresentativeProperty(membership);

  return {
    communityId: membership.community.id,
    name: membership.community.name,
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

// Resumen completo de la información de perfil en un solo endpoint (salvo requests).
async function getMyProfile(userId, usersRepository, options = {}) {
  const user = await usersRepository.findUserProfileById(userId);

  // Fallo en la carga de la información del perfil.
  if (!user) {
    throw new Error('No se ha podido cargar el perfil del usuario autenticado');
  }

  const userAuth = await authRepository.findUserById(userId);

  if (!userAuth) {
    throw new Error('No se ha podido cargar el contexto activo del usuario autenticado');
  }

  const accessContext = await resolveUserAccessContext(userAuth, authRepository, options.activeMembershipId || null);

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

function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function getUniqueConstraintField(error) {
  const target = error?.meta?.target;

  if (Array.isArray(target) && target.length > 0) {
    return target[0];
  }

  if (typeof target === 'string') {
    return target;
  }

  return null;
}

// Para salvaguardar unicidad, se reemplaza el dominio del correo @ucm por @deletec.local.
function buildAccountDeletionEmail(currentEmail) {
  const [localPart = 'deleted'] = String(currentEmail || '').trim().toLowerCase().split('@');
  return `${localPart}@deleted.local`;
}

async function updateMyProfile(userId, input, usersRepository) {
  try {
    await usersRepository.updateUserProfile(userId, input);
  } 
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Traducimos restricciones de unicidad a códigos estables.
      const field = getUniqueConstraintField(error);

      if (field === 'phone') {
        throw new ValidationError(buildValidationDetail('phone', 'Este teléfono ya está registrado'), {
          message: 'Este teléfono ya está registrado',
          code: errorCodes.PHONE_ALREADY_REGISTERED
        });
      }

      throw new ValidationError(buildValidationDetail('email', 'Este correo electrónico ya está registrado'), {
        message: 'Este correo electrónico ya está registrado',
        code: errorCodes.EMAIL_ALREADY_REGISTERED
      });
    }

    throw error;
  }

  return getMyProfile(userId, usersRepository);
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

  // Cambiar el contexto activo depende de seguir perteneciendo a la comunidad (suspensión no debe bloquear esta operación).
  await usersRepository.updateActiveMembershipContext({ userId: context.userId, sessionId: context.sessionId, membershipId: membership.id });

  const user = await authRepository.findUserById(context.userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const accessContext = await resolveUserAccessContext(user, authRepository, membership.id);

  // Mismo solver de auth.
  return {
    activeMembership: mapActiveMembership(accessContext.activeMembership),
    context: { actorType: accessContext.actorType }
  };
}

async function updateMyAvatar(userId, file, usersRepository) {
  if (!file) {
    throw new ValidationError([{ field: 'avatar', location: 'body', message: 'El archivo del avatar es obligatorio' }]);
  }

  // Validación de la firma binaria antes de persistir.
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
    // Primero se almacena el archivo, después se actualiza la BD y se confirma.
    const result = await usersRepository.replaceUserProfileImage(userId, { storagePath: storedFile.storagePath, mimeType: file.mimetype, sizeBytes: file.size });

    if (!result) {
      await storedFile.rollback().catch(() => {});
      throw new NotFoundError('Usuario no encontrado');
    }

    await storedFile.commit().catch((error) => { console.warn('No se ha podido finalizar la limpieza del almacenamiento del avatar', { userId, storagePath: storedFile.storagePath, error }) ;} );

    return { profileImageUrl: storageService.getPublicFileUrl(result.file.storagePath) };
  } 
  catch (error) {
    // Restaurar avatar previo en caso de fallo para evitar inconsistencias entre BD y almacenamiento.
    await storedFile.rollback().catch((rollbackError) => {
      console.warn('No se ha podido restaurar el avatar previo tras un error al actualizar la imagen de perfil', { userId, storagePath: storedFile.storagePath, error: rollbackError });
    });
    throw error;
  }
}

async function deleteMyAccount(context, input, usersRepository) {
  if (input.email !== context.currentEmail) {
    throw new ValidationError(buildValidationDetail('email', 'El correo electrónico debe coincidir con el del usuario autenticado'), {
      message: 'El correo electrónico no coincide para la eliminación de la cuenta',
      code: errorCodes.ACCOUNT_DELETION_EMAIL_MISMATCH
    });
  }

  if (input.confirmationText !== ACCOUNT_DELETION_CONFIRMATION_TEXT) {
    throw new ValidationError(
      buildValidationDetail('confirmationText', 'El texto de confirmación no coincide con el valor esperado'), {
        message: 'El texto de confirmación no coincide',
        code: errorCodes.CONFIRMATION_TEXT_MISMATCH
      });
  }

  const tombstonePasswordHash = await passwordService.hashPassword(crypto.randomUUID());
  let result;

  try {
    result = await usersRepository.deleteUserAccount(context.userId, {
      firstName: 'Usuario',
      lastName: 'Eliminado',
      email: buildAccountDeletionEmail(context.currentEmail),
      phone: null,
      passwordHash: tombstonePasswordHash
    });
  } 
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
      throw new AccountDeletionFailedError(undefined, { cause: error });
    }
    throw new AccountDeletionFailedError(undefined, { cause: error });
  }

  if (!result) {
    throw new ConflictError('No se ha podido eliminar la cuenta debido a un error con el estado actual');
  }

  if (result.profileImageStoragePath) {
    // El fichero físico se limpia fuera de la transacción para no convertir un fallo de filesystem en un rollback completo.
    storageService.deleteStoredFile(result.profileImageStoragePath).catch((error) => {
      console.warn('No se ha podido eliminar la imagen de perfil tras el borrado de la cuenta', {
        userId: context.userId,
        storagePath: result.profileImageStoragePath,
        error
      });
    });
  }

  return {
    message: 'Cuenta eliminada correctamente.',
    futureDataPolicy: { votesCalendarReservations: 'pending_soft_delete_or_disassociation', authorship: 'pending_anonymization' }
  };
}

module.exports = { getMyProfile, updateMyProfile, changeMyActiveCommunity, updateMyAvatar, deleteMyAccount, ACCOUNT_DELETION_CONFIRMATION_TEXT };
