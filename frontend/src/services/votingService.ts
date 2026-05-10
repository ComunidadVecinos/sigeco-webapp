//Servicios de votaciones: listado, creación, emisión de voto y cierre
import api from './api';

//Listar votaciones
export const getVotings = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    status?: 'open' | 'closed';
}) => api.get(`/api/communities/${communityId}/voting`, { params: filters });

//Crear votacion
export const createVoting = (communityId: string, data: {
    title: string;
    description?: string;
    endsAt: string;
    options: { title: string }[];
}) => api.post(`/api/communities/${communityId}/voting`, data);

//Emitit voto
export const voteOnVoting = (communityId: string, votingId: string, data: {
    optionId: string;
}) => api.post(`/api/communities/${communityId}/voting/${votingId}/vote`, data);

//Cerrar votacion manualmente
export const closeVoting = (communityId: string, votingId: string) =>
    api.post(`/api/communities/${communityId}/voting/${votingId}/close`);

//Eliminar votacion
export const deleteVoting = (communityId: string, votingId: string) =>
    api.delete(`/api/communities/${communityId}/voting/${votingId}`);