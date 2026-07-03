'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/stats-card';
import { Users, Truck, Banknote, Ticket, ArrowUpRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface Stats {
  totalUsers: number;
  activeDrivers: number;
  todayRevenue: number;
  todayTickets: number;
}

interface WeeklyPerformance {
  day: string;
  revenue: number;
  tickets: number;
}

interface RecentTransaction {
  name: string;
  action: string;
  driver: string;
  amount: string;
  time: string;
  type: 'credit' | 'debit';
}

interface ActiveDriver {
  name: string;
  code: string;
  rides: number;
  revenue: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeDrivers: 0,
    todayRevenue: 0,
    todayTickets: 0,
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyPerformance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [overviewRes, revenueRes, driversRes, paymentsRes] = await Promise.all([
          api.get('/reports/overview'),
          api.get('/reports/revenue?days=7'),
          api.get('/reports/drivers'),
          api.get('/admin/reports/payments'),
        ]);

        if (overviewRes.data.success) {
          const overview = overviewRes.data.data;
          setStats({
            totalUsers: Number(overview.total_users || 0),
            activeDrivers: Number(overview.total_drivers || 0),
            todayRevenue: Number(overview.total_revenue || 0),
            todayTickets: Number(overview.today_rides || 0),
          });
        }

        if (revenueRes.data.success) {
          const rev = revenueRes.data.data.map((item: any) => {
            const date = new Date(item.date);
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
            return {
              day: dayLabel,
              revenue: Number(item.revenue || 0),
              tickets: Number(item.rides || 0),
            };
          });
          setWeeklyData(rev);
        }

        if (driversRes.data.success) {
          const formattedDrivers = driversRes.data.data.slice(0, 5).map((item: any) => ({
            name: item.name,
            code: item.driver_code,
            rides: Number(item.total_rides || 0),
            revenue: `₦${Number(item.total_earned || 0).toLocaleString()}`,
          }));
          setActiveDrivers(formattedDrivers);
        }

        if (paymentsRes.data.success) {
          const formattedPayments = paymentsRes.data.data.slice(0, 6).map((item: any) => {
            const action = item.ticket_count 
              ? `Purchased ${item.ticket_count} ticket${item.ticket_count > 1 ? 's' : ''}` 
              : 'Funded wallet';
            const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              name: item.fullname || 'Student',
              action,
              driver: item.driver_code || '-',
              amount: `₦${Number(item.amount).toLocaleString()}`,
              time,
              type: 'debit', // Dashboard overview only lists ride payments from report/payments
            };
          });
          setRecentTransactions(formattedPayments);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-admin-primary" />
        <p className="text-slate-500 font-medium">Loading overview analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor your transport system performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard
          title="Total Students"
          value={stats.totalUsers.toLocaleString()}
          change="Real-time count"
          icon={<Users size={20} />}
          color="indigo"
        />
        <StatsCard
          title="Active Drivers"
          value={stats.activeDrivers.toString()}
          change="Registered transport operators"
          icon={<Truck size={20} />}
          color="emerald"
        />
        <StatsCard
          title="Total System Revenue"
          value={`₦${stats.todayRevenue.toLocaleString()}`}
          change="Accumulated rides payments"
          icon={<Banknote size={20} />}
          color="amber"
        />
        <StatsCard
          title="Today's Rides"
          value={stats.todayTickets.toLocaleString()}
          change="Rides completed today"
          icon={<Ticket size={20} />}
          color="cyan"
        />
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Weekly Performance</h2>
            <p className="text-sm text-slate-500 mt-0.5">Revenue and tickets sold over the past 7 days</p>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Revenue (₦)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Rides</span>
          </div>
        </div>
        <div className="card-body">
          {weeklyData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No transaction data recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                  }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" name="Revenue (₦)" />
                <Area yAxisId="right" type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={2.5} fill="url(#colorTickets)" name="Rides completed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest ride payments activity</p>
            </div>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No recent rides paid</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-indigo-50 text-indigo-600">
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tx.name}</p>
                      <p className="text-xs text-slate-500">{tx.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      -{tx.amount}
                    </p>
                    <p className="text-[11px] text-slate-400">{tx.time} (Code: {tx.driver})</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Drivers */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Drivers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by revenue completed</p>
            </div>
          </div>
          {activeDrivers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No driver metrics recorded</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeDrivers.map((driver, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-bold text-slate-600">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{driver.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 font-mono">{driver.code}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{driver.revenue}</p>
                    <p className="text-[11px] text-slate-400">{driver.rides} rides completed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
