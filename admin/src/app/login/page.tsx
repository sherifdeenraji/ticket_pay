'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-admin-sidebar via-slate-900 to-indigo-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-admin-primary rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Ticket size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">TicketPay</h1>
              <p className="text-xs text-indigo-300 font-medium">Admin Console</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
                Manage OAU<br />
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  Transport System
                </span>
              </h2>
              <p className="text-lg text-slate-400 mt-6 max-w-md leading-relaxed">
                Complete control over drivers, students, payments, and operations — all in one powerful dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-md">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">2,450+</p>
                <p className="text-xs text-slate-400 mt-1">Students</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">87</p>
                <p className="text-xs text-slate-400 mt-1">Active Drivers</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">₦680K</p>
                <p className="text-xs text-slate-400 mt-1">Monthly Revenue</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">© 2026 TicketPay OAU. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-admin-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Ticket size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">TicketPay <span className="text-admin-primary">Admin</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Enter your credentials to access the admin dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
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
                <button type="button" className="text-xs text-admin-primary font-semibold hover:underline">
                  Forgot password?
                </button>
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

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-admin-primary focus:ring-admin-primary/20" />
              <label htmlFor="remember" className="text-sm text-slate-600">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 text-base disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <Shield size={16} className="text-admin-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">Demo Credentials</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Username: <span className="font-mono text-slate-700">admin</span><br />
                  Password: <span className="font-mono text-slate-700">adminpass</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
