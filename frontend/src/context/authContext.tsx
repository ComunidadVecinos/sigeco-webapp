import React, {createContext, useContext, useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {login as loginService, logout as logoutService} from '../services/authServices';
import { getFullProfile } from '../services/userServices';
import { SESSION_EXPIRED_EVENT } from '../services/api';

interface UserCommunity {
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

interface AuthContextType{
    user: User | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = new Set(['/', '/access', '/auth/login', '/auth/register', '/auth/reset-password']);

export const AuthProvider: React.FC<{children: React.ReactNode }> = ({children}) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const clearAuthState = (redirectToLanding = false) => {
        setUser(null);
        setLoading(false);

        if (redirectToLanding && typeof window !== 'undefined' && !PUBLIC_PATHS.has(window.location.pathname)) {
            navigate('/', { replace: true });
        }
    };

    const refreshUser = async (): Promise<User | null> => {
        try{
            const {data} = await getFullProfile();
            const nextUser = data as User;
            setUser(nextUser);
            return nextUser;
        } catch {
            clearAuthState(true);
            return null;
        } finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    useEffect(() => {
        const handleSessionExpired = () => {
            clearAuthState(true);
        };

        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => {
            window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        };
    }, [navigate]);

    const login = async (identifier: string, password: string) => {
        await loginService(identifier, password);
        await refreshUser();
    };

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

export const useAuth = () =>{
    const context = useContext(AuthContext);
    if(!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};
