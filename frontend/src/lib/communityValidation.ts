const SPAIN_POSTAL_CODE_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
const COMMUNITY_OWNERS_CIF_REGEX = /^H\d{8}$/;
const STREET_NUMBER_REGEX = /^(?:S\/N|KM ?\d+(?:[.,]\d+)?|\d+[A-Z0-9\/ -]*)$/i;

export function normalizeCommunityCif(value: string) {
    return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function isValidCommunityOwnersCif(value: string) {
    const compactValue = normalizeCommunityCif(value);
    return COMMUNITY_OWNERS_CIF_REGEX.test(compactValue);
}

export function isValidSpanishPostalCode(value: string) {
    return SPAIN_POSTAL_CODE_REGEX.test(String(value || '').trim());
}

export function isValidStreetNumberKm(value: string) {
    return STREET_NUMBER_REGEX.test(String(value || '').trim().toUpperCase());
}
