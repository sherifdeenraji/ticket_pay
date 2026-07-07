"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Driver {
    id: number;
    name: string;
    driver_code: string;
    phone_number: string;
    vehicle_type: 'bus' | 'keke';
    vehicle_number: string;
    route?: string;
}

export interface DashboardPayment {
    id: number;
    amount: number;
    student_name: string;
    matric_number: string;
    status: string;
    created_at: string;
    [key: string]: unknown;
}

export interface DashboardSummary {
    total_earnings: number;
    today_earnings: number;
    total_trips: number;
    today_trips: number;
    [key: string]: unknown;
}

export interface DashboardData {
    today_payments: DashboardPayment[];
    summary: DashboardSummary;
}

export interface DriverAuthContextType {
    driver: Driver | null;
    loading: boolean;
    dashboardData: DashboardData | null;
    login: (identifier: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    refreshDriver: (showLoading?: boolean) => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export function DriverAuthProvider({ children }: { children: React.ReactNode }) {
    const [driver, setDriver] = useState<Driver | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshDriver = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const response = await api.get('/drivers/me/dashboard');
            const data = response.data;

            if (data.success && data.driver) {
                setDriver(data.driver);
                setDashboardData({
                    today_payments: data.today_payments ?? [],
                    summary: data.summary ?? {},
                });
            } else {
                setDriver(null);
                setDashboardData(null);
            }
        } catch {
            setDriver(null);
            setDashboardData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshDriver();
    }, [refreshDriver]);

    const login = async (identifier: string, password: string) => {
        const response = await api.post('/drivers/login', { identifier, password });
        // After a successful login, sync auth state from the dashboard endpoint
        await refreshDriver();
        return response;
    };

    const logout = async () => {
        try {
            await api.post('/drivers/logout');
        } finally {
            setDriver(null);
            setDashboardData(null);
            window.location.href = '/driver/login';
        }
    };

    return (
        <DriverAuthContext.Provider
            value={{ driver, loading, dashboardData, login, logout, refreshDriver }}
        >
            {children}
        </DriverAuthContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useDriverAuth = () => {
    const context = useContext(DriverAuthContext);
    if (!context) {
        throw new Error('useDriverAuth must be used within a DriverAuthProvider');
    }
    return context;
};
