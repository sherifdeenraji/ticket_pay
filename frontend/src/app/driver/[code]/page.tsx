'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';

interface DriverStats {
  driver_code: string;
  driver_name: string;
  vehicle_number: string;
  today_revenue: number;
  today_tickets: number;
  last_updated: string;
  recent_transactions: Array<{
    user_name: string;
    ticket_count: number;
    amount: number;
    time: string;
  }>;
}

export default function DriverPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const params = useParams();
  const code = params.code as string;

  console.log(stats)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatStats = (rawData: any): DriverStats => {
    return {
      driver_code: rawData.driver.code,
      driver_name: rawData.driver.name,
      vehicle_number: rawData.driver.vehicle_number,
      today_revenue: Number(rawData.summary.total_amount || 0),
      today_tickets: Number(rawData.summary.total_tickets || 0),
      last_updated: rawData.summary.last_updated,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recent_transactions: (rawData.today_payments || []).map((p: any) => ({
        user_name: p.student_name || 'Student',
        ticket_count: Number(p.ticket_count || 0),
        amount: Number(p.amount || 0),
        time: format(new Date(p.created_at), 'h:mm a')
      }))
    };
  };

  useEffect(() => {
    const fetchDriverStats = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/drivers/${code.toUpperCase()}`);
        setStats(formatStats(res.data.data));
        setError(null);
      } catch (err: unknown) {
        const errorMsg = (err as Error).message || 'Failed to load driver statistics';
        setError(errorMsg);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDriverStats();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [code]);

  const handleManualRefresh = async () => {
    try {
      const res = await api.get(`/drivers/${code.toUpperCase()}`);
      setStats(formatStats(res.data.data));
      setLastRefresh(new Date());
    } catch {
      console.error('Failed to refresh stats');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading driver statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Driver Not Found</h1>
          <p className="text-slate-600">{error || 'Unable to load driver statistics for this code.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{stats.driver_name}</h1>
              <p className="text-slate-600 mt-2 text-lg font-medium">{stats.driver_code}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={24} className="text-blue-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 font-medium">Vehicle Number</p>
              <p className="text-2xl font-bold text-slate-900">{stats.vehicle_number}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 font-medium">Last Updated</p>
              <p className="text-2xl font-bold text-slate-900">{format(new Date(stats.last_updated), 'h:mm a')}</p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Auto-refreshes every 30 seconds • Last manual refresh: {format(lastRefresh, 'h:mm a')}
          </div>
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-8 border-2 border-green-200">
            <p className="text-sm text-green-700 font-bold uppercase tracking-wide mb-2">Today&apos;s Revenue</p>
            <p className="text-5xl font-extrabold text-green-900">₦{stats.today_revenue.toLocaleString()}</p>
            <p className="text-green-700 mt-2 text-sm">Generated from ride payments</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-lg p-8 border-2 border-blue-200">
            <p className="text-sm text-blue-700 font-bold uppercase tracking-wide mb-2">Today&apos;s Tickets</p>
            <p className="text-5xl font-extrabold text-blue-900">{stats.today_tickets}</p>
            <p className="text-blue-700 mt-2 text-sm">Total tickets sold</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-slate-100 px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">Today&apos;s Transactions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Student Name</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Tickets</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-slate-900">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_transactions.length > 0 ? (
                  stats.recent_transactions.map((transaction, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{transaction.user_name}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">{transaction.ticket_count}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{transaction.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      No transactions today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              <span className="font-bold">Total Tickets Today:</span> {stats.today_tickets}
              <span className="ml-6 font-bold">Total Revenue Today:</span> ₦{stats.today_revenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          <p>This page automatically updates every 30 seconds</p>
          <p className="text-xs text-slate-500 mt-2">© 2024 TicketPay - OAU Digital Transport System</p>
        </div>
      </div>
    </div>
  );
}
