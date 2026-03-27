import axios from 'axios';

const API_URL = '';
export const SESSION_EXPIRED_EVENT = 'sigeco:session-expired';

function isPublicAuthRequest(method?: string, url?: string) {
    const normalizedMethod = (method || '').toLowerCase();
    const normalizedUrl = url || '';

    return (
        (normalizedMethod === 'post' && normalizedUrl === '/api/auth/sessions') ||
        (normalizedMethod === 'post' && normalizedUrl === '/api/auth/registrations') ||
        (normalizedMethod === 'post' && normalizedUrl === '/api/auth/password/reset')
    );
}

const api = axios.create({
    baseURL: API_URL,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const method = error?.config?.method;
        const url = error?.config?.url;

        if (status === 401 && !isPublicAuthRequest(method, url) && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }

        return Promise.reject(error);
    }
);

export default api;
