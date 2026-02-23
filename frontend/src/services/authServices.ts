import api from './api';

//Registrar a un usuario
export const register = (firstName: string, lastName: string, email: string, phone: string, password: string) =>
    api.post('/api/auth/register', {firstName, lastName, email, phone, password});

//Iniciar sesion
export const login = (email: string, password: string) =>
    api.post('/api/auth/login', {email, password});

//Recuperar contraseña
export const resetPassword = (email: string) =>
    api.post('/api/auth/forgot-password', {email});

//Cambiar contraseña
export const changePassword = (currentPassword: string, newPassword: string, confirmNewPassword: string) =>
    api.post('/api/auth/change-password', {currentPassword, newPassword, confirmNewPassword});

//Cerrar sesion
export const logout = () =>
    api.post('/api/auth/logout');