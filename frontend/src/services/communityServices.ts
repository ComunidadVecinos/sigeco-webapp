import api from './api';

//Mis comunidades
export const getCommunities = () =>
    api.get('/api/communities');

//Crear una nueva comunidad
export const createCommunity = (data: {
    name: string;
    cif: string;
    alias: string;
    country: string;
    province: string;
    municipality:string;
    streetType: string;
    streetName: string;
    postalCode: string;
    number: string;
    domicile: {country: string, province: string, municipality: string, streetType: string, streetName: string, postalCode: string, number: string, block?:string, floor?:string, door?:string};
}) => api.post('/api/communities', data);

//Unirse a una comunidad con código
export const requestJoinCommunity = (communityId: number, data: {
    alias: string;
    comment?: string;
    domicile: {country: string, province: string, municipality: string, streetType: string, streetName: string, postalCode: string, number: string, block?:string, floor?:string, door?:string};
}) => api.post(`/api/communities/${communityId}/requests/join`, data);

//Solicitar editar mi informacion en la comunidad
export const requestProfileChange = (communityId: number, data: {
    alias?: string;
    comment?: string;
    domicile?: {country: string, province: string, municipality: string, streetType: string, streetName: string, postalCode: string, number: string, block?:string, floor?:string, door?:string};
}) => api.post(`/api/communities/${communityId}/requests/profile-change`, data);

//Mis solicitudes
export const getMyRequests = () => api.get('/api/users/me/requests');

//Archivar/cancelar solicitud
export const archiveRequest = (requestId: number) =>
    api.patch(`/api/users/me/requests/${requestId}/archive`);

//Cambiar comunidad activa
export const setActiveCommunity = (communityId: number) =>
    api.put('/api/users/me/active-community', {communityId});

//Abandonar una comunidada
export const leaveCommunity = (communityId: number) =>
    api.delete(`/api/communities/${communityId}/members/me`);