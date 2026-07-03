"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { format } from "date-fns"
import Link from "next/link"
import {
  Copy,
  Check,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Landmark,
  CreditCard,
} from "lucide-react"

interface PaymentDetails {
  account_number: string
  bank_name: string
  account_name: string
  amount: number
}

interface Transaction {
  id: number
  amount: number | string
  type: "credit" | "debit"
  status: string
  created_at: string
  description?: string
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth()
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<Transaction[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copiedPayment, setCopiedPayment] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/wallet/transactions").catch(() => ({ data: { data: [] } }))
        setHistory(res.data.data || [])
      } finally {
        setHistoryLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const copyToClipboard = (text: string, type: "account" | "payment") => {
    navigator.clipboard.writeText(text)
    if (type === "account") {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopiedPayment(true)
      setTimeout(() => setCopiedPayment(false), 2000)
    }
  }

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) {
      setError("Enter a valid amount")
      return
    }
    if (parseFloat(amount) < 100) {
      setError("Minimum funding amount is ₦100")
      return
    }

    setIsLoading(true)
    setError("")
    try {
      const res = await api.post("/wallet/fund", { amount: parseFloat(amount) })
      setPaymentDetails(res.data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const statusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "text-green-600 bg-green-500/10"
      case "pending":
        return "text-yellow-600 bg-yellow-500/10"
      case "failed":
        return "text-red-600 bg-red-500/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  // ─── Payment Details View ───
  if (paymentDetails) {
    return (
      <div className="max-w-md mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Complete <span className="text-primary">Transfer</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer the exact amount below to fund your wallet
          </p>
        </div>

        {/* Amount */}
        <div className="glass premium-card text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Amount to Transfer
          </p>
          <p className="text-4xl font-extrabold tracking-tight text-primary">
            ₦{Number(paymentDetails.amount).toLocaleString()}
          </p>
        </div>

        {/* Account Details */}
        <div className="glass rounded-2xl p-5 space-y-4">
          {/* Account Number */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Account Number
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-mono font-bold tracking-wider">
                {paymentDetails.account_number}
              </p>
              <button
                onClick={() => copyToClipboard(paymentDetails.account_number, "payment")}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0 active:scale-95 transition-transform"
              >
                {copiedPayment ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <hr className="border-border" />

          {/* Bank Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bank Name</p>
              <p className="font-semibold">{paymentDetails.bank_name}</p>
            </div>
          </div>

          {/* Account Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Beneficiary</p>
              <p className="font-semibold">{paymentDetails.account_name}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full h-12 text-base rounded-2xl"
            onClick={() => {
              setPaymentDetails(null)
              setAmount("")
              refreshUser()
            }}
          >
            I've Made the Transfer
          </Button>
          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Your wallet will be credited automatically once confirmed
          </p>
        </div>
      </div>
    )
  }

  // ─── Default Fund Form View ───
  return (
    <div className="max-w-md mx-auto px-4 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>

      {/* Account Details Card */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Virtual Account</h2>
        </div>

        {user?.account_number ? (
          <div className="space-y-3">
            {/* Account Number Row */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Account Number</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-mono font-bold tracking-wider">
                  {user.account_number}
                </p>
                <button
                  onClick={() => copyToClipboard(user.account_number!, "account")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0 active:scale-95 transition-transform"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="text-sm font-semibold">{user.bank_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="text-sm font-semibold">{user.account_name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-3 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Complete your profile to get a virtual account
            </p>
            <Link href="/auth/complete-profile" className="inline-block">
              <Button variant="outline" className="h-9 text-xs px-3 rounded-lg">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="premium-card bg-primary text-white rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 opacity-80" />
          <p className="text-sm font-medium opacity-80">Current Balance</p>
        </div>
        <h2 className="text-3xl font-bold">
          ₦{Number(user?.wallet_balance || 0).toLocaleString()}
        </h2>
      </div>

      {/* Fund Wallet Form */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-4">Fund Wallet</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleFund} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount (₦)</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="text-xl h-14 font-bold"
              type="number"
              min={100}
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[200, 500, 1000, 2000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                  amount === val.toString()
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                ₦{val.toLocaleString()}
              </button>
            ))}
          </div>

          <Button className="w-full h-12 text-base rounded-2xl" isLoading={isLoading}>
            Continue to Payment
          </Button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Transactions</h2>
          <button
            onClick={() => refreshUser()}
            className="text-xs font-semibold text-primary active:scale-95 transition-transform"
          >
            Refresh
          </button>
        </div>

        {historyLoading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Loading transactions…</p>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-2">
            {history.map((tx) => (
              <div key={tx.id} className="glass rounded-xl p-4 flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "credit" ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">
                      {tx.type === "credit" ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 ${statusColor(tx.status)}`}
                    >
                      {statusIcon(tx.status)}
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{tx.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <Wallet className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
