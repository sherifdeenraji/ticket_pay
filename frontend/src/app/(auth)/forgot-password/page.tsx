"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email")

        try {
            await api.post("/auth/forgot-password", { email })
            setSuccess("If an account with that email exists, password reset instructions have been sent.")
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Failed to send reset email";
            setError(errorMsg)
        } finally {
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
                    <p className="text-muted-foreground">Enter your email to receive recovery instructions</p>
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
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base mt-2"
                            isLoading={isLoading}
                        >
                            Send Instructions
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
