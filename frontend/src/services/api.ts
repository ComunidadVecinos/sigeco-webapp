//Configuración de Axios: instancia de base, interceptores y manejo de sesión expirada
import axios from 'axios';

const API_URL = '';
export const SESSION_EXPIRED_EVENT = 'sigeco:session-expired';

//Rutas de autenticación pública para no disparar el evento de sesión expirada
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

//Elimina Content-Type en peticiones con FormData para que el navegador genere el boundary
api.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        if (config.headers && typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type');
            config.headers.delete('content-type');
        } 
        else if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }
    }
    return config;
});

//Si la API devuelve 401 en una ruta protegida se emite el evento global de sesión expirada
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
