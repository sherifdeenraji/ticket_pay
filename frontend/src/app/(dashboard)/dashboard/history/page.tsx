"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { format, startOfWeek, startOfMonth, endOfDay } from "date-fns"
import { ArrowUpRight, ArrowDownLeft, History, Inbox } from "lucide-react"

type FilterPeriod = "all" | "today" | "week" | "month"
type FilterKind = "all" | "wallet" | "ride"

interface Transaction {
  id: number
  amount: string | number
  type: "credit" | "debit"
  kind: "wallet" | "ride"
  status: string
  description?: string
  driver_code?: string
  created_at: string
}

const periodOptions: { value: FilterPeriod; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
]

const typeOptions: { value: FilterKind; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "wallet", label: "Wallet" },
  { value: "ride", label: "Rides" },
]

export default function HistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all")
  const [filterKind, setFilterKind] = useState<FilterKind>("all")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [walletRes, rideRes] = await Promise.all([
          api.get("/wallet/transactions").catch(() => ({ data: { data: [] } })),
          api.get("/payments/history").catch(() => ({ data: { data: [] } })),
        ])

        const combined: Transaction[] = [
          ...walletRes.data.data.map((t: any) => ({
            ...t,
            kind: "wallet" as const,
            type: "credit" as const,
          })),
          ...rideRes.data.data.map((t: any) => ({
            ...t,
            kind: "ride" as const,
            type: "debit" as const,
          })),
        ].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setTransactions(combined)
      } catch (err) {
        console.error("Failed to fetch history", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    const now = new Date()
    if (filterPeriod === "today") {
      result = result.filter(
        (t) => new Date(t.created_at).toDateString() === now.toDateString()
      )
    } else if (filterPeriod === "week") {
      const weekStart = startOfWeek(now)
      const weekEnd = endOfDay(now)
      result = result.filter((t) => {
        const date = new Date(t.created_at)
        return date >= weekStart && date <= weekEnd
      })
    } else if (filterPeriod === "month") {
      const monthStart = startOfMonth(now)
      const monthEnd = endOfDay(now)
      result = result.filter((t) => {
        const date = new Date(t.created_at)
        return date >= monthStart && date <= monthEnd
      })
    }

    if (filterKind === "wallet") {
      result = result.filter((t) => t.kind === "wallet")
    } else if (filterKind === "ride") {
      result = result.filter((t) => t.kind === "ride")
    }

    return result
  }, [transactions, filterPeriod, filterKind])

  const stats = useMemo(() => {
    const totalTransactions = filteredTransactions.length
    const totalFunded = filteredTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
    const totalSpent = filteredTransactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
    return { totalTransactions, totalFunded, totalSpent }
  }, [filteredTransactions])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Page title */}
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
        <History className="inline-block w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary -mt-0.5" />
        History
      </h1>

      {/* Summary stats — responsive grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="glass rounded-xl sm:rounded-2xl p-3 text-center sm:text-left">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Txns
          </p>
          <p className="text-lg font-extrabold mt-1">{stats.totalTransactions}</p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-3 text-center sm:text-left">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Funded
          </p>
          <p className="text-lg font-extrabold mt-1 text-green-600 truncate">
            ₦{stats.totalFunded >= 1000 ? `${(stats.totalFunded / 1000).toFixed(1)}k` : stats.totalFunded}
          </p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-3 text-center sm:text-left">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Spent
          </p>
          <p className="text-lg font-extrabold mt-1 text-red-600 truncate">
            ₦{stats.totalSpent >= 1000 ? `${(stats.totalSpent / 1000).toFixed(1)}k` : stats.totalSpent}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="space-y-3">
        {/* Period filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterPeriod(opt.value)}
              className={`whitespace-nowrap px-3.5 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                filterPeriod === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterKind(opt.value)}
              className={`whitespace-nowrap px-3.5 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                filterKind === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="space-y-2.5">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => (
            <div
              key={`${t.kind}-${t.id}`}
              className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                    t.type === "credit"
                      ? "bg-green-100 dark:bg-green-500/10"
                      : "bg-red-100 dark:bg-red-500/10"
                  }`}
                >
                  {t.type === "credit" ? (
                    <ArrowDownLeft className="w-4.5 h-4.5 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-4.5 h-4.5 text-red-600" />
                  )}
                </div>

                {/* Description + date */}
                <div className="min-w-0">
                  <p className="font-semibold truncate text-xs sm:text-sm">
                    {t.kind === "ride"
                      ? `Ride Payment${t.driver_code ? ` (${t.driver_code})` : ""}`
                      : t.description || "Wallet Funding"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {format(new Date(t.created_at), "dd MMM · h:mm a")}
                  </p>
                </div>
              </div>

              {/* Amount + status */}
              <div className="shrink-0 text-right">
                <p
                  className={`font-bold text-xs sm:text-sm ${
                    t.type === "credit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.type === "credit" ? "+" : "-"}₦
                  {parseFloat(String(t.amount)).toLocaleString()}
                </p>
                <span
                  className={`inline-block mt-0.5 text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                    t.status === "completed" || t.status === "success"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : t.status === "pending"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass rounded-2xl py-16 flex flex-col items-center justify-center text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">
              No transactions found
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
