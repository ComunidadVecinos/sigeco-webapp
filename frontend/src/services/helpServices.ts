//Servicios de ayuda: secciones de ayuda general y por comunidad
import api from './api';

//Ayuda general
export const getGeneralHelp = () =>
    api.get('/api/help/sections');

//Ayuda de la comunidad
export const getCommunityHelp = (communityId: string) =>
    api.get(`/api/communities/${communityId}/help/sections`);

//Añadir seccion
export const addHelpSection = (communityId: string, data: {
    title: string;
    description: string;
}) => api.post(`/api/communities/${communityId}/help/sections`, data);

//Editar seccion
export const updateHelpSection = (communityId: string, sectionId: string, data: {
    title: string;
    description: string;
}) => api.patch(`/api/communities/${communityId}/help/sections/${sectionId}`, data);

//Eliminar seccion
export const deleteHelpSection = (communityId: string, sectionId: string) =>
    api.delete(`/api/communities/${communityId}/help/sections/${sectionId}`);

//Reordenar secciones
export const reorderHelpSections = (communityId: string, sectionIds: string[]) =>
    api.put(`/api/communities/${communityId}/help/sections/order`, {sectionIds});
