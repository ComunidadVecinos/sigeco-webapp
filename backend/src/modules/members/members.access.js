// Politicas de acceso reutilizables del modulo members.
// Distinguen pertenencia a comunidad de operatividad para no mezclar suspension con baja o borrado.
const { isMembershipCurrentlySuspended } = require('../../lib/membership');

function hasAdministrativeRole(membership) {
  return membership?.role === 'PRESIDENT' || membership?.role === 'VICE_PRESIDENT';
}

function hasCommunityMembershipAccess(membership) {
  // "Pertenecer" a la comunidad no exige operatividad: un miembro suspendido
  // conserva visibilidad basica mientras la membership no haya finalizado ni sido borrada.
  if (!membership || membership.deletedAt || membership.endedAt) {
    return false;
  }

  return true;
}

function isMembershipOperational(membership) {
  if (!hasCommunityMembershipAccess(membership)) {
    return false;
  }
  // Un miembro suspendido sigue perteneciendo a la comunidad, pero deja de poder usar modulos restringidos.
  return !isMembershipCurrentlySuspended(membership);
}

function hasAdministrativeMembershipAccess(membership) {
  return isMembershipOperational(membership) && hasAdministrativeRole(membership);
}

module.exports = { hasCommunityMembershipAccess, hasAdministrativeRole, isMembershipOperational, hasAdministrativeMembershipAccess };