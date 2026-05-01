const {
  ConflictError,
  ForbiddenError,
  NotFoundError
} = require('../../lib/errors');

// Servicio del módulo members.
//   - Orquesta permisos sobre comunidad, cambios de estado de membership y resincronización con el contexto de auth.

const { isMembershipCurrentlySuspended } = require('../../lib/membership');
const { buildAddressSummary } = require('../../lib/address');
const mailService = require('../../lib/mail');
const storageService = require('../../lib/storage/storage');
const { hasCommunityMembershipAccess, hasAdministrativeMembershipAccess, isMembershipOperational } = require('./members.access');
const authRepository = require('../auth/auth.repository');
const { resolveUserAccessContext } = require('../auth/auth.context');

function buildPropertySummary(property) {
  if (!property || property.deletedAt) {
    return null;
  }

  return { label: property.label || null, ...buildAddressSummary(property) };
}

function resolveSuspensionStatus(membership) {
  if (!membership || isMembershipCurrentlySuspended(membership)) {
    return 'INACTIVE';
  }

  return 'ACTIVE';
}

function mapCommunityMember(membership) {
  return {
    membershipId: membership.id,
    alias: membership.alias || null,
    profileImageUrl: storageService.getPublicFileUrl(membership.user?.avatar?.storagePath || null),
    role: membership.role,
    createdAt: membership.createdAt.toISOString(),
    suspensionStatus: resolveSuspensionStatus(membership),
    suspendedAt: membership.suspendedAt ? membership.suspendedAt.toISOString() : null,
    suspendedUntil: membership.suspendedUntil ? membership.suspendedUntil.toISOString() : null,
    suspensionReason: membership.suspensionReason || null,
    property: buildPropertySummary(membership.property)
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

function mapSuspendedMember(membership) {
  return {
    membershipId: membership.id,
    communityId: membership.communityId,
    alias: membership.alias || null,
    role: membership.role,
    suspendedAt: membership.suspendedAt ? membership.suspendedAt.toISOString() : null,
    suspendedUntil: membership.suspendedUntil ? membership.suspendedUntil.toISOString() : null,
    suspensionStatus: resolveSuspensionStatus(membership),
    suspensionReason: membership.suspensionReason || null
  };
}

function mapRoleMember(membership) {
  if (!membership) {
    return null;
  }

  return {
    membershipId: membership.id,
    communityId: membership.communityId,
    alias: membership.alias || null,
    role: membership.role
  };
}

function formatRoleLabel(role) {
  if (role === 'PRESIDENT') {
    return 'presidente';
  }

  if (role === 'VICE_PRESIDENT') {
    return 'vicepresidente';
  }

  return 'miembro';
}

function buildRoleActorLabel(actorMembership) {
  if (!actorMembership.alias) {
    return 'La administración';
  }

  const roleLabel = actorMembership.role === 'PRESIDENT' ? 'presidente' : 'vicepresidente';
  return `El ${roleLabel} ${actorMembership.alias}`;
}

async function notifyRoleChange({ actorMembership, targetMembership }) {
  const targetEmail = targetMembership.user?.email;

  if (!targetEmail) {
    return;
  }

  const communityName = targetMembership.community?.name || actorMembership.community?.name || 'tu comunidad';
  const actorLabel = buildRoleActorLabel(actorMembership);
  const greetingAlias = targetMembership.alias || 'miembro';
  const roleLabel = formatRoleLabel(targetMembership.role);
  const text = [
    `Hola ${greetingAlias},`,
    '',
    `${actorLabel} de la comunidad "${communityName}" ha actualizado tu rol a ${roleLabel}.`,
    '',
    'Puedes consultar tus cambios en la comunidad desde el portal de SIGECO.'
  ].join('\n');

  try {
    await mailService.sendMail({
      to: targetEmail,
      subject: `SIGECO - Cambio de rol en ${communityName}`,
      text
    });
  } catch (error) {
    console.warn('No se ha podido enviar el correo de cambio de rol', {
      targetMembershipId: targetMembership.id,
      communityId: targetMembership.communityId,
      error
    });
  }
}

async function sendMemberMail({ membership, subject, text, logMessage }) {
  const targetEmail = membership.user?.email;

  if (!targetEmail) {
    return;
  }

  try {
    await mailService.sendMail({ to: targetEmail, subject, text });
  } catch (error) {
    console.warn(logMessage, {
      membershipId: membership.id,
      communityId: membership.communityId,
      error
    });
  }
}

async function notifyMembershipEnded({ membership, reason, actorMembership = null }) {
  const communityName = membership.community?.name || 'tu comunidad';
  const greetingAlias = membership.alias || 'miembro';
  const isExpelled = reason === 'EXPELLED';
  const actorText = actorMembership?.alias ? ` por ${actorMembership.alias}` : '';
  const message = isExpelled
    ? `Has sido expulsado${actorText} de la comunidad "${communityName}".`
    : `Confirmamos que has abandonado la comunidad "${communityName}".`;
  const extraLines = isExpelled
    ? [
        'Si quieres volver a acceder, deberás solicitar unirte de nuevo desde tu perfil de usuario.',
        ''
      ]
    : [
        'A partir de ahora dejarás de tener acceso a sus contenidos y gestiones.',
        'Si necesitas volver a formar parte de la comunidad, podrás solicitar unirte de nuevo desde tu perfil de usuario.',
        ''
      ];

  await sendMemberMail({
    membership,
    subject: `SIGECO - ${isExpelled ? 'Expulsión' : 'Salida'} de ${communityName}`,
    text: [
      `Hola ${greetingAlias},`,
      '',
      message,
      '',
      ...extraLines,
      'Este cambio ya está reflejado en SIGECO.'
    ].join('\n'),
    logMessage: 'No se ha podido enviar el correo de baja de comunidad'
  });
}

async function notifySuspensionChange({ membership, action }) {
  const communityName = membership.community?.name || 'tu comunidad';
  const greetingAlias = membership.alias || 'miembro';
  const suspended = action === 'SUSPENDED';
  const reasonLine = suspended && membership.suspensionReason
    ? [`Motivo: "${membership.suspensionReason}"`, '']
    : [];
  const untilLine = suspended && membership.suspendedUntil
    ? [`Hasta: ${membership.suspendedUntil.toISOString()}`, '']
    : [];
  const message = suspended
    ? `Se ha registrado tu suspensión en la comunidad "${communityName}".`
    : `Se ha retirado tu suspensión en la comunidad "${communityName}".`;

  await sendMemberMail({
    membership,
    subject: `SIGECO - ${suspended ? 'Suspensión' : 'Suspensión retirada'} en ${communityName}`,
    text: [
      `Hola ${greetingAlias},`,
      '',
      message,
      '',
      ...reasonLine,
      ...untilLine,
      'Puedes consultar tu estado desde SIGECO.'
    ].join('\n'),
    logMessage: 'No se ha podido enviar el correo de cambio de suspensión'
  });
}

async function requireActiveCommunityMember(input, membersRepository) {
  const targetMembership = await membersRepository.findMembershipByIdAndCommunity(
    input.memberId,
    input.communityId
  );

  if (!targetMembership || targetMembership.deletedAt || targetMembership.endedAt) {
    throw new NotFoundError('Miembro no encontrado');
  }

  return targetMembership;
}

async function requireCommunityMembershipAccess(userId, communityId, membersRepository) {
  // Este servicio se comparte con otros modulos para distinguir comunidad inexistente de usuario que no pertenece a ella.
  const community = await membersRepository.findActiveCommunityById(communityId);

  if (!community) {
    throw new NotFoundError('Comunidad no encontrada');
  }

  const membership = await membersRepository.findMembershipByUserAndCommunity(userId, communityId);

  if (!hasCommunityMembershipAccess(membership)) {
    throw new ForbiddenError('El usuario no pertenece a esta comunidad');
  }

  return { community, membership };
}

async function requireAdministrativeCommunityAccess(userId, communityId, membersRepository) {
  const { community, membership } = await requireCommunityMembershipAccess(userId, communityId, membersRepository);

  if (!hasAdministrativeMembershipAccess(membership)) {
    throw new ForbiddenError('Se requieren permisos administrativos en esta comunidad');
  }

  return { community, membership };
}

async function requireOperationalCommunityAccess(userId, communityId, membersRepository) {
  const { community, membership } = await requireCommunityMembershipAccess(userId, communityId, membersRepository);

  if (!isMembershipOperational(membership)) {
    throw new ForbiddenError('No se puede operar en este módulo');
  }
  return { community, membership };
}

async function listCommunityMembers(input, membersRepository, options = {}) {
  // Se reutiliza desde communities para montar respuestas compuestas sin duplicar paginación, filtros y mapeos de salida.
  const take = options.take || input.pageSize;
  const skip = options.skip !== undefined
    ? options.skip
    : options.take ? 0 : (input.page - 1) * input.pageSize;
  const includePagination = options.includePagination !== false;
  const includeTotal = options.includeTotal !== false;

  const result = await membersRepository.findCommunityMembers(input, { skip, take, includeTotal });
  const items = result.items.map(mapCommunityMember);

  if (!includePagination) {
    return { items, total: result.total };
  }

  const totalPages = result.total === null ? null : Math.ceil(result.total / input.pageSize);

  return { items, pagination: { page: input.page, pageSize: input.pageSize, total: result.total, totalPages } };
}

async function getCommunityMembers(context, input, membersRepository) {
  await requireAdministrativeCommunityAccess(context.userId, input.communityId, membersRepository);
  return listCommunityMembers(input, membersRepository);
}

 // La suspensión no impide abandonar la comunidad.
async function leaveMyCommunity(context, input, membersRepository) {
  const { membership } = await requireCommunityMembershipAccess(context.userId, input.communityId, membersRepository);

  if (membership.role === 'PRESIDENT') {
    throw new ConflictError('No es posible abandonar la comunidad con rol de PRESIDENTE');
  }

  const result = await membersRepository.finalizeMembershipAndResolveActiveContext({
    userId: context.userId,
    membershipId: membership.id,
    communityId: input.communityId,
    endReason: 'LEFT_COMMUNITY'
  });

  if (!result) {
    throw new ConflictError('La pertenencia a la comunidad no está en un estado válido para esta operación');
  }

  const storedSession = await authRepository.findSessionById(context.sessionId);

  if (!storedSession || !storedSession.user || storedSession.user.deletedAt) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Tras cerrar la membership, devolvemos el nuevo contexto visible para la misma sesión que hizo la operación.
  const accessContext = await resolveUserAccessContext(
    storedSession.user,
    authRepository,
    storedSession.activeMembershipId || storedSession.user.lastActiveMembershipId
  );

  await notifyMembershipEnded({ membership, reason: 'LEFT_COMMUNITY' });

  return { leftCommunity: true, communityId: input.communityId, activeMembership: mapActiveMembership(accessContext.activeMembership) };
}

async function expelCommunityMember(context, input, membersRepository) {
  const { membership: actorMembership } = await requireAdministrativeCommunityAccess(context.userId, input.communityId, membersRepository);

  const targetMembership = await requireActiveCommunityMember(input, membersRepository);

  if (targetMembership.role === 'PRESIDENT') {
    throw new ConflictError('No es posible expulsar de la comunidad al usuario con rol de PRESIDENTE');
  }

  const result = await membersRepository.finalizeMembershipAndResolveActiveContext({
    userId: targetMembership.userId,
    membershipId: targetMembership.id,
    communityId: input.communityId,
    endReason: input.reason || 'EXPELLED'
  });

  if (!result) {
    throw new ConflictError('La pertenencia a la comunidad no está en un estado válido para esta operación');
  }

  await notifyMembershipEnded({ membership: targetMembership, reason: 'EXPELLED', actorMembership });

  return {
    expelled: true,
    communityId: input.communityId,
    memberId: targetMembership.id
  };
}

function validateAdministrativeRoleChange(actorMembership, targetMembership, role) {
  switch (role) {
    case 'PRESIDENT':
      if (actorMembership.role !== 'PRESIDENT') {
        throw new ForbiddenError('Solo la presidencia actual puede transferir la presidencia');
      }
      return;

    case 'VICE_PRESIDENT':
      if (targetMembership.role === 'PRESIDENT') {
        throw new ConflictError('La presidencia de la comunidad no puede reasignarse como vicepresidencia');
      }

      if (actorMembership.role === 'PRESIDENT' && actorMembership.id === targetMembership.id) {
        throw new ConflictError('La presidencia de la comunidad no puede autoasignarse como vicepresidencia');
      }
      return;

    case 'MEMBER':
      if (actorMembership.role !== 'PRESIDENT') {
        throw new ForbiddenError('Solo la presidencia actual puede retirar la vicepresidencia');
      }

      if (targetMembership.role !== 'VICE_PRESIDENT') {
        throw new ConflictError('Solo se puede retirar la vicepresidencia al vicepresidente actual');
      }
      return;
  }
}

async function assignCommunityMemberRole(context, input, membersRepository) {
  const { membership: actorMembership } = await requireAdministrativeCommunityAccess(
    context.userId,
    input.communityId,
    membersRepository
  );

  const targetMembership = await requireActiveCommunityMember(input, membersRepository);

  validateAdministrativeRoleChange(actorMembership, targetMembership, input.role);

  const result = await membersRepository.updateAdministrativeRole({
    communityId: input.communityId,
    actorMembershipId: actorMembership.id,
    targetMembershipId: targetMembership.id,
    role: input.role
  });

  if (!result?.actorMembership || !result?.targetMembership) {
    throw new ConflictError('No se han podido actualizar los roles de la comunidad');
  }

  if (targetMembership.role !== result.targetMembership.role) {
    await notifyRoleChange({ actorMembership, targetMembership: result.targetMembership });
  }

  for (const downgradedMembership of result.downgradedMemberships || []) {
    await notifyRoleChange({ actorMembership, targetMembership: downgradedMembership });
  }

  return { targetMember: mapRoleMember(result.targetMembership), actorMembership: mapRoleMember(result.actorMembership) };
}

async function suspendCommunityMember(context, input, membersRepository) {
  await requireAdministrativeCommunityAccess(context.userId, input.communityId, membersRepository);

  const targetMembership = await requireActiveCommunityMember(input, membersRepository);

  // El presidente queda fuera del flujo de suspensión para evitar dejar la comunidad sin autoridad.
  if (targetMembership.role === 'PRESIDENT') {
    throw new ForbiddenError('No se puede suspender al miembro seleccionado');
  }

  // La suspensión queda modelada por suspendedUntil.
  const updatedMembership = await membersRepository.suspendMembership({
    memberId: input.memberId,
    communityId: input.communityId,
    suspendedUntil: input.suspendedUntil,
    suspensionReason: input.suspensionReason
  });

  if (!updatedMembership) {
    throw new ConflictError('No ha sido posible suspender al miembro de la comunidad');
  }

  await notifySuspensionChange({ membership: updatedMembership, action: 'SUSPENDED' });

  return { member: mapSuspendedMember(updatedMembership) };
}

async function cancelCommunityMemberSuspension(context, input, membersRepository) {
  await requireAdministrativeCommunityAccess(context.userId, input.communityId, membersRepository);

  const targetMembership = await requireActiveCommunityMember(input, membersRepository);

  if (!isMembershipCurrentlySuspended(targetMembership)) {
    throw new ConflictError('La pertenencia a la comunidad no tiene una suspensión activa');
  }

  const updatedMembership = await membersRepository.clearMembershipSuspension({ memberId: input.memberId, communityId: input.communityId });

  if (!updatedMembership) {
    throw new ConflictError('No ha sido posible cancelar la suspensión del miembro de la comunidad');
  }

  await notifySuspensionChange({ membership: updatedMembership, action: 'UNSUSPENDED' });

  return { member: mapSuspendedMember(updatedMembership) };
}

module.exports = {
  getCommunityMembers,
  listCommunityMembers,
  requireCommunityMembershipAccess,
  requireOperationalCommunityAccess,
  requireAdministrativeCommunityAccess,
  leaveMyCommunity,
  expelCommunityMember,
  assignCommunityMemberRole,
  suspendCommunityMember,
  cancelCommunityMemberSuspension
};
