// Helpers de dirección compartidos por varios servicios del backend.
// Aquí solo se da formato y se arma una vista estable para la API; no hay validación ni reglas de negocio.

// Compacta una dirección en una cadena legible para respuestas de API.
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

// Construye la versión resumida que devolvemos en respuestas HTTP.
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