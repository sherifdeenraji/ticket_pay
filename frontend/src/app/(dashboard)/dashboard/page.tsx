"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Copy,
  Check,
  PlusCircle,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshUser();
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/wallet/transactions");
        if (res.data.success) {
          setTransactions(res.data.data);
        }
      } catch {
        console.error("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [refreshUser]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = user!.fullname
    ? user!.fullname
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <section className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border-2 border-primary/25 overflow-hidden">
            {user!.avatar_url ? (
              <img
                src={user!.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-lg font-bold truncate">{user!.fullname}</h1>
          </div>
        </section>

        {/* Balance Card */}
        <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-xl">
          {/* Decorative blurs */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-pink-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-80">
              <Wallet size={14} />
              Balance
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl font-light opacity-75">₦</span>
              <span className="text-4xl font-extrabold tracking-tight">
                {user!.wallet_balance?.toLocaleString() ?? "0"}
              </span>
            </div>

            {/* Account details sub-section */}
            {user!.account_number ? (
              <div className="mt-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm tracking-wider">
                    {user!.account_number}
                  </span>
                  <button
                    onClick={() => copyToClipboard(user!.account_number!)}
                    className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                    aria-label="Copy account number"
                  >
                    {copied ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <p className="text-xs opacity-70">
                  {user!.bank_name} &middot; {user!.account_name}
                </p>
              </div>
            ) : (
              <Link href="/auth/complete-profile" className="block mt-1">
                <span className="text-xs opacity-80 hover:opacity-100 underline decoration-dotted flex items-center gap-1">
                  <UserCircle size={12} className="-mt-0.5" />
                  Complete your profile to get your account
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/wallet"
            className="glass premium-card flex flex-col items-center gap-3 text-center !p-5"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <PlusCircle size={22} />
            </div>
            <span className="text-sm font-semibold">Fund Wallet</span>
          </Link>

          <Link
            href="/pay"
            className="glass premium-card flex flex-col items-center gap-3 text-center !p-5"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <QrCode size={22} />
            </div>
            <span className="text-sm font-semibold">Pay for Ride</span>
          </Link>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <History size={16} className="text-primary" />
              Recent Transactions
            </h2>
            <Link
              href="/dashboard/history"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 bg-secondary animate-pulse rounded" />
                      <div className="h-2.5 w-1/2 bg-secondary animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-16 bg-secondary animate-pulse rounded" />
                  </div>
                ))}
              </>
            ) : recentTransactions.length === 0 ? (
              <div className="glass rounded-2xl py-12 text-center">
                <History
                  size={32}
                  className="mx-auto text-muted-foreground/40 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  No transactions yet
                </p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "credit"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM dd, yyyy · h:mm a")}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold whitespace-nowrap ${
                      tx.type === "credit"
                        ? "text-green-500"
                        : "text-foreground"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}₦
                    {Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
