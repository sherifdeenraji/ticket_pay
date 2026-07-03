"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import api from "@/lib/api"

function VerifyEmailForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    
    const [status, setStatus] = useState<"loading" | "success" | "error">(() => token ? "loading" : "error")
    const [message, setMessage] = useState(() => token ? "Verifying your email address..." : "Invalid verification link. No token provided.")

    useEffect(() => {
        if (!token) return

        const verifyEmail = async () => {
            try {
                const res = await api.post("/auth/verify-email", { token })
                setStatus("success")
                setMessage(res.data.message || "Your email has been verified successfully!")
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : "Failed to verify email. The link may have expired or is invalid.";
                setStatus("error")
                setMessage(errorMsg)
            }
        }

        verifyEmail()
    }, [token])

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Email <span className="text-primary">Verification</span>
                    </h1>
                    <p className="text-muted-foreground">OAU Digital Transport Ticket System</p>
                </div>

                <div className="glass p-8 rounded-3xl shadow-2xl space-y-6 text-center">
                    {status === "loading" && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                            <p className="text-slate-600 dark:text-slate-400 font-medium">{message}</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                            <h2 className="text-2xl font-bold text-green-600">Verification Successful</h2>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">{message}</p>
                            <Link href="/login" className="w-full mt-6">
                                <button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">
                                    Proceed to Login
                                </button>
                            </Link>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <XCircle className="w-16 h-16 text-destructive" />
                            <h2 className="text-2xl font-bold text-destructive">Verification Failed</h2>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">{message}</p>
                            <Link href="/login" className="w-full mt-6">
                                <button className="w-full h-12 rounded-xl border border-border bg-background hover:bg-accent font-semibold transition-all">
                                    Back to Login
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        }>
            <VerifyEmailForm />
        </Suspense>
    )
}
