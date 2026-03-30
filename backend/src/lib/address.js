/**
 * Helpers para datos de dirección (property) compartidos entre servicios de users, communities, memebrs y requests.
 * Reciben entidades de Prisma o payloads ya validados y devuelven una representación lista para API.
 */

// Compacta una dirección en una cadena legible para respuestas de API. Devuelve una cadena formateada o null si no hay datos suficientes.
function formatAddress(address) {
  if (!address) { return null; }

  const mainLine = [address.streetType, address.streetName, address.streetNumberKm].filter(Boolean).join(' ').trim();

  const detailParts = [
    address.block ? `Bloque ${address.block}` : null,
    address.floor ? `Piso ${address.floor}` : null,
    address.door ? `Puerta ${address.door}` : null
  ].filter(Boolean);

  const formatted = [mainLine || null, ...detailParts].filter(Boolean).join(', ');

  return formatted || null;
}

// Construye una vista resumida y estable de una dirección para respuestas HTTP. Devuelve un objeto con los datos de dirección.
function buildAddressSummary(address) {
  if (!address) {
    return null;
  }

  return {
    country: address.country,
    province: address.province,
    municipality: address.municipality,
    streetType: address.streetType,
    streetName: address.streetName,
    postalCode: address.postalCode,
    streetNumberKm: address.streetNumberKm,
    block: address.block || null,
    floor: address.floor || null,
    door: address.door || null,
    formatted: formatAddress(address)
  };
}

module.exports = { formatAddress, buildAddressSummary };