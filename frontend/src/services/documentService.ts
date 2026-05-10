//Servicios de documentos: CRUD de archivos y carpetas y drag and drop
import api from './api';

export interface DocItem {
    id: string;
    name: string;
    description?: string;
    type: 'file' | 'folder';
    parentId: string | null;
    url?: string;
    sizeBytes?: number,
    createdAt: string;
};

//Listar documentos y carpetas
export const getDocuments = (communityId: string, parentId?: string) =>{
    const query = parentId ? `?parentId=${parentId}` : '';
    return api.get(`/api/communities/${communityId}/documents${query}`);

};
//Crear carpeta
export const createFolder = (communityId: string, data: {name: string, parentId?: string}) => 
    api.post(`/api/communities/${communityId}/documents/folders`, data);

//Subir documentos
export const uploadDocument = (communityId: string, data: {name: string, description?: string; folderId?: string; file: File}) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if(data.description) formData.append('description', data.description);
    if(data.folderId) formData.append('folderId', data.folderId);
    formData.append('file', data.file);
    return api.post(`/api/communities/${communityId}/documents/files`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    });
};

//Editar nombre de documento o carpeta
export const updateDocument = (communityId: string, docId: string, type: string, data: any) =>{
    const route = type === 'folder' ? 'folders' : 'files';
    return api.patch(`/api/communities/${communityId}/documents/${route}/${docId}`, data);
};

//Eliminar documento o carpeta
export const deleteDocument = (communityId: string, docId: string, type: string) => {
    const route = type === 'folder' ? 'folders' : 'files';
    return api.delete(`/api/communities/${communityId}/documents/${route}/${docId}`);
};

//Mover documento o carpeta
export const moveItem = (communityId: string, data: {itemId: string; itemType: 'folder' | 'file'; targetFolderId: string | null}) =>
    api.patch(`/api/communities/${communityId}/documents/move`, data);