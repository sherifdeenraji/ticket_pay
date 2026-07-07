'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RotateCw, QrCode, Loader2, Phone, User, Compass, HelpCircle } from 'lucide-react';
import Modal from '@/components/modal';
import api from '@/lib/api';

interface Driver {
  id: string;
  name: string;
  code: string;
  phone: string;
  vehicleType: 'Bus' | 'Keke';
  vehicleNumber: string;
  route?: string;
  status: 'active' | 'inactive';
  revenueToday: number;
  qrCode: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    vehicleType: 'Bus' | 'Keke';
    vehicleNumber: string;
    route: string;
  }>({
    name: '',
    phone: '',
    vehicleType: 'Bus',
    vehicleNumber: '',
    route: '',
  });

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/drivers');
      if (res.data.success) {
        const formatted = res.data.data.map((d: any) => ({
          id: d.id.toString(),
          name: d.name,
          code: d.driver_code,
          phone: d.phone_number,
          vehicleType: d.vehicle_type === 'bus' ? 'Bus' : 'Keke',
          vehicleNumber: d.vehicle_number,
          route: d.route || '',
          status: d.status === 'active' ? 'active' : 'inactive',
          revenueToday: Number(d.revenue_today || 0),
          qrCode: d.qr_code,
        }));
        setDrivers(formatted);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAddDriver = () => {
    setSelectedDriver(null);
    setFormData({ name: '', phone: '', vehicleType: 'Bus', vehicleNumber: '', route: '' });
    setShowModal(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      route: driver.route || '',
    });
    setShowModal(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.vehicleNumber) {
      alert('Please fill out all required fields');
      return;
    }

    const payload = {
      name: formData.name,
      phone_number: formData.phone,
      vehicle_type: formData.vehicleType.toLowerCase(),
      vehicle_number: formData.vehicleNumber,
      route: formData.route,
    };

    try {
      if (selectedDriver) {
        // Update
        const res = await api.put(`/admin/drivers/${selectedDriver.id}`, payload);
        if (res.data.success) {
          alert('Driver updated successfully');
          fetchDrivers();
          setShowModal(false);
        }
      } else {
        // Create
        const res = await api.post('/admin/drivers', payload);
        if (res.data.success) {
          const tempPassword = res.data.data?.temporary_password;
          setCreatedPassword(tempPassword || 'Password was pre-set');
          setCopied(false);
          fetchDrivers();
          setShowModal(false);
          setShowPasswordModal(true);
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save driver');
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this driver?')) {
      try {
        const res = await api.put(`/admin/drivers/${id}`, { status: 'deactivated' });
        if (res.data.success) {
          setDrivers(drivers.map(d => d.id === id ? { ...d, status: 'inactive' } : d));
        }
      } catch (error: any) {
        alert(error.message || 'Failed to deactivate driver');
      }
    }
  };

  const handleRegenerateQR = async (id: string) => {
    if (confirm('Are you sure you want to regenerate the QR code for this driver?')) {
      try {
        const res = await api.post(`/admin/drivers/${id}/regenerate-qr`);
        if (res.data.success) {
          alert('QR code regenerated successfully');
          fetchDrivers();
        }
      } catch (error: any) {
        alert(error.message || 'Failed to regenerate QR code');
      }
    }
  };

  const handleRegenerateCode = async (id: string) => {
    if (confirm('Are you sure you want to regenerate the driver code? This will also update their QR code.')) {
      try {
        const res = await api.post(`/admin/drivers/${id}/regenerate-code`);
        if (res.data.success) {
          alert(`Code successfully updated to: ${res.data.data.driver_code}`);
          fetchDrivers();
        }
      } catch (error: any) {
        alert(error.message || 'Failed to regenerate driver code');
      }
    }
  };

  const handleShowQR = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowQRModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-admin-primary" />
        <p className="text-slate-500 font-medium">Loading drivers registry...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Driver Management</h1>
          <p className="text-sm text-slate-500 mt-1">Register and manage campus transport operators and generate QR codes</p>
        </div>
        <button
          onClick={handleAddDriver}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus size={20} /> Add Driver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Code</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Vehicle</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Phone</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Today's Revenue</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No drivers registered in system
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{driver.name}</td>
                  <td className="px-6 py-3 text-slate-600 font-mono font-semibold">{driver.code}</td>
                  <td className="px-6 py-3 text-slate-600">
                    <span className="capitalize">{driver.vehicleType.toLowerCase()}</span> &middot; {driver.vehicleNumber}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{driver.phone}</td>
                  <td className="px-6 py-3 font-bold text-slate-900">
                    ₦{driver.revenueToday.toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        driver.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowQR(driver)}
                        className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Show QR Code"
                      >
                        <QrCode size={16} className="text-indigo-600" />
                      </button>
                      <button
                        onClick={() => handleEditDriver(driver)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate Operator"
                        disabled={driver.status === 'inactive'}
                      >
                        <Trash2 size={16} className={driver.status === 'inactive' ? 'text-slate-300 cursor-not-allowed' : 'text-red-600'} />
                      </button>
                      <button
                        onClick={() => handleRegenerateCode(driver.id)}
                        className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Regenerate Driver Code"
                      >
                        <RotateCw size={16} className="text-amber-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Driver Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedDriver ? 'Edit Driver' : 'Add New Driver'}>
        <form onSubmit={handleSaveDriver} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Adekunle Ahmed"
                required
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number *</label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 08012345678"
                required
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle Type *</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as 'Bus' | 'Keke' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Bus">Bus</option>
                <option value="Keke">Keke</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle Plate Number *</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. ABC-123-XYZ"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Route (Optional)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Obafemi Awolowo -> Main Gate"
              />
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {selectedDriver ? 'Update Operator' : 'Register Operator'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Preview Modal */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Driver QR Ticket">
        {selectedDriver && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{selectedDriver.name}</h3>
              <p className="text-xs text-slate-500 font-semibold font-mono tracking-wider mt-1">CODE: {selectedDriver.code}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selectedDriver.vehicleType} &middot; {selectedDriver.vehicleNumber}</p>
            </div>
            
            <div className="w-64 h-64 border-2 border-dashed border-indigo-200 rounded-3xl p-4 bg-white flex items-center justify-center shadow-lg shadow-indigo-100">
              {selectedDriver.qrCode ? (
                <img
                  src={selectedDriver.qrCode}
                  alt={`${selectedDriver.name} QR Code`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400 gap-2">
                  <HelpCircle className="w-10 h-10 animate-bounce" />
                  <span className="text-xs font-semibold">QR Code missing</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full btn-primary h-12 text-sm font-semibold rounded-xl"
              >
                Print Pass Card
              </button>
              <button
                onClick={() => handleRegenerateQR(selectedDriver.id)}
                className="w-full btn-secondary h-12 text-sm font-semibold rounded-xl"
              >
                Regenerate QR Code
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Temporary Password Modal */}
      <Modal 
        isOpen={showPasswordModal} 
        onClose={() => {
          setShowPasswordModal(false);
          setCreatedPassword(null);
        }} 
        title="Driver Created Successfully"
      >
        <div className="flex flex-col p-4 space-y-4">
          <p className="text-sm text-slate-600">
            A temporary password has been generated for this driver. 
            Please <strong className="text-slate-900">copy and save it now</strong>. For security, it will not be displayed again.
          </p>

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-base font-bold text-slate-800">
            <span className="select-all tracking-wider">{createdPassword}</span>
            <button
              onClick={() => {
                if (createdPassword) {
                  navigator.clipboard.writeText(createdPassword);
                  setCopied(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all ${
                copied ? 'bg-green-100 text-green-800' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setCreatedPassword(null);
              }}
              className="w-full btn-primary h-12 text-sm font-semibold rounded-xl"
            >
              Close & Discard
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
