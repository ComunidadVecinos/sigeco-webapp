import api from './api';

export type CalendarEventDto = {
    id: string;
    title: string;
    type: 'PERSONAL' | 'NEWS' | 'RESERVATION' | 'VOTING';
    date: string;
    startTime: string;
    endTime: string;
};

//Obtener todos los eventos visibles del mes
export const getCalendarEvents = (communityId: string, filters: {
    month: string;
}) => api.get(`/api/communities/${communityId}/calendar`, {params: filters});

//Crear evento personal
export const createPersonalEvent = (communityId: string, data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
}) => api.post(`/api/communities/${communityId}/calendar/personal`, data);

//Editar evento personal
export const updatePersonalEvent = (communityId: string, eventId: string, data: {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
}) => api.patch(`/api/communities/${communityId}/calendar/personal/${eventId}`, data);

//Eliminar evento personal
export const deletePersonalEvent = (communityId: string, eventId: string) =>
    api.delete(`/api/communities/${communityId}/calendar/personal/${eventId}`);
