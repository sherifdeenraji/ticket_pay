'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen)
    }

    const navLinks = [
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How it Works" },
        { href: "#help", label: "Help Center" },
    ]

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />

            {/* Navbar */}
            <nav className="relative z-40 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-8 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-9 sm:w-10 h-9 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold text-lg sm:text-xl">
                        T
                    </div>
                    <span className="text-lg sm:text-2xl font-bold tracking-tight">TP</span>
                    <span className="text-lg sm:text-2xl font-bold tracking-tight hidden sm:inline">Ticket<span className="text-primary">Pay</span></span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground ml-12">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.href}
                            href={link.href} 
                            className="hover:text-foreground transition-colors duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden sm:flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="ghost" className="text-sm">Log In</Button>
                    </Link>
                    <Link href="/register">
                        <Button className="text-sm shadow-xl shadow-primary/20">Get Started</Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMobileMenu}
                    className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <X size={24} className="text-foreground" />
                    ) : (
                        <Menu size={24} className="text-foreground" />
                    )}
                </button>

                {/* Mobile Only Button - Show when menu is closed */}
                {!mobileMenuOpen && (
                    <div className="sm:hidden flex items-center gap-2">
                        <Link href="/login">
                            <Button variant="ghost" className="text-xs px-3 py-1.5 h-auto">Log In</Button>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 top-[57px] sm:top-[73px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 md:hidden animate-in fade-in">
                    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-4">
                        {/* Mobile Navigation Links */}
                        <div className="space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block px-4 py-3 rounded-lg hover:bg-secondary transition-colors font-medium text-foreground"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex flex-col gap-3 pt-4">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                                <Button variant="outline" className="w-full text-sm">Log In</Button>
                            </Link>
                            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                                <Button className="w-full text-sm shadow-xl shadow-primary/20">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <button
                    className="fixed inset-0 top-[57px] sm:top-[73px] z-20 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                />
            )}

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 max-w-5xl mx-auto w-full">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 sm:mb-8 animate-bounce-slow">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="hidden sm:inline">DIGITIZING OAU CAMPUS TRANSPORT</span>
                    <span className="inline sm:hidden text-[10px] sm:text-xs">CAMPUS TRANSPORT</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-[1.1]">
                    Rethink how you <br className="hidden sm:inline" />
                    <span className="text-primary">Move on Campus.</span>
                </h1>
                
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-12 leading-relaxed px-2 sm:px-0">
                    Say goodbye to physical tickets. Fund your wallet, scan driver QR codes, 
                    and pay for your bus or keke rides instantly.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <Link href="/register" className="w-full sm:w-auto">
                        <Button className="w-full h-12 sm:h-16 px-6 sm:px-10 text-sm sm:text-lg rounded-2xl shadow-2xl shadow-primary/30">
                            Create Your Wallet
                        </Button>
                    </Link>
                    <Link href="#how-it-works" className="w-full sm:w-auto">
                        <Button variant="glass" className="w-full h-12 sm:h-16 px-6 sm:px-10 text-sm sm:text-lg rounded-2xl border border-white/40 shadow-xl">
                            Watch How it Works
                        </Button>
                    </Link>
                </div>

                {/* Floating elements for visual interest */}
                <div className="mt-12 sm:mt-24 w-full max-w-4xl glass rounded-2xl sm:rounded-[40px] p-2 overflow-hidden border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl sm:rounded-[34px] overflow-hidden aspect-video flex items-center justify-center">
                        {/* Placeholder for an app preview image or illustration */}
                        <div className="flex flex-col items-center text-muted-foreground opacity-50 px-4">
                            <svg className="w-12 sm:w-20 h-12 sm:h-20 mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs sm:text-lg font-medium tracking-wide text-center">Interactive Dashboard Preview</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 border-t border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-muted-foreground">
                <p>&copy; 2026 TicketPay OAU. All rights reserved.</p>
            </footer>

            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
