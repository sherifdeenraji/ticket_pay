'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Check, CreditCard } from 'lucide-react';

export default function CompleteProfilePage() {
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const phone_number = formData.get('phone');

    try {
      await api.post('/auth/complete-profile', { phone_number});
      await refreshUser();
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setError(err.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Complete Your <span className="text-primary">Profile</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Provide your phone number to generate a secure virtual account for instant wallet funding.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium px-1 block">
                Phone Number
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="e.g. +2348012345678"
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 text-base"
                />
                <Phone className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base mt-2 rounded-2xl"
              isLoading={isLoading}
            >
              Generate Virtual Account
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground max-w-xs mx-auto">
          By completing your profile, you will automatically be assigned an account details card for easy bank transfer deposits.
        </p>
      </div>
    </div>
  );
}