//Utilidades para extraer y mapear errores de validación devueltas por la API
export type FieldErrors = Record<string, string>;

interface ApiErrorDetail {
    field?: string;
    message?: string;
}

//Extare el objeto de error de la respuesta API
function getApiErrorPayload(error: any) {
    return error?.response?.data?.error;
}

//Devuelve el mensaje de error de la API o un mensaje por defecto
export function getApiErrorMessage(error: any, fallback: string) {
    return getApiErrorPayload(error)?.message || fallback;
}

//Convierte los errores por campo de la API en un mapa {campo: mensaje}
export function getApiFieldErrors(error: any, fieldMap: Record<string, string> = {}): FieldErrors {
    const details = getApiErrorPayload(error)?.details;

    if (!Array.isArray(details)) {
        return {};
    }

    return details.reduce((acc: FieldErrors, detail: ApiErrorDetail) => {
        if (!detail?.field || !detail?.message) {
            return acc;
        }

        const mappedField = fieldMap[detail.field] || detail.field;

        if (!mappedField || acc[mappedField]) {
            return acc;
        }

        acc[mappedField] = detail.message;
        return acc;
    }, {});
}

//Comprueba si hay al menos un error de campo
export function hasFieldErrors(fieldErrors: FieldErrors) {
    return Object.keys(fieldErrors).length > 0;
}
