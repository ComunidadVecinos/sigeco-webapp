export type FieldErrors = Record<string, string>;

interface ApiErrorDetail {
    field?: string;
    message?: string;
}

function getApiErrorPayload(error: any) {
    return error?.response?.data?.error;
}

export function getApiErrorMessage(error: any, fallback: string) {
    return getApiErrorPayload(error)?.message || fallback;
}

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

export function hasFieldErrors(fieldErrors: FieldErrors) {
    return Object.keys(fieldErrors).length > 0;
}
