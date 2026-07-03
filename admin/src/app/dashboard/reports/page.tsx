'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/api';

interface DailyTrendItem {
  date: string;
  tickets: number;
  revenue: number;
}

interface WeeklyTrendItem {
  week: string;
  revenue: number;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailyData, setDailyData] = useState<DailyTrendItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyTrendItem[]>([]);
  const [activeDriversCount, setActiveDriversCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Determine how many days of data we need based on report selection
      const days = reportType === 'daily' ? 7 : reportType === 'weekly' ? 28 : 90;
      
      const [revenueRes, overviewRes] = await Promise.all([
        api.get(`/reports/revenue?days=${days}`),
        api.get('/reports/overview'),
      ]);

      if (overviewRes.data.success) {
        setActiveDriversCount(Number(overviewRes.data.data.total_drivers || 0));
      }

      if (revenueRes.data.success) {
        const rawRevenue = revenueRes.data.data;
        const formattedDaily = rawRevenue.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tickets: Number(item.rides || 0),
          revenue: Number(item.revenue || 0),
        }));
        setDailyData(formattedDaily);

        if (reportType === 'weekly') {
          // Aggregate daily items in chunks of 7 days
          const weekly: WeeklyTrendItem[] = [];
          let weekRevenue = 0;
          let weekNum = 1;
          for (let i = 0; i < rawRevenue.length; i++) {
            weekRevenue += Number(rawRevenue[i].revenue || 0);
            if ((i + 1) % 7 === 0 || i === rawRevenue.length - 1) {
              weekly.push({
                week: `Week ${weekNum++}`,
                revenue: weekRevenue,
              });
              weekRevenue = 0;
            }
          }
          setWeeklyData(weekly);
        }
      }
    } catch (error) {
      console.error('Failed to load reports trend:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const totalTickets = dailyData.reduce((sum, d) => sum + d.tickets, 0);
  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
  const averageTransactionValue = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 100;

  const exportReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-admin-primary" />
        <p className="text-slate-500 font-medium">Loading system analytics reports...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Review operational breakdowns and financial performance logs</p>
        </div>
        <button onClick={exportReport} className="flex items-center gap-2 btn-primary hover:bg-indigo-700 cursor-pointer">
          <Download size={20} /> Export / Print Report
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        {(['daily', 'weekly', 'monthly'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              reportType === type
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
          <p className="text-slate-600 text-sm font-semibold">Total Tickets Sold</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalTickets.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">For selected timeframe</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
          <p className="text-slate-600 text-sm font-semibold">Total Revenue</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">₦{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Completed ride fares</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
          <p className="text-slate-600 text-sm font-semibold">Active Drivers</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{activeDriversCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Registered operators</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
          <p className="text-slate-600 text-sm font-semibold">Avg Transaction Value</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">₦{averageTransactionValue}</p>
          <p className="text-[10px] text-slate-400 mt-1">Standard ticket rate equivalent</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6 font-sans">Timeframe Breakdown</h2>
        {dailyData.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No transaction records available for this chart</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue (₦)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="tickets" stroke="#10b981" name="Tickets Sold" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {reportType === 'weekly' && weeklyData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-slate-900 mb-6 font-sans">Weekly Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₦)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
