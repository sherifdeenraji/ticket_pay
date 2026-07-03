"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { format } from "date-fns"
import { Copy, Check, ChevronDown, ChevronUp, Lock, User, Mail, Phone, Landmark, CreditCard, CalendarDays } from "lucide-react"

export default function ProfilePage() {
    const { user } = useAuth()
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    if (!user) return null

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ text: "Passwords do not match", type: "error" })
            return
        }

        if (passwordForm.newPassword.length < 6) {
            setMessage({ text: "Password must be at least 6 characters", type: "error" })
            return
        }

        setLoading(true)
        try {
            await api.post("/auth/change-password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            setMessage({ text: "Password changed successfully!", type: "success" })
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            setTimeout(() => {
                setShowPasswordForm(false)
                setMessage(null)
            }, 2000)
        } catch (err: any) {
            setMessage({ text: err.message || "Failed to change password", type: "error" })
        } finally {
            setLoading(false)
        }
    }


    const infoItems = [
        { icon: User, label: "Full Name", value: user.fullname || `${user.firstname} ${user.lastname}` },
        { icon: Mail, label: "Email Address", value: user.email },
        { icon: Phone, label: "Phone Number", value: user.phone_number || "Not set" },
        {
            icon: CreditCard,
            label: "Account Number",
            value: user.account_number || "Not available",
            copyable: !!user.account_number,
        },
        { icon: Landmark, label: "Bank Name", value: user.bank_name || "Not available" },
        {
            icon: CalendarDays,
            label: "Member Since",
            value: format(new Date(user.created_at), "MMMM d, yyyy"),
        },
    ]

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

            {/* Profile Header */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.firstname}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl sm:text-3xl font-bold border-2 border-primary/20 shrink-0">
                            {user.firstname.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold truncate">
                            {user.fullname || `${user.firstname} ${user.lastname}`}
                        </h2>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <span className="mt-2 inline-block text-[11px] font-bold uppercase tracking-widest text-primary px-2.5 py-1 bg-primary/10 rounded-full">
                            Student Account
                        </span>
                    </div>
                </div>
            </div>

            {/* Account Info Cards */}
            <div className="glass rounded-2xl divide-y divide-border/50">
                {infoItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 px-5 py-4">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium truncate">{item.value}</p>
                        </div>
                        {item.copyable && (
                            <button
                                onClick={() => copyToClipboard(item.value)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                                aria-label="Copy account number"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Change Password Section */}
            <div className="glass rounded-2xl overflow-hidden">
                <button
                    onClick={() => {
                        setShowPasswordForm(!showPasswordForm)
                        setMessage(null)
                    }}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors"
                >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-semibold">Change Password</p>
                        <p className="text-xs text-muted-foreground">Update your password regularly for security</p>
                    </div>
                    {showPasswordForm ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                </button>

                {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="px-5 pb-5 space-y-4">
                        <div className="h-px bg-border/50" />

                        {message && (
                            <div
                                className={`text-sm px-4 py-3 rounded-xl ${
                                    message.type === "success"
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Current Password</label>
                            <Input
                                type="password"
                                placeholder="Enter your current password"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">New Password</label>
                            <Input
                                type="password"
                                placeholder="Enter new password"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Confirm New Password</label>
                            <Input
                                type="password"
                                placeholder="Confirm new password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => {
                                    setShowPasswordForm(false)
                                    setMessage(null)
                                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 rounded-xl" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
