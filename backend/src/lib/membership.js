/**
 * Helper para centralizar la comprobación de suspensión de una membresía.
 * Un usuario tiene suspendido el acceso si tiene fecha de suspensión futura.
 */
function isMembershipCurrentlySuspended(membership) {
  if (!membership?.suspendedUntil) { return false; }
  return membership.suspendedUntil > new Date();
}

module.exports = { isMembershipCurrentlySuspended };