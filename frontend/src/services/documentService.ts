import api from './api';

export interface DocItem {
    id: string;
    name: string;
    description?: string;
    type: 'file' | 'folder';
    parentId: string | null;
    url?: string;
    createdAt: string;
}

//Listar documentos y carpetas
export const getDocuments = (communityId: string) =>
    api.get(`/api/communities/${communityId}/documents`);

//Crear carpeta
export const createFolder = (communityId: string, data: {name: string}) => 
    api.post(`/api/communities/${communityId}/documents/folders`, data);

//Subir documentos
export const uploadDocument = (communityId: string, data: {name: string, description?: string; folderId?: string; file: File}) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if(data.description) formData.append('description', data.description);
    if(data.folderId) formData.append('folderId', data.folderId);
    formData.append('file', data.file);
    return api.post(`/api/communities/${communityId}/documents`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    });
};

//Editar nombre de documento o carpeta
export const updateDocument = (communityId: string, docId: string, data: {name: string}) =>
    api.patch(`/api/communities/${communityId}/documents/${docId}`, data);

//Eliminar documento o carpeta
export const deleteDocument = (communityId: string, docId: string) =>
    api.delete(`/api/communities/${communityId}/documents/${docId}`);