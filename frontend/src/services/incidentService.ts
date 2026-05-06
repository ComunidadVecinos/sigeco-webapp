import api from './api';

export type IncidentStatus = 'pending' | 'inProgress' | 'resolved' | 'cancelled';

export interface IncidentAuthor {
    alias: string | null;
    membershipId: string | null;
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    status: IncidentStatus;
    imageUrl: string | null;
    author: IncidentAuthor;
    createdAt: string;
    editedAt: string | null;
}

export interface IncidentSummary{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
}

export interface IncidentPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface IncidentListResponse {
    items: Incident[];
    pagination: IncidentPagination;
    summary: IncidentSummary;
}

function buildIncidentPayload(data: {
    title?: string;
    description?: string;
    imageFile?: File | null;
}, isUpdate = false){
    const hasFile = data.imageFile instanceof File;

    if(!hasFile) {
        const body: Record<string, string> = {};
        if(data.title !== undefined) body.title = data.title;
        if(data.description !== undefined) body.description = data.description;
        return body;
    }

    const body = new FormData();
    if(data.title !== undefined) body.append('title', data.title);
    if(data.description !== undefined) body.append('description', data.description);
    body.append('image', data.imageFile as File);
    return body;
}

//listar incidencias con filtros
export const getIncidents = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    status?: string;
}) => api.get<IncidentListResponse>(`/api/communities/${communityId}/incidents`, {
    params: {
        page: (filters.page ?? 0) + 1,
        pageSize: filters.pageSize ?? 10,
        status: filters.status || 'open'
    }
}).then((res) => ({
    ...res,
    data: {
        items: res.data.items || [],
        pagination: res.data.pagination,
        summary: res.data.summary,
        last: !res.data.pagination || res.data.pagination.page >= res.data.pagination.totalPages
    }
}));

//detalle de la incidencia
export const getIncidentDetail = (communityId: string, incidentId: string) => 
    api.get<Incident>(`/api/communities/${communityId}/incidents/${incidentId}`);

//crear incidencia
export const createIncident = (communityId: string, data: {
    title: string;
    description: string;
    imageFile?: File | null;
}) => api.post(`/api/communities/${communityId}/incidents`, buildIncidentPayload(data));

//editar incidencia
export const updateIncident = (communityId: string, incidentId: string, data: {
    title: string;
    description: string;
    imageFile?: File | null;
}) => api.patch(`/api/communities/${communityId}/incidents/${incidentId}`, buildIncidentPayload(data, true));

//eliminar incidencia
export const deleteIncident = (communityId: string, incidentId: string) =>
    api.delete(`/api/communities/${communityId}/incidents/${incidentId}`);

//elimianr solo imagen de la incidencia
export const deleteIncidentImage = (communityId: string, incidentId: string) => 
    api.delete(`/api/communities/${communityId}/incidents/${incidentId}/image`);

//cambiar estado de incidencia
export const updateIncidentStatus = (communityId: string, incidentId: string, data: {
    status: 'inProgress' | 'resolved' | 'cancelled';
}) => api.post(`/api/communities/${communityId}/incidents/${incidentId}/status`, data);
