//Servicios de autenticación: registro, login, logout y gestión de contraseña
import api from './api';

//Registrar a un usuario
export const register = (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    phone?: string,
) => api.post('/api/auth/registrations', {firstName, lastName, email, phone, password, passwordConfirmation});

//Iniciar sesion
export const login = (identifier: string, password: string) =>
    api.post('/api/auth/sessions', {identifier, password});

//Recuperar contraseña
export const resetPassword = (email: string) =>
    api.post('/api/auth/password/reset', {email});

//Cambiar contraseña
export const changePassword = (currentPassword: string, newPassword: string, newPasswordConfirmation: string) =>
    api.post('/api/auth/password/change', {currentPassword, newPassword, newPasswordConfirmation});

//Cerrar sesion
export const logout = () =>
    api.delete('/api/auth/sessions/current');
