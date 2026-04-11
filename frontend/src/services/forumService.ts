import api from './api';

export type Category = 'question' | 'poll' | 'announcement' | 'request';

//Listar publicaciones
export const getPosts = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    category?: Category;
    from?: string;
    to?: string;
    sortBy?: 'createdAt' | 'likes' | 'lastActivityAt';
}) => api.get(`/api/communities/${communityId}/forum/posts`, {params: filters});

//Detalle de una publicacion
export const getPostDetail = (communityId: string, postId: string) =>
    api.get(`/api/communities/${communityId}/forum/posts/${postId}`);

//Crear publicacion
export const createPost = (communityId: string, data: {
    title: string;
    description: string;
    category: Category;
    poll?: {
        title: string;
        description?: string;
        endsAt?: string;
        options: {title: string}[];
    };
}) => api.post(`/api/communities/${communityId}/forum/posts`, data);

//Editar publicacion
export const updatePost = (communityId: string, postId: string, data: {
    title?: string;
    description?: string;
}) => api.patch(`/api/communities/${communityId}/forum/posts/${postId}`, data);

//Eliminar publicacion
export const deletePost = (communityId: string, postId: string) =>
    api.delete(`/api/communities/${communityId}/forum/posts/${postId}`);

//Dar/quitar like
export const toggleLike = (communityId: string, postId: string) =>
    api.post(`/api/communities/${communityId}/forum/posts/${postId}/likes/toggle`);

//Dar/quitar like en comentario
export const toggleCommentLike = (communityId: string, commentId: string) =>
    api.post(`/api/communities/${communityId}/forum/comments/${commentId}/likes/toggle`);

//Listar comentarios
export const getComments = (communityId: string, postId: string, filters: {
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'likes';
}) => api.get(`/api/communities/${communityId}/forum/posts/${postId}/comments`, {params: filters});

//Añadir comentario
export const addComment = (communityId: string, postId: string, data: {
    content: string;
}) => api.post(`/api/communities/${communityId}/forum/posts/${postId}/comments`, data);

//Editar comentario
export const updateComment = (communityId: string, commentId: string, data: {
    content: string;
}) => api.patch(`/api/communities/${communityId}/forum/comments/${commentId}`, data);

//Eliminar comentario
export const deleteComment = (communityId: string, commentId: string) =>
    api.delete(`/api/communities/${communityId}/forum/comments/${commentId}`);

//Votar en encuesta
export const votePoll = (communityId: string, pollId: string, data: {
    optionId: string;
}) => api.post(`/api/communities/${communityId}/forum/polls/${pollId}/vote`, data);

//Pin/unpin
export const pinPost = (communityId: string, postId: string) =>
    api.post(`/api/communities/${communityId}/forum/posts/${postId}/pin`);

export const unpinPost = (communityId: string, postId: string) =>
    api.post(`/api/communities/${communityId}/forum/posts/${postId}/unpin`);