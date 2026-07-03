"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [email, setEmail] = useState(() => searchParams.get("email") || "")
    const [otp, setOtp] = useState(() => searchParams.get("otp") || "")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            await api.post("/auth/reset-password", {
                email,
                otp,
                newPassword
            })
            setSuccess("Password reset successful! Redirecting to login page...")
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Failed to reset password";
            setError(errorMsg)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Reset <span className="text-primary">Password</span>
                    </h1>
                    <p className="text-muted-foreground">Complete password reset process</p>
                </div>

                <div className="glass p-8 rounded-3xl shadow-2xl space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-xl">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Email Address</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading || !!searchParams.get("email")}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">OTP Code</label>
                            <Input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                disabled={isLoading || !!searchParams.get("otp")}
                                placeholder="123456"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium px-1">New Password</label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px]"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium px-1">Confirm New Password</label>
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[38px]"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base mt-2"
                            isLoading={isLoading}
                        >
                            Reset Password
                        </Button>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-muted-foreground font-medium">
                    Back to{" "}
                    <Link href="/login" className="text-primary hover:underline transition-all">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
