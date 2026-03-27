import api from './api';

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
}) => api.post('/api/communities', {
    community: {
        name: data.name,
        cif: data.cif,
        country: data.country,
        province: data.province,
        municipality: data.municipality,
        streetType: data.streetType,
        streetName: data.streetName,
        postalCode: data.postalCode,
        streetNumberKm: data.number
    },
    creatorProperty: {
        country: data.domicile.country,
        province: data.domicile.province,
        municipality: data.domicile.municipality,
        streetType: data.domicile.streetType,
        streetName: data.domicile.streetName,
        postalCode: data.domicile.postalCode,
        streetNumberKm: data.domicile.number,
        block: data.domicile.block,
        floor: data.domicile.floor,
        door: data.domicile.door
    },
    alias: data.alias
});

//Unirse a una comunidad con código
export const requestJoinCommunity = (accessCode: string, data: {
    alias: string;
    comment?: string;
    domicile: {country: string, province: string, municipality: string, streetType: string, streetName: string, postalCode: string, number: string, block?:string, floor?:string, door?:string};
}) => api.post('/api/requests', {
    type: 'JOIN',
    accessCode,
    proposedAlias: data.alias,
    country: data.domicile.country,
    province: data.domicile.province,
    municipality: data.domicile.municipality,
    streetType: data.domicile.streetType,
    streetName: data.domicile.streetName,
    postalCode: data.domicile.postalCode,
    streetNumberKm: data.domicile.number,
    block: data.domicile.block,
    floor: data.domicile.floor,
    door: data.domicile.door,
    requestComment: data.comment
});

//Solicitar editar mi informacion en la comunidad
export const requestProfileChange = (communityId: string, data: {
    alias?: string;
    comment?: string;
    domicile?: {country: string, province: string, municipality: string, streetType: string, streetName: string, postalCode: string, number: string, block?:string, floor?:string, door?:string};
}) => api.post('/api/requests', {
    type: 'UPDATE_INFO',
    communityId,
    proposedAlias: data.alias,
    country: data.domicile?.country,
    province: data.domicile?.province,
    municipality: data.domicile?.municipality,
    streetType: data.domicile?.streetType,
    streetName: data.domicile?.streetName,
    postalCode: data.domicile?.postalCode,
    streetNumberKm: data.domicile?.number,
    block: data.domicile?.block,
    floor: data.domicile?.floor,
    door: data.domicile?.door,
    requestComment: data.comment
});

//Mis solicitudes
export const getMyRequests = () => api.get('/api/requests/mine');

//Cancelar solicitud pendiente
export const cancelRequest = (requestId: string) =>
    api.post(`/api/requests/${requestId}/cancel`);

//Archivar solicitud resuelta
export const archiveRequest = (requestId: string) =>
    api.post(`/api/requests/${requestId}/archive`);

//Cambiar comunidad activa
export const setActiveCommunity = (communityId: string) =>
    api.put('/api/users/me/active-community', {communityId});

//Abandonar una comunidada
export const leaveCommunity = (communityId: string) =>
    api.post(`/api/communities/${communityId}/members/me/leave`, {confirm: true});
