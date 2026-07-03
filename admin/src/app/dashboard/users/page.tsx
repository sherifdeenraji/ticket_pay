'use client';

import { useState, useEffect } from 'react';
import { Search, Shield, Lock, UserCheck, UserX, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  status: 'active' | 'suspended';
  registrationDate: string;
  totalTransactions: number;
  avatar: string;
}

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users?limit=100');
      if (res.data.success) {
        const formattedUsers = res.data.data.map((user: any) => {
          const initials = user.fullname
            ? user.fullname.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            : 'ST';
          return {
            id: user.id.toString(),
            name: user.fullname || `${user.firstname} ${user.lastname}`,
            email: user.email,
            walletBalance: Number(user.wallet_balance || 0),
            status: user.status || 'active',
            registrationDate: user.created_at,
            totalTransactions: Number(user.total_transactions || 0),
            avatar: initials,
          };
        });
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'suspend' : 'activate';
    if (confirm(`Are you sure you want to ${action} this student's account?`)) {
      try {
        const res = await api.put(`/admin/users/${id}/${action}`);
        if (res.data.success) {
          setUsers(users.map((user) =>
            user.id === id ? { ...user, status: currentStatus === 'active' ? 'suspended' : 'active' } : user
          ));
        }
      } catch (error: any) {
        alert(error.message || `Failed to ${action} user`);
      }
    }
  };

  const handleResetPassword = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to reset the password for ${email}?`)) {
      try {
        const res = await api.post(`/admin/users/${id}/reset-password`);
        if (res.data.success) {
          const tempPassword = res.data.data.temporary_password;
          alert(`Password reset successfully!\n\nTemporary Password: ${tempPassword}\n\nPlease share this secure key with the student.`);
        }
      } catch (error: any) {
        alert(error.message || 'Failed to reset password');
      }
    }
  };

  const totalActive = users.filter(u => u.status === 'active').length;
  const totalBalance = users.reduce((sum, u) => sum + u.walletBalance, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-admin-primary" />
        <p className="text-slate-500 font-medium">Loading students list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage student accounts, balances, and access</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-72 focus-within:ring-2 focus-within:ring-admin-primary/20 focus-within:border-admin-primary transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm placeholder:text-slate-400 focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card card-body flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <UserCheck size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total Students</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalActive}</p>
            <p className="text-xs text-slate-500 font-medium">Active Accounts</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <span className="text-amber-600 text-sm font-bold">₦</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">₦{totalBalance.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium">Total Wallet Balance</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">No students found</div>
          ) : (
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Wallet Balance</th>
                  <th>Transactions</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, i) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${avatarColors[i % avatarColors.length]} rounded-xl flex items-center justify-center text-white font-bold text-xs`}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-slate-900">₦{user.walletBalance.toLocaleString()}</td>
                    <td className="text-slate-600">{user.totalTransactions}</td>
                    <td className="text-slate-500 text-xs">{new Date(user.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                          title="Reset Password"
                        >
                          <Lock size={15} className="text-slate-400 group-hover:text-indigo-600" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                          title={user.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {user.status === 'active' ? (
                            <UserX size={15} className="text-slate-400 group-hover:text-amber-600" />
                          ) : (
                            <UserCheck size={15} className="text-slate-400 group-hover:text-emerald-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredUsers.length} of {users.length} students
          </p>
        </div>
      </div>
    </div>
  );
}
