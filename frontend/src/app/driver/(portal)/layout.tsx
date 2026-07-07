'use client';

import { DriverAuthProvider, useDriverAuth } from '@/hooks/useDriverAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  LayoutDashboard,
  MessageSquareWarning,
  LogOut,
  User,
} from 'lucide-react';

const navLinks = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/disputes', label: 'Disputes', icon: MessageSquareWarning },
];

function DriverPortalShell({ children }: { children: React.ReactNode }) {
  const { driver, loading, logout } = useDriverAuth();
  const pathname = usePathname();

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500" />
          <Truck className="absolute inset-0 m-auto h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading driver portal…
        </p>
      </div>
    );
  }

  // ── Redirect if unauthenticated ─────────────────────────────────
  if (!loading && !driver) {
    if (typeof window !== 'undefined') {
      window.location.href = '/driver/login';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="glass sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-emerald-200/40 dark:border-emerald-900/30 backdrop-blur-md">
        {/* Branding */}
        <Link href="/driver/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Driver<span className="text-emerald-500">Pay</span>
          </h1>
        </Link>

        {/* Right side – driver info + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 max-w-[140px] truncate">
              {driver?.name ?? 'Driver'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex flex-1">
        {/* ── Desktop Sidebar (hidden on mobile) ───────────────── */}
        <aside className="hidden md:flex flex-col w-56 p-5 space-y-1.5 h-[calc(100vh-65px)] sticky top-[65px]">
          <div className="px-3 py-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Navigation
            </p>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                {link.label}
              </Link>
            );
          })}

          {/* Sidebar footer – driver name on desktop */}
          <div className="mt-auto! pt-4 border-t border-border/40">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {driver?.name?.charAt(0)?.toUpperCase() ?? 'D'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{driver?.name ?? 'Driver'}</span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {driver?.vehicle_number ?? 'Driver Account'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ─────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop) ──────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-emerald-200/30 dark:border-emerald-900/30 px-6 py-2.5 flex items-center justify-around shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.1)]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DriverAuthProvider>
      <DriverPortalShell>{children}</DriverPortalShell>
    </DriverAuthProvider>
  );
}
