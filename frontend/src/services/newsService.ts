import api from './api';

//Listar noticias
export const getNews = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
}) => api.get(`/api/communities/${communityId}/news`, {params: filters});

//Crear noticia
export const createNews = (communityId: string, data: {
    title: string;
    content: string; 
}) => api.post(`/api/communities/${communityId}/news`, data);

//Editar noticia
export const updateNews = (communityId: string, newsId: number, data: {
    title?: string;
    content?: string;
}) => api.patch(`/api/communities/${communityId}/news/${newsId}`, data);

//Eliminar noticia
export const deleteNews = (communityId: string, newsId: number) =>
    api.delete(`/api/communities/${communityId}/news/${newsId}`);
