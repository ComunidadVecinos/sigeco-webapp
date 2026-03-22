import api from './api';

//Obtener todos los eventos (tanto de la comunidad como personales)
export const getCalendarEvents = (communityId: number, filters?: {
    startDate?: string;
    endDate?: string;
}) => api.get(`/api/communities/${communityId}/calendar`, {params: filters});

//Crear evento personal
export const createPersonalEvent = (communityId: number, data: {
    title: string;
    time: string;
    location?: string;
    date: string;
}) => api.post(`/api/communities/${communityId}/calendar/personal`, data);

//Eliminar evento personal
export const deletePersonalEvent = (communityId: number, eventId: number) =>
    api.delete(`/api/communities/${communityId}/calendar/personal/${eventId}`);