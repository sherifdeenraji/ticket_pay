"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const firstname = formData.get("firstname")
        const lastname = formData.get("lastname")
        const email = formData.get("email")
        const phone_number = formData.get("phone")
        const password = formData.get("password")

        try {
            await api.post("/auth/register", { firstname, lastname, email, phone_number, password })
            router.push("/register-success")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background elements for premium look */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Create <span className="text-primary">Account</span>
                    </h1>
                    <p className="text-muted-foreground">Join TicketPay for seamless campus travel</p>
                </div>

                <div className="glass p-8 rounded-3xl shadow-2xl space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">First Name</label>
                            <Input
                                name="firstname"
                                placeholder="John"
                                required
                                disabled={isLoading}
                            />
                            <label className="text-sm font-medium px-1">Last Name</label>
                            <Input
                                name="lastname"
                                placeholder="Doe"
                                required
                                disabled={isLoading}
                            />
                        </div>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Phone Number</label>
                            <Input
                                name="phone"
                                type="text"
                                placeholder="08000000000"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Password</label>
                            <div className="relative">
                                <Input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base mt-2"
                            isLoading={isLoading}
                        >
                            Get Started
                        </Button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground font-medium">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="glass"
                        className="w-full h-12"
                        type="button"
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </Button>
                </div>

                <p className="text-center mt-8 text-sm text-muted-foreground font-medium">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline transition-all">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}
