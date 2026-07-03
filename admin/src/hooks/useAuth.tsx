'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

export interface Admin {
    id: number;
    username: string;
    created_at: string;
}

interface AuthContextType {
    admin: Admin | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAdmin: (showLoading?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAdmin = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const response = await api.get('/admin/me');
            if (response.data.success) {
                setAdmin(response.data.data);
            } else {
                setAdmin(null);
            }
        } catch (error) {
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshAdmin();
    }, [refreshAdmin]);

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            console.log('Attempting login with username:', username);
            const response = await api.post('/admin/login', { username, password });
            if (response.data.success) {
                // Fetch admin user data
                await refreshAdmin(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/admin/logout');
        } finally {
            setAdmin(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ admin, loading, login, logout, refreshAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
