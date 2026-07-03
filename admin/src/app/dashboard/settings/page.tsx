'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [ticketPrice, setTicketPrice] = useState(100);
  const [newPrice, setNewPrice] = useState(100);
  const [lastUpdated, setLastUpdated] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const price = Number(res.data.data.current_ticket_price || 100);
        setTicketPrice(price);
        setNewPrice(price);
        setLastUpdated(res.data.data.last_updated ? new Date(res.data.data.last_updated).toLocaleDateString() : 'N/A');
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrice < 10) {
      alert('Minimum ticket price is ₦10');
      return;
    }

    try {
      const res = await api.put('/admin/settings/price', { price: newPrice });
      if (res.data.success) {
        const price = Number(res.data.data.current_ticket_price || newPrice);
        setTicketPrice(price);
        setNewPrice(price);
        setLastUpdated(new Date().toLocaleDateString());
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update ticket price');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-admin-primary" />
        <p className="text-slate-500 font-medium">Loading system configurations...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8 font-sans">System Settings</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Ticket Price Management</h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
              <p className="text-sm text-indigo-700 font-semibold">Current Ticket Price</p>
              <p className="text-4xl font-extrabold text-indigo-900 mt-1">₦{ticketPrice.toLocaleString()}</p>
              <p className="text-xs text-indigo-600 font-medium mt-2">Last Updated: {lastUpdated}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">New Ticket Price (₦) *</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold">₦</span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                  min="10"
                  step="10"
                  required
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                <strong>Change Summary:</strong> Submitting this form will immediately update the ticket price for all students from ₦{ticketPrice} to ₦{newPrice}.
              </p>
            </div>

            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 font-medium">✓ Price updated successfully!</p>
              </div>
            )}

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full btn-primary h-12 text-sm font-semibold rounded-xl"
            >
              <Save size={20} /> Save Settings
            </button>
          </form>

          <div className="mt-12 border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Price Log</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-950 text-sm">Active Price</p>
                  <p className="text-xs text-slate-500">Updated: {lastUpdated}</p>
                </div>
                <p className="font-bold text-slate-900">₦{ticketPrice}</p>
              </div>
              <div className="flex justify-between items-center py-2 text-slate-400">
                <div>
                  <p className="font-medium text-sm">Seed Price</p>
                  <p className="text-xs">Initial configuration</p>
                </div>
                <p className="font-semibold">₦100</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
