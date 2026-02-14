import api from './api';

//Mis comunidades
export const getCommunities = () =>
    api.get('/api/communities');

//Crear una nueva comunidad
export const createCommunity = (data: {
    name: string;
    cif: string;
    country: string;
    province: string;
    municipality:string;
    streetType: string;
    streetName: string;
    postalCode: string;
    number: string;
}) => api.post('/api/communities', data);

//Unirse a una comunidad con código
export const joinCommunity = (code: string, domicile: {
    country: string;
    province: string;
    municipality:string;
    streetType: string;
    streetName: string;
    postalCode: string;
    number: string;
    block?: string;
    floor?: string;
    door?: string;
}) => api.post('/api/communities/join', {code, domicile});