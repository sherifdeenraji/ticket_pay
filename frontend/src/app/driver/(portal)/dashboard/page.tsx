'use client';

import { useEffect, useState } from 'react';
import { useDriverAuth } from '@/hooks/useDriverAuth';
import { 
  RefreshCw, 
  Banknote, 
  Ticket, 
  Receipt, 
  Bus, 
  MapPin, 
  Clock, 
  LogOut 
} from 'lucide-react';
import { format } from 'date-fns';

export default function DriverDashboardPage() {
  const { driver, dashboardData, refreshDriver, logout } = useDriverAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshDriver();
      setLastRefreshed(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshDriver]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDriver();
      setLastRefreshed(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  // If loading or data isn't ready, show skeleton
  if (!driver || !dashboardData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Welcome Section Skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-secondary rounded" />
          <div className="h-8 w-64 bg-secondary rounded" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-secondary rounded-2xl" />
          <div className="h-32 bg-secondary rounded-2xl" />
        </div>

        {/* Payments List Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-40 bg-secondary rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { summary, today_payments } = dashboardData;

  // Determine appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome & Info Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{getGreeting()},</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{driver.name}</h1>
            <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              {driver.driver_code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bus size={12} className="text-emerald-500" />
              {driver.vehicle_type === 'bus' ? 'Shuttle Bus' : 'Tricycle (Keke)'} &middot; {driver.vehicle_number}
            </span>
            {driver.route && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-emerald-500" />
                {driver.route}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border bg-card/50 hover:bg-card text-sm font-semibold transition-all duration-200"
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
          <span>Refresh</span>
        </button>
      </section>

      {/* Revenue & Tickets Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Revenue */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg border border-emerald-400/25">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 flex items-center gap-1.5">
              <Banknote size={14} />
              Today&apos;s Revenue
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-light opacity-80">₦</span>
              <span className="text-4xl font-extrabold tracking-tight">
                {Number(summary.total_amount || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs opacity-75">Earned from digital payments today</p>
          </div>
        </div>

        {/* Today's Tickets */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 text-white shadow-lg border border-teal-500/25">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 flex items-center gap-1.5">
              <Ticket size={14} />
              Today&apos;s Tickets
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {Number(summary.total_tickets || 0)}
              </span>
            </div>
            <p className="text-xs opacity-75">Total tickets scanned today</p>
          </div>
        </div>
      </section>

      {/* Transaction History Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Receipt size={16} className="text-emerald-500" />
            Today&apos;s Transactions
          </h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} />
            Refreshed: {format(lastRefreshed, 'h:mm:ss a')}
          </span>
        </div>

        <div className="space-y-2">
          {today_payments.length === 0 ? (
            <div className="glass rounded-2xl py-12 text-center border-dashed border-2 border-border">
              <Receipt size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No payments received today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Payments will appear here in real-time as students pay</p>
            </div>
          ) : (
            today_payments.map((payment: any, index: number) => (
              <div 
                key={payment.id || index} 
                className="glass premium-card flex items-center justify-between p-4 border border-border/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{payment.student_name || 'Student'}</h3>
                    <p className="text-xs text-muted-foreground">
                      ₦{Number(payment.amount).toLocaleString()} &middot; {format(new Date(payment.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/25 px-2.5 py-1 rounded-xl text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  <Ticket size={12} />
                  <span>{payment.ticket_count} Ticket{payment.ticket_count > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Auto-refresh timer footer */}
      <div className="text-center text-xs text-muted-foreground/60 pt-4">
        <p>Auto-refreshes every 30 seconds • Powered by TicketPay</p>
      </div>
    </div>
  );
}
