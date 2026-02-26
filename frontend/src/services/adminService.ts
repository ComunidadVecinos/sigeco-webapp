import { use } from 'react';
import api from './api';

//Panel de administrador
export const getAdminSummary = (communityId: number) =>
    api.get(`/api/communities/${communityId}/admin/summary`);

//Solicitudes pendientes
export const getRequests = (communityId: number, filters: {
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
}) => api.get(`/api/communities/${communityId}/requests`, {params: filters});

//Miembros de la comunidad
export const getMembers = (communityId: number, filters: {
    q?: string;
    joinedBefore?: string;
    joinedAfter?: string;
    suspensionStatus?: string;
    page?: number;
    pageSize?: number;
}) => api.get(`/api/communities/${communityId}/members`, {params: filters});

//Editar info de la comunidad
export const updateCommunity = (communityId: number, data: {
    name?: string;
    country?: string;
    province?: string;
    municipality?: string;
    streetType?: string;
    streetName?: string;
    postalCode?: string;
    number?: string;
}) => api.patch(`/api/communities/${communityId}`, data);

//Cambiar imagen de la comunidad
export const updateCommunityAvatar = (communityId: number, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put(`/api/communities/${communityId}/avatar`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    });
};

//Aceptar solicitud
export const approveRequest = (communityId: number, requestId: number, message?: string) =>
    api.post(`/api/communities/${communityId}/requests/${requestId}/approve`, {message});

//Rechazar solicitud
export const rejectRequest = (communityId: number, requestId: number, message?: string) =>
    api.post(`/api/communities/${communityId}/requests/${requestId}/reject`, {message});

//Suspender usuario
export const suspendMember = (communityId: number, userId: number, data: {
    endDate: string;
    comment?: string;
}) => api.post(`/api/communities/${communityId}/members/${userId}/suspension`, data);

//Cancelar suspension
export const cancelSuspension = (communityId: number, userId: number) =>
    api.delete(`/api/communities/${communityId}/members/${userId}/suspension`);

//Expulsar usuario
export const expelMember = (communityId: number, userId: number) =>
    api.delete(`/api/communities/${communityId}/members/${userId}`);

//Asignar vicepresidente
export const assignVicepresident = (communityId: number, userId: number) =>
    api.put(`/api/communities/${communityId}/roles/vicepresident/assign`, {userId});

//Transferir presidente
export const trasnferPresident = (communityId: number, userId: number) =>
    api.put(`/api/communities/${communityId}/roles/president/transfer`, {userId});

//Transferir vicepresidente
export const trasnferVicepresident = (communityId: number, userId: number) =>
    api.put(`/api/communities/${communityId}/roles/vicepresident/transfer`, {userId});

//Eliminar comunidad
export const deleteCommunity = (communityId: number, data: {
    confirmText: string;
    password: string;
}) => api.delete(`/api/communities/${communityId}`, {data});