// Contexto global de autenticación: gestiona el estado del usuario, login, logout y refresco de sesión
import React, {createContext, useContext, useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {login as loginService, logout as logoutService} from '../services/authServices';
import { getFullProfile } from '../services/userServices';
import { SESSION_EXPIRED_EVENT } from '../services/api';

//Datos del usuario en una comunidad
interface UserCommunity {
    membershipId: string;
    communityId: string;
    name: string;
    address: string | null;
    province: string | null;
    municipality: string | null;
    memberSince: string | null;
    role: string;
    alias?: string | null;
    suspensionActive?: boolean;
    suspensionUntil?: string | null;
}

//Datos del usuario
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImageUrl?: string | null;
    communities?: UserCommunity[];
    activeCommunityId?: string | null;
}

//Estado y acciones disponibles para los usuarios
interface AuthContextType{
    user: User | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

//Rutas que no requieren autenticación
const PUBLIC_PATHS = new Set(['/', '/access', '/auth/login', '/auth/register', '/auth/reset-password']);

export const AuthProvider: React.FC<{children: React.ReactNode }> = ({children}) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    //Limpia el estado de la sesión y redirige a la landing si es una ruta protegida
    const clearAuthState = (redirectToLanding = false) => {
        setUser(null);
        setLoading(false);

        if (redirectToLanding && typeof window !== 'undefined' && !PUBLIC_PATHS.has(window.location.pathname)) {
            navigate('/', { replace: true });
        }
    };

    //Recarga el perfil del usuario desde el backend
    const refreshUser = async (): Promise<User | null> => {
        try{
            const {data} = await getFullProfile();
            const nextUser = data as User;
            setUser(nextUser);
            return nextUser;
        } catch (error: any) {
            if (error?.response?.status === 401) {
                clearAuthState(true);
                return null;
            }

            return user;
        } finally {
            setLoading(false);
        }
    };

    //Al montar el provider, intenta recuperar la sesión activa
    useEffect(() => {
        refreshUser().catch(() => {
            setLoading(false);
        });
    }, []);

    //Escucha el evento de sesión expirada
    useEffect(() => {
        const handleSessionExpired = () => {
            clearAuthState(true);
        };

        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => {
            window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        };
    }, [navigate]);

    //Inicia sesión y carga el perfil del usuario
    const login = async (identifier: string, password: string) => {
        await loginService(identifier, password);
        const refreshedUser = await refreshUser();

        if (!refreshedUser) {
            throw new Error('No se ha podido cargar la sesión');
        }
    };

    //Cierra sesión en el backend y limpia el estado local
    const logout = async () =>{
        try {
            await logoutService();
        } catch (error: any) {
            if (error?.response?.status !== 401) {
                throw error;
            }
        } finally {
            clearAuthState(true);
        }
    };

    return (
        <AuthContext.Provider value={{user, loading, login, logout, refreshUser}}>
            {children}
        </AuthContext.Provider>
    );
};

//Hook para acceder al contexto de autenticación desde cualquier componente
export const useAuth = () =>{
    const context = useContext(AuthContext);
    if(!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};
