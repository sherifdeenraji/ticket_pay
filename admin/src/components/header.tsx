'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { admin } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Admin Dashboard</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5 w-64 group focus-within:ring-2 focus-within:ring-admin-primary/20 focus-within:border-admin-primary transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent text-sm placeholder:text-slate-400 focus:outline-none w-full"
            />
          </div>
          {/* Notification bell */}
          <button className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          {/* Admin avatar */}
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-transform">
            {admin?.username ? admin.username[0].toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
