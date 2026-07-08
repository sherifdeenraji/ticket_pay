'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      router.push('/dashboard');
    }
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-5">
            <Ticket className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Admin <span className="text-indigo-600">Console</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Sign in to manage the OAU transit system
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 text-base disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-xs text-slate-500">
          © 2026 TicketPay OAU. All rights reserved.
        </p>
      </div>
    </div>
  );
}
