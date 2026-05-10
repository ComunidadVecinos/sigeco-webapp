// Reglas de acceso de members: resumen la pertenencia y la operatividad que usan varios módulos.
// Flujo cubierto: membership resuelta -> comprobación de pertenencia, operatividad y rol administrativo.
// Expone helpers de acceso para members y otros servicios comunitarios.
// Lo consumen members.service.js y varios módulos que dependen de permisos comunitarios.
const { isMembershipCurrentlySuspended } = require('../../lib/membership');

function hasAdministrativeRole(membership) {
  return membership?.role === 'PRESIDENT' || membership?.role === 'VICE_PRESIDENT';
}

function hasCommunityMembershipAccess(membership) {
  // Pertenecer a la comunidad no exige operatividad: un miembro suspendido sigue perteneciendo mientras la membership siga viva.
  if (!membership || membership.deletedAt || membership.endedAt) {
    return false;
  }
  return true;
}

function isMembershipOperational(membership) {
  if (!hasCommunityMembershipAccess(membership)) {
    return false;
  }
  // Un miembro suspendido conserva pertenencia, pero deja de poder operar en módulos restringidos.
  return !isMembershipCurrentlySuspended(membership);
}

function hasAdministrativeMembershipAccess(membership) {
  return isMembershipOperational(membership) && hasAdministrativeRole(membership);
}

module.exports = {
  hasCommunityMembershipAccess,
  hasAdministrativeRole,
  isMembershipOperational,
  hasAdministrativeMembershipAccess
};