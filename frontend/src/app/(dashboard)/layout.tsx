"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Bell, LogOut, Home, Wallet, History, User } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!user) return null

    const navLinks = [
        { href: "/dashboard", label: "Overview", icon: Home },
        { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
        { href: "/dashboard/history", label: "History", icon: History },
        { href: "/dashboard/profile", label: "Profile", icon: User },
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col">
            {/* Top Header */}
            <header className="glass sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-border/40 backdrop-blur-md">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Ticket<span className="text-primary">Pay</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-xl hover:bg-secondary/80 transition-colors relative" aria-label="Notifications">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>
                    <button onClick={logout} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors" aria-label="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto w-full flex flex-1">
                {/* Desktop Sidebar (hidden on mobile) */}
                <aside className="hidden md:flex flex-col w-64 p-6 space-y-2 h-[calc(100vh-73px)] sticky top-[73px]">
                    {navLinks.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                }`}
                            >
                                <Icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                                {link.label}
                            </Link>
                        )
                    })}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-4 sm:p-6 md:p-10 pb-24 md:pb-10">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Tab Bar (hidden on desktop) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border/50 px-6 py-2.5 flex items-center justify-around shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.1)]">
                {navLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                                {isActive && (
                                    <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                            <span className="text-[10px] font-bold tracking-tight mt-0.5">{link.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
