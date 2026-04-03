import api from './api';

//Consultar perfil completo
export const getFullProfile = () => 
    api.get('/api/users/me');

//Editar información del perfil
export const updateProfile = (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
}) => api.patch('/api/users/me', data);

//Cambiar imagen de  perfil
export const updateAvatar = (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put('/api/users/me/avatar', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    });
};

//Eliminar imagen de perfil
export const deleteAvatar = () =>
    api.delete('/api/users/me/avatar');

//Eliminar cuenta
export const deleteAccount = (email: string, confirmationText: string) =>
    api.delete('/api/users/me', {data: {email, confirmationText}});
