import React, {createContext, useContext, useState, useEffect} from 'react';
import {getProfile, login as loginService, logout as logoutService} from '../services/authServices';

interface User {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo?: string;
    communities?: any[];
}

interface AuthContextType{
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode }> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try{
            const {data} = await getProfile();
            setUser(data);
        } catch {
            setUser(null);
        } finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (email: string, password: string) => {
        const {data} = await loginService(email, password);
        setUser(data);
    };

    const logout = async () =>{
        await logoutService();
        setUser(null);
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