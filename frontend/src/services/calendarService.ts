import api from './api';

//Obtener todos los eventos (tanto de la comunidad como personales)
export const getCalendarEvents = (communityId: string, filters?: {
    startDate?: string;
    endDate?: string;
}) => api.get(`/api/communities/${communityId}/calendar`, {params: filters});

//Crear evento personal
export const createPersonalEvent = (communityId: string, data: {
    title: string;
    time: string;
    location?: string;
    date: string;
}) => api.post(`/api/communities/${communityId}/calendar/personal`, data);

//Editar evento personal
export const updatePersonalEvent = (communityId: string, eventId: number, data: {
    title?: string;
    time?: string;
    date?: string;
}) => api.patch(`/api/communities/${communityId}/calendar/personal/${eventId}`, data);

//Eliminar evento personal
export const deletePersonalEvent = (communityId: string, eventId: number) =>
    api.delete(`/api/communities/${communityId}/calendar/personal/${eventId}`);
