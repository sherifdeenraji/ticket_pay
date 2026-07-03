'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Payment {
  id: string;
  type: 'wallet_funding' | 'ride_payment';
  userName: string;
  amount: number;
  driverName?: string;
  ticketCount?: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
  rawDate: Date;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'wallet_funding' | 'ride_payment'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        setLoading(true);
        const [ridesRes, fundingsRes] = await Promise.all([
          api.get('/admin/reports/payments'),
          api.get('/admin/users/wallet-fundings?limit=100'),
        ]);

        let formattedRides: Payment[] = [];
        let formattedFundings: Payment[] = [];

        if (ridesRes.data.success) {
          formattedRides = ridesRes.data.data.map((item: any) => ({
            id: item.transaction_id || `TX${item.id}`,
            type: 'ride_payment' as const,
            userName: item.fullname || `${item.firstname || ''} ${item.lastname || ''}`.trim() || 'Student',
            amount: Number(item.amount || 0),
            driverName: item.driver_name ? `${item.driver_name} (${item.driver_code || ''})` : 'Operator',
            ticketCount: Number(item.ticket_count || 1),
            status: item.status === 'completed' ? 'completed' : 'failed',
            date: new Date(item.created_at).toLocaleDateString(),
            time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawDate: new Date(item.created_at),
          }));
        }

        if (fundingsRes.data.success) {
          formattedFundings = fundingsRes.data.data.map((item: any) => {
            let fundingStatus: 'completed' | 'pending' | 'failed' = 'pending';
            if (item.status === 'success') fundingStatus = 'completed';
            else if (item.status === 'failed') fundingStatus = 'failed';

            return {
              id: item.reference || `REF${item.id}`,
              type: 'wallet_funding' as const,
              userName: item.fullname || 'Student',
              amount: Number(item.amount || 0),
              driverName: undefined,
              ticketCount: undefined,
              status: fundingStatus,
              date: new Date(item.created_at).toLocaleDateString(),
              time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              rawDate: new Date(item.created_at),
            };
          });
        }

        const combined = [...formattedRides, ...formattedFundings].sort(
          (a, b) => b.rawDate.getTime() - a.rawDate.getTime()
        );
        setPayments(combined);
      } catch (error) {
        console.error('Failed to load payments details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsData();
  }, []);

  const filteredPayments = payments.filter(
    (payment) =>
      (filterType === 'all' || payment.type === filterType) &&
      (filterStatus === 'all' || payment.status === filterStatus) &&
      (payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Type', 'User', 'Driver', 'Amount', 'Status', 'Date', 'Time'],
      ...filteredPayments.map((p) => [
        p.id,
        p.type === 'wallet_funding' ? 'Wallet Funding' : 'Ride Payment',
        p.userName,
        p.driverName || '-',
        p.amount,
        p.status,
        p.date,
        p.time,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
  };

  const stats = {
    totalCompleted: payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalPending: payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalFailed: payments.filter((p) => p.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-admin-primary" />
        <p className="text-slate-500 font-medium">Loading payments ledger...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6 font-sans">Payment Monitoring</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
            <p className="text-sm text-green-700 font-semibold">Completed Payments (All Time)</p>
            <p className="text-2xl font-bold text-green-900 mt-1">₦{stats.totalCompleted.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-fadeIn">
            <p className="text-sm text-yellow-700 font-semibold">Pending Amount</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">₦{stats.totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fadeIn">
            <p className="text-sm text-red-700 font-semibold">Failed Transactions</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{stats.totalFailed}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by ID, user or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="wallet_funding">Wallet Funding</option>
            <option value="ride_payment">Ride Payment</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={exportToCSV} className="flex items-center justify-center gap-2 btn-secondary h-full cursor-pointer hover:bg-slate-50">
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No transaction records found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">User</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Driver</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-slate-600 truncate max-w-[150px]">#{payment.id}</td>
                    <td className="px-6 py-3 text-slate-600">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        payment.type === 'wallet_funding' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {payment.type === 'wallet_funding' ? 'Wallet' : 'Ride'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{payment.userName}</td>
                    <td className="px-6 py-3 text-slate-600">{payment.driverName || '-'}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">₦{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {payment.date} {payment.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-600">
        Showing {filteredPayments.length} of {payments.length} payments
      </div>
    </div>
  );
}
