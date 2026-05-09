//Servicios de administarción: gestión de miembros, roles, solicitudes y configuración de comunidad
import api from './api';

//Elimina parámetros vacíos o undefined antes de enviarlos como query params
function cleanOptionalParams<T extends Record<string, string | number | undefined>>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    );
}

//Panel de administrador
export const getAdminSummary = (communityId: string) =>
    api.get(`/api/communities/${communityId}/summary`);

//Solicitudes pendientes
export const getRequests = (communityId: string, filters: {
    type?: string;
    page?: number;
    pageSize?: number;
}) => api.get('/api/requests', {params: cleanOptionalParams({communityId, ...filters})});

//Miembros de la comunidad
export const getMembers = (communityId: string, filters: {
    q?: string;
    joinedBefore?: string;
    joinedAfter?: string;
    suspensionStatus?: string;
    page?: number;
    pageSize?: number;
}) => api.get(`/api/communities/${communityId}/members`, {params: cleanOptionalParams(filters)});

//Editar info de la comunidad
export const updateCommunity = (communityId: string, data: {
    name?: string;
    country?: string;
    province?: string;
    municipality?: string;
    streetType?: string;
    streetName?: string;
    postalCode?: string;
    number?: string;
}) => api.patch(`/api/communities/${communityId}`, {
    name: data.name,
    country: data.country,
    province: data.province,
    municipality: data.municipality,
    streetType: data.streetType,
    streetName: data.streetName,
    postalCode: data.postalCode,
    streetNumberKm: data.number
});

//Cambiar imagen de la comunidad
export const updateCommunityAvatar = (communityId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put(`/api/communities/${communityId}/avatar`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    });
};

//Eliminar imagen de la comunidad
export const deleteCommunityAvatar = (communityId: string) =>
    api.delete(`/api/communities/${communityId}/avatar`);

//Aceptar solicitud
export const approveRequest = (_communityId: string, requestId: string, message?: string) =>
    api.post(`/api/requests/${requestId}/approve`, {resolutionMessage: message});

//Rechazar solicitud
export const rejectRequest = (_communityId: string, requestId: string, message?: string) =>
    api.post(`/api/requests/${requestId}/reject`, {resolutionMessage: message});

//Suspender usuario
export const suspendMember = (communityId: string, userId: string, data: {
    endDate: string;
    comment?: string;
}) => api.put(`/api/communities/${communityId}/members/${userId}/suspension`, {
    suspendedUntil: data.endDate,
    suspensionReason: data.comment
});

//Cancelar suspension
export const cancelSuspension = (communityId: string, userId: string) =>
    api.delete(`/api/communities/${communityId}/members/${userId}/suspension`);

//Expulsar usuario
export const expelMember = (communityId: string, userId: string, reason?: string) =>
    api.post(`/api/communities/${communityId}/members/${userId}/expel`, {confirm: true, reason});

//Asignar vicepresidente
export const assignVicepresident = (communityId: string, userId: string) =>
    api.put(`/api/communities/${communityId}/members/${userId}/roles/VICE_PRESIDENT`);

//Revocar vicepresidencia 
export const revokeVicepresidency = (communityId: string, userId: string) =>
    api.put(`/api/communities/${communityId}/members/${userId}/roles/MEMBER`);

//Transferir presidente
export const transferPresident = (communityId: string, userId: string) =>
    api.put(`/api/communities/${communityId}/members/${userId}/roles/PRESIDENT`);

//Transferir vicepresidente
export const transferVicepresident = (communityId: string, userId: string) =>
    api.put(`/api/communities/${communityId}/members/${userId}/roles/VICE_PRESIDENT`);

//Eliminar comunidad
export const deleteCommunity = (communityId: string, data: {
    confirmationText: string;
    currentPassword: string;
}) => api.delete(`/api/communities/${communityId}`, {data});

//Regenerar código de acceso de la comunidad
export const regenerateAccessCode = (communityId: string) =>
    api.post(`/api/communities/${communityId}/admin/access-code/regenerate`);