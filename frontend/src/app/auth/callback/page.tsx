"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            if (token) {
                // The token is already in the cookie set by the backend, 
                // but we could also store it in localStorage if needed.
                await refreshUser();
                router.replace('/dashboard');
            } else {
                router.replace('/login?error=no_token');
            }
        };
        handleCallback();
    }, [searchParams, router, refreshUser]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium animate-pulse">Synchronizing your digital identity...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
