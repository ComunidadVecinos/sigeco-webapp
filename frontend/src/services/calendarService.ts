//Servicios de calendario: eventos del mes y CRUD de eventos personales
import api from './api';
import { businessFormToUtcIso, getBusinessDateKeyFromUtcIso, utcIsoToBusinessForm } from '@/lib/businessDateTime';

export type CalendarEventDto = {
    id: string;
    title: string;
    type: 'PERSONAL' | 'NEWS' | 'RESERVATION' | 'VOTING';
    date: string;
    startTime: string;
    endTime: string;
};

//Transforma un evento del backend al DTO local con fechas en zona de negocio
function mapCalendarEvent(event: any): CalendarEventDto {
    const start = event.startsAt ? utcIsoToBusinessForm(event.startsAt) : null;
    const end = event.endsAt ? utcIsoToBusinessForm(event.endsAt) : null;
    return {
        id: event.id,
        title: event.title,
        type: event.type,
        date: event.startsAt ? getBusinessDateKeyFromUtcIso(event.startsAt) : '',
        startTime: start?.time || '',
        endTime: end?.time || ''
    };
}

//Obtener todos los eventos visibles del mes
export const getCalendarEvents = (communityId: string, filters: {
    month: string;
}) => api.get(`/api/communities/${communityId}/calendar`, { params: filters }).then((res: any) => ({
    ...res,
    data: { ...res.data, content: (res.data.content || []).map(mapCalendarEvent) }
}));

//Crear evento personal
export const createPersonalEvent = (communityId: string, data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
}) => api.post(`/api/communities/${communityId}/calendar/personal`, {
    title: data.title,
    startsAt: businessFormToUtcIso(data.date, data.startTime),
    endsAt: businessFormToUtcIso(data.date, data.endTime)
}).then((res: any) => ({ ...res, data: mapCalendarEvent(res.data) }));

//Editar evento personal
export const updatePersonalEvent = (communityId: string, eventId: string, data: {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
}) => {
    const startsAt = data.date && data.startTime ? businessFormToUtcIso(data.date, data.startTime) : undefined;
    const endsAt = data.date && data.endTime ? businessFormToUtcIso(data.date, data.endTime) : undefined;

    return api.patch(`/api/communities/${communityId}/calendar/personal/${eventId}`, {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt ? { endsAt } : {})
    }).then((res: any) => ({ ...res, data: mapCalendarEvent(res.data) }));
};

//Eliminar evento personal
export const deletePersonalEvent = (communityId: string, eventId: string) =>
    api.delete(`/api/communities/${communityId}/calendar/personal/${eventId}`);
