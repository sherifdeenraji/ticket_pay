"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QRScanner } from "@/components/qr-scanner"
import { useToast } from "@/components/toast"
import api from "@/lib/api"
import { Camera } from 'lucide-react'

const uuidv4 = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID()
    }
    return Math.random().toString(36).substring(2, 15)
}

function PayContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, refreshUser } = useAuth()
    const { addToast } = useToast()

    const [driverCode, setDriverCode] = useState("")
    const [ticketCount, setTicketCount] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState<any>(null)
    const [showQRScanner, setShowQRScanner] = useState(false)

    useEffect(() => {
        const code = searchParams.get("driver")
        if (code) setDriverCode(code.toUpperCase())
    }, [searchParams])

    const handleQRScanned = (scannedCode: string) => {
        setDriverCode(scannedCode.toUpperCase())
        addToast(`Driver code scanned: ${scannedCode}`, "success")
    }

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!driverCode.trim()) {
            addToast("Please enter a driver code", "error")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const res = await api.post("/payments/pay", {
                driver_code: driverCode.toUpperCase(),
                ticket_count: ticketCount,
                idempotency_key: uuidv4()
            })
            setSuccess(res.data.data)
            addToast("Payment successful!", "success")
            await refreshUser()
        } catch (err: any) {
            const errorMsg = err.message || "Payment failed"
            setError(errorMsg)
            addToast(errorMsg, "error")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="max-w-md mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/40">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Payment <span className="text-green-500">Successful!</span></h1>
                    <p className="text-muted-foreground mt-2">You've successfully paid for your ride.</p>
                </div>

                <div className="glass p-8 rounded-3xl space-y-4 text-left border-green-500/20">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-muted-foreground">Amount Paid</span>
                        <span className="text-xl font-bold">₦{success.amount}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-muted-foreground">Tickets</span>
                        <span className="text-lg font-bold">{success.ticket_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Transaction ID</span>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">{success.transaction_id}</span>
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <Button className="w-full h-14 text-lg rounded-2xl" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/drivers/${driverCode.toUpperCase()}`, '_blank')}>
                        Show Driver Proof
                    </Button>
                    <Button variant="ghost" className="w-full h-14" onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto space-y-10">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight">Quick <span className="text-primary">Pay</span></h1>
                <p className="text-muted-foreground mt-3 text-lg font-medium italic">Enter driver code to pay instantly</p>
            </div>

            <div className="glass p-8 rounded-[40px] shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold text-center">{error}</div>}

                <form onSubmit={handlePay} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Driver Code</label>
                        <div className="flex gap-2">
                            <Input
                                value={driverCode}
                                onChange={(e) => setDriverCode(e.target.value.toUpperCase())}
                                placeholder="DRV001"
                                className="flex-1 h-14 text-2xl font-black text-center tracking-widest border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowQRScanner(true)}
                                className="px-4 h-14 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 font-bold"
                                title="Scan QR Code"
                            >
                                <Camera size={20} />
                                <span className="hidden sm:inline">Scan</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Number of Tickets</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setTicketCount(num)}
                                    className={`h-16 rounded-2xl border-2 font-bold text-xl transition-all ${ticketCount === num ? 'border-primary bg-primary text-white scale-105 shadow-lg shadow-primary/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 flex flex-col items-center justify-center gap-0.5" disabled={isLoading}>
                            <span>Confirm Payment</span>
                            <span className="text-[10px] font-medium opacity-80">₦{ticketCount * 100} FOR {ticketCount} TICKETS</span>
                        </Button>
                    </div>
                </form>
            </div>

            <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
                Make sure you are with the driver before making payment.
                Payment is instant and non-refundable.
            </p>

            <QRScanner
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScan={handleQRScanned}
            />
        </div>
    )
}

export default function PayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <PayContent />
        </Suspense>
    )
}
