'use client'

import { useState } from 'react'
import { Bus, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { addToast } from '@/components/toast'
import api from '@/lib/api'

export default function DriverLoginPage() {
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        if (!identifier.trim() || !password.trim()) {
            addToast('Please enter your driver code/phone and password', 'warning')
            setIsLoading(false)
            return
        }

        try {
            await api.post('/drivers/login', { identifier: identifier.trim(), password })
            addToast('Login successful! Redirecting…', 'success')
            // Hard redirect to ensure cookie is picked up
            window.location.href = '/driver/dashboard'
        } catch (err: any) {
            const message = err.message || 'An unexpected error occurred'

            if (message.toLowerCase().includes('inactive') || message.toLowerCase().includes('disabled')) {
                addToast('Your account has been deactivated. Contact admin.', 'error', 5000)
            } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('credentials')) {
                addToast('Invalid driver code/phone or password', 'error')
            } else if (message.toLowerCase().includes('required') || message.toLowerCase().includes('missing')) {
                addToast('Please fill in all required fields', 'warning')
            } else {
                addToast(message, 'error')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 relative overflow-hidden">
            {/* Decorative gradient blobs */}
            <div className="absolute top-0 left-0 -translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-0 right-0 translate-y-1/3 translate-x-1/3 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />

            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="w-full max-w-md relative z-10">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-5">
                        <Bus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                        Driver <span className="text-emerald-500">Portal</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base">
                        Sign in with your driver code or phone number
                    </p>
                </div>

                {/* Glass login card */}
                <div className="glass p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Identifier field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200 px-1">
                                Driver Code or Phone Number
                            </label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="DRV001 or 08012345678"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-12"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200 px-1">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    <span>Signing in…</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5" />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security badge */}
                    <div className="mt-6 pt-5 border-t border-white/5">
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Secure encrypted connection</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center mt-8 text-xs text-slate-500">
                    © 2025 TicketPay - OAU Digital Transport System
                </p>
            </div>
        </div>
    )
}
