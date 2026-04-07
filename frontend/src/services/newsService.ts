import api from './api';
import { businessFormToUtcIso, utcIsoToBusinessForm } from '@/lib/businessDateTime';

function mapNewsItem(item: any) {
    const start = item.eventStartsAt ? utcIsoToBusinessForm(item.eventStartsAt) : null;
    const end = item.eventEndsAt ? utcIsoToBusinessForm(item.eventEndsAt) : null;

    return {
        id: item.id,
        title: item.title,
        content: item.description,
        createdAt: item.createdAt,
        editedAt: item.editedAt || null,
        authorAlias: item.creator?.alias || null,
        isEvent: item.isEvent,
        eventStartDate: start?.date || '',
        eventStartTime: start?.time || '',
        eventEndDate: end?.date || '',
        eventEndTime: end?.time || '',
        imageUrl: item.imageUrl || ''
    };
}

function buildNewsPayload(data: {
    title?: string;
    content?: string;
    isEvent?: boolean;
    eventStartDate?: string;
    eventStartTime?: string;
    eventEndDate?: string;
    eventEndTime?: string;
    imageFile?: File | null;
}, isUpdate = false) {
    const shouldClearEvent = isUpdate && data.isEvent === false;
    const eventStartsAt = data.isEvent && data.eventStartDate && data.eventStartTime
        ? businessFormToUtcIso(data.eventStartDate, data.eventStartTime)
        : (shouldClearEvent ? null : undefined);
    const eventEndsAt = data.isEvent && data.eventEndDate && data.eventEndTime
        ? businessFormToUtcIso(data.eventEndDate, data.eventEndTime)
        : (isUpdate && data.isEvent ? undefined : (shouldClearEvent ? null : undefined));
    const hasFile = data.imageFile instanceof File;
    const needsJsonPayload = !hasFile;

    if (needsJsonPayload) {
        return {
            title: data.title,
            description: data.content,
            ...(eventStartsAt !== undefined ? { eventStartsAt } : {}),
            ...(eventEndsAt !== undefined ? { eventEndsAt } : {})
        };
    }

    const body = new FormData();

    if (data.title !== undefined) {
        body.append('title', data.title);
    }

    if (data.content !== undefined) {
        body.append('description', data.content);
    }

    if (eventStartsAt) {
        body.append('eventStartsAt', eventStartsAt);
    }

    if (eventStartsAt === null) {
        body.append('eventStartsAt', 'null');
    }

    if (eventEndsAt) {
        body.append('eventEndsAt', eventEndsAt);
    }

    if (eventEndsAt === null) {
        body.append('eventEndsAt', 'null');
    }

    body.append('image', data.imageFile as File);
    return body;
}

//Listar noticias
export const getNews = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    eventType?: 'all' | 'event' | 'nonEvent';
}) => (
    api.get(`/api/communities/${communityId}/news`, {
        params: {
            page: (filters.page ?? 0) + 1,
            pageSize: filters.pageSize,
            search: filters.search,
            from: filters.startDate,
            to: filters.endDate,
            eventType: filters.eventType || 'all'
        }
    }).then((res: any) => ({
        ...res,
        data: {
            content: (res.data.items || []).map(mapNewsItem),
            last: !res.data.pagination || res.data.pagination.page >= res.data.pagination.totalPages
        }
    }))
);

//Crear noticia
export const createNews = (communityId: string, data: {
    title: string;
    content: string;
    isEvent?: boolean;
    eventStartDate?: string;
    eventStartTime?: string;
    eventEndDate?: string;
    eventEndTime?: string;
    imageFile?: File | null;
}) => api.post(`/api/communities/${communityId}/news`, buildNewsPayload(data));

//Editar noticia
export const updateNews = (communityId: string, newsId: string, data: {
    title?: string;
    content?: string;
    isEvent?: boolean;
    eventStartDate?: string;
    eventStartTime?: string;
    eventEndDate?: string;
    eventEndTime?: string;
    imageFile?: File | null;
}) => api.patch(`/api/communities/${communityId}/news/${newsId}`, buildNewsPayload(data, true));

//Eliminar noticia
export const deleteNews = (communityId: string, newsId: string) =>
    api.delete(`/api/communities/${communityId}/news/${newsId}`);
