// Resolver del contexto autenticado: decide qué membership activa representa al usuario en cada request.
// Flujo cubierto: memberships activas -> selección de contexto preferido -> resumen reutilizable.
// Expone resolveUserAccessContext, usado por auth, users, communities y members. Lo consumen los módulos que necesitan contexto activo.
const { isMembershipCurrentlySuspended } = require('../../lib/membership');

// Tipos de actor emitidos por auth para resumir el contexto visible.
const AccessActorType = Object.freeze({
  REGISTERED_USER_NO_COMMUNITY: 'RegisteredUserNoCommunity',
  STANDARD_MEMBER: 'StandardMember',
  DELEGATED_ADMIN: 'DelegatedAdmin',
  PRINCIPAL_ADMIN: 'PrincipalAdmin'
});

function resolveAccessActorType(activeMembership) {
  if (!activeMembership) {
    return AccessActorType.REGISTERED_USER_NO_COMMUNITY;
  }
  if (activeMembership.role === 'PRESIDENT') {
    return AccessActorType.PRINCIPAL_ADMIN;
  }
  if (activeMembership.role === 'VICE_PRESIDENT') {
    return AccessActorType.DELEGATED_ADMIN;
  }
  if (activeMembership.role === 'MEMBER') {
    return AccessActorType.STANDARD_MEMBER;
  }

  return AccessActorType.STANDARD_MEMBER;
}

// Respeta la última membership activa del usuario, si sigue siendo válida.
function selectActiveMembership(memberships, preferredMembershipId) {
  if (!memberships || memberships.length === 0) {
    return null;
  }
  if (preferredMembershipId) {
    const preferredMembership = memberships.find((membership) => membership.id === preferredMembershipId);
    if (preferredMembership) {
      return preferredMembership;
    }
  }

  // Si la preferida ya no vale, intentamos dejar al usuario en un contexto no suspendido.
  const firstNonSuspendedMembership = memberships.find((membership) => !isMembershipCurrentlySuspended(membership));

  // Si todas están suspendidas, se conserva igualmente una referencia activa para no dejar el contexto vacío.
  return firstNonSuspendedMembership || memberships[0];
}

function buildActiveMembershipSummary(activeMembership) {
  if (!activeMembership) {
    return null;
  }
  return {
    id: activeMembership.id,
    communityId: activeMembership.communityId,
    communityName: activeMembership.community.name,
    role: activeMembership.role,
    alias: activeMembership.alias || null,
    suspensionActive: isMembershipCurrentlySuspended(activeMembership),
    suspendedAt: activeMembership.suspendedAt ? activeMembership.suspendedAt.toISOString() : null,
    suspendedUntil: activeMembership.suspendedUntil ? activeMembership.suspendedUntil.toISOString() : null,
    suspensionReason: activeMembership.suspensionReason || null
  };
}

// Resuelve el contexto de acceso para construir la sesión y compartirlo con el resto del sistema.
async function resolveUserAccessContext(user, authRepository, preferredMembershipId = user.lastActiveMembershipId) {
  const memberships = await authRepository.findActiveMembershipsByUserId(user.id);
  const activeMembership = selectActiveMembership(memberships, preferredMembershipId);
  const actorType = resolveAccessActorType(activeMembership);

  return { actorType, hasMemberships: memberships.length > 0, activeMembership: buildActiveMembershipSummary(activeMembership) };
}

module.exports = { resolveUserAccessContext };