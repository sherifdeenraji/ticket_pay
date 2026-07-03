"use client";

import { useState } from 'react';
import { Landmark, ArrowLeft, ChevronRight, CheckCircle2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function FundPage() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const handleFund = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/wallet/fund', { amount: parseFloat(amount) });
            if (res.data.success) {
                setPaymentData(res.data.data);
            }
        } catch (err) {
            alert('Failed to generate payment details');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => window.location.href = '/dashboard'} className="p-2 rounded-full hover:bg-secondary">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Fund Wallet</h1>
            </header>

            <main className="max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    {!paymentData ? (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleFund} 
                            className="space-y-6"
                        >
                            <div className="glass premium-card space-y-4">
                                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    Enter Amount (₦)
                                </label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="500.00"
                                    className="w-full text-4xl font-black bg-transparent border-none focus:ring-0 p-0"
                                    required
                                    autoFocus
                                />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {[200, 500, 1000].map(val => (
                                    <button 
                                        key={val}
                                        type="button"
                                        onClick={() => setAmount(val.toString())}
                                        className="py-3 glass rounded-xl text-sm font-bold hover:bg-primary/10 transition-colors"
                                    >
                                        +₦{val}
                                    </button>
                                ))}
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || !amount}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Continue to Payment'}
                                <ChevronRight size={18} />
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="glass premium-card text-center space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Transfer exactly</p>
                                <h2 className="text-4xl font-black text-primary">₦{paymentData.amount}</h2>
                            </div>

                            <div className="glass premium-card space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Bank Name</p>
                                    <p className="text-lg font-bold">{paymentData.bank_name}</p>
                                </div>
                                
                                <div className="space-y-1 relative">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Account Number</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-black tracking-wider text-indigo-500">{paymentData.account_number}</p>
                                        <button 
                                            onClick={() => copyToClipboard(paymentData.account_number)}
                                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                                        >
                                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Account Name</p>
                                    <p className="text-sm font-bold opacity-80">{paymentData.account_name}</p>
                                </div>
                            </div>

                            <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                                <p className="text-xs text-indigo-500 leading-relaxed font-medium">
                                    This is a unique dynamic account valid for this transaction only. Your wallet will be credited automatically once the transfer is confirmed.
                                </p>
                            </div>

                            <button 
                                onClick={() => window.location.href = '/dashboard'}
                                className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-4 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                I have made the transfer
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
