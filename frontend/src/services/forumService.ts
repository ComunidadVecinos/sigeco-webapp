import api from './api';

//Listar publicaciones
export const getPosts = (communityId: number, filters: {
    page?: number;
    pageSize?: number;
    category?: string;
}) => api.get(`/api/communities/${communityId}/forum/posts`, {params: filters});

//Crear publicacion
export const createPost = (communityId: number, data: {
    content: string;
    category: string;
    pollOptions?: string[];
}) => api.post(`/api/communities/${communityId}/forum/posts`, data);

//Editar publicacion
export const updatePost = (communityId: number, postId: number, data: {
    content: string;
}) => api.patch(`/api/communities/${communityId}/forum/posts/${postId}`, data);

//Eliminar publicacion
export const deletePost = (communityId: number, postId: number) =>
    api.delete(`/api/communities/${communityId}/forum/posts/${postId}`);

//Dar/quitar like
export const toggleLike = (communityId: number, postId: number) =>
    api.post(`/api/communities/${communityId}/forum/posts/${postId}/like`);

//Listar comentarios
export const getComments = (communityId: number, postId: number, filters: {
    page?: number;
    pageSize?: number;
}) => api.get(`/api/communities/${communityId}/forum/posts/${postId}/comments`, {params: filters});

//Añadir comentario
export const addComent = (communityId: number, postId: number, data: {
    content: string;
}) => api.post(`/api/communities/${communityId}/forum/posts/${postId}/comments`, data);

//Editar comentario
export const updateComment = (communityId: number, postId: number, commentId: number, data: {
    content: string;
}) => api.patch(`/api/communities/${communityId}/forum/posts/${postId}/comments/${commentId}`, data);

//Eliminar comentario
export const deleteComment = (communityId: number, postId: number, commentId: number) =>
    api.delete(`/api/communities/${communityId}/forum/posts/${postId}/comments/${commentId}`);

//Votar en encuesta
export const votePoll = (communityId: number, postId: number, data: {
    optionIndex: number;
}) => api.post(`/api/communities/${communityId}/forum/posts/${postId}/poll/vote`, data);