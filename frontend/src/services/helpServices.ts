import api from './api';

//Ayuda general
export const getGenerealHelp = () =>
    api.get('/api/help/general');

//Ayuda de la comunidad
export const getComunnityHelp = (communityId: number) =>
    api.get(`/api/communities/${communityId}/help`);

//Añadir seccion
export const addHelpSection = (communityId: number, data: {
    title: string;
    description: string;
}) => api.post(`/api/communities/${communityId}/help/sections`, data);

//Editar seccion
export const updateHelpSection = (communityId: number, sectionId: number, data: {
    title: string;
    description: string;
}) => api.patch(`/api/communities/${communityId}/help/sections/${sectionId}`, data);

//Eliminar seccion
export const deleteHelpSection = (communityId: number, sectionId: number) =>
    api.delete(`/api/communities/${communityId}/help/sections/${sectionId}`);

//Reordenar secciones
export const reorderHelpSections = (communityId: number, sectionIds: number[]) =>
    api.put(`/api/communities/${communityId}/help/sections/order`, {sectionIds});