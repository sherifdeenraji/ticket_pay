"use client";

import { useState } from 'react';
import { QrCode, ArrowLeft, Send, User, Car, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const uuidv4 = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
};

export default function PayPage() {
    const [driverCode, setDriverCode] = useState('');
    const [ticketCount, setTicketCount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/payments/pay', {
                driver_code: driverCode.toUpperCase(),
                ticket_count: ticketCount,
                idempotency_key: uuidv4()
            });

            if (res.data.success) {
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/30"
                >
                    <CheckCircle size={48} />
                </motion.div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black">Success!</h1>
                    <p className="text-muted-foreground">Your transport fare has been paid.</p>
                </div>
                <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90 mt-4"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => window.location.href = '/dashboard'} className="p-2 rounded-full hover:bg-secondary">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Pay for Ride</h1>
            </header>

            <main className="max-w-md mx-auto space-y-8">
                <form onSubmit={handlePay} className="space-y-6">
                    <div className="glass premium-card space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            <Car size={14} />
                            Driver Code
                        </div>
                        <input 
                            type="text" 
                            value={driverCode}
                            onChange={(e) => setDriverCode(e.target.value)}
                            placeholder="e.g. DRV001"
                            className="w-full text-3xl font-black bg-transparent border-none focus:ring-0 p-0 placeholder:opacity-20 uppercase"
                            required
                        />
                    </div>

                    <div className="glass premium-card space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tickets</label>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">₦200 / seat</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-xl hover:bg-primary/10"
                                >-</button>
                                <span className="text-3xl font-black w-8 text-center">{ticketCount}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setTicketCount(ticketCount + 1)}
                                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-xl hover:bg-primary/10"
                                >+</button>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Total Fare</p>
                                <p className="text-2xl font-black">₦{ticketCount * 200}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive text-sm font-bold rounded-xl border border-destructive/20 animate-shake">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || !driverCode}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                    >
                        {loading ? 'Processing...' : 'Confirm Payment'}
                        <Send size={18} />
                    </button>
                </form>

                <div className="text-center space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">OR</p>
                    <button className="flex items-center gap-2 mx-auto text-sm font-bold text-primary hover:opacity-80 transition-all">
                        <QrCode size={18} />
                        Scan Driver's QR Code
                    </button>
                </div>
            </main>
        </div>
    );
}
