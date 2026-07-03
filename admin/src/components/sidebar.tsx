'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Users, Truck, CreditCard, BarChart3, Settings, LogOut, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Drivers', href: '/dashboard/drivers', icon: Truck },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-5 left-5 z-50 p-2.5 bg-admin-primary text-white rounded-xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:sticky top-0 left-0 w-[272px] h-screen bg-admin-sidebar text-white transition-transform duration-300 ease-out z-40 flex flex-col`}
      >
        {/* Logo */}
        <div className="px-7 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-admin-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Ticket size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TicketPay</h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-slate-800" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 px-3 mb-3">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  active
                    ? 'bg-admin-primary text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-admin-sidebar-hover'
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 shrink-0 ${active ? '' : 'group-hover:scale-110'}`}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 pb-6 space-y-2">
          <div className="mx-1 h-px bg-slate-800 mb-3" />
          <div className="bg-slate-800/60 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-300 font-bold text-sm">
                {admin?.username ? admin.username.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{admin?.username || 'Admin User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{admin?.username ? `${admin.username}@ticketpay.com` : 'admin@ticketpay.com'}</p>
              </div>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
