// Helper mínimo para saber si una membership sigue suspendida en este momento.
// Se usa desde auth, members y otros servicios que necesitan una regla común de operatividad.
function isMembershipCurrentlySuspended(membership) {
  if (!membership?.suspendedUntil) { return false; }
  return membership.suspendedUntil > new Date();
}

module.exports = { isMembershipCurrentlySuspended };