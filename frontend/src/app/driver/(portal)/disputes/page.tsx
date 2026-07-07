'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { addToast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Banknote, 
  Receipt 
} from 'lucide-react';
import { format } from 'date-fns';

interface Dispute {
  id: number;
  ride_payment_id: number;
  user_id: number;
  driver_id: number;
  amount: number;
  reason: string;
  status: 'open' | 'approved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
  student_name: string;
  ticket_count: number;
}

export default function DriverDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/drivers/me/disputes');
      if (res.data.success) {
        setDisputes(res.data.data);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch disputes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: number, action: 'approved' | 'rejected') => {
    setResolvingId(id);
    try {
      const res = await api.post(`/drivers/me/disputes/${id}/resolve`, { action });
      if (res.data.success) {
        addToast(
          action === 'approved' 
            ? 'Dispute approved and ticket refunded!' 
            : 'Dispute rejected successfully.', 
          'success'
        );
        fetchDisputes();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to resolve dispute', 'error');
    } finally {
      setResolvingId(null);
      setConfirmId(null);
    }
  };

  // Filter logic
  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'open') return dispute.status === 'open';
    if (filter === 'resolved') return dispute.status === 'approved' || dispute.status === 'rejected';
    return true;
  });

  const openCount = disputes.filter(d => d.status === 'open').length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="h-4 w-72 bg-secondary rounded" />
        </div>
        <div className="h-10 w-full bg-secondary rounded-xl" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-secondary rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <section className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Dispute Center</h1>
          {openCount > 0 && (
            <span className="text-xs font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
              {openCount} Open
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Review and resolve payment disputes filed by students.
        </p>
      </section>

      {/* Tabs Filter */}
      <section className="flex bg-secondary/50 p-1 rounded-2xl border border-border/40">
        {(['all', 'open', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilter(tab);
              setConfirmId(null); // Reset confirm modal when changing tabs
            }}
            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all duration-200 capitalize ${
              filter === tab
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab} ({
              tab === 'all' ? disputes.length :
              tab === 'open' ? openCount :
              disputes.length - openCount
            })
          </button>
        ))}
      </section>

      {/* Disputes Cards */}
      <section className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center border-dashed border-2 border-border">
            <ShieldCheck size={40} className="mx-auto text-emerald-500 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-muted-foreground">No disputes found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">All clear! No student has disputed any rides under this filter.</p>
          </div>
        ) : (
          filteredDisputes.map((dispute) => {
            const isConfirming = confirmId === dispute.id;
            const isResolving = resolvingId === dispute.id;

            return (
              <div 
                key={dispute.id}
                className="glass rounded-2xl p-5 border border-border/40 space-y-4 transition-all duration-200 hover:border-border"
              >
                {/* User & Meta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold">{dispute.student_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Disputed on {format(new Date(dispute.created_at), 'MMM dd, yyyy · h:mm a')}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    dispute.status === 'open' 
                      ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                      : dispute.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                      : 'bg-destructive/10 text-destructive border-destructive/25'
                  }`}>
                    {dispute.status}
                  </span>
                </div>

                {/* Dispute Reason */}
                <div className="bg-secondary/40 border border-border/40 rounded-xl p-3 text-xs leading-relaxed">
                  <span className="font-semibold text-muted-foreground block mb-1">Reason:</span>
                  &ldquo;{dispute.reason}&rdquo;
                </div>

                {/* Ticket and Amount Stats */}
                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Receipt size={14} className="text-emerald-500" />
                    {dispute.ticket_count} Ticket{dispute.ticket_count > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Banknote size={14} className="text-emerald-500" />
                    ₦{Number(dispute.amount).toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons for Open Status */}
                {dispute.status === 'open' && (
                  <div className="pt-2 border-t border-border/30">
                    {!isConfirming ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="primary" 
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-10 py-0 text-xs font-bold rounded-xl"
                          onClick={() => setConfirmId(dispute.id)}
                          disabled={isResolving}
                        >
                          Approve Refund
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 h-10 py-0 text-xs font-bold text-destructive hover:bg-destructive/5 rounded-xl border border-transparent hover:border-destructive/10"
                          onClick={() => handleResolve(dispute.id, 'rejected')}
                          disabled={isResolving}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 rounded-xl text-center animate-fade-in">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-1.5">
                          <AlertTriangle size={14} />
                          Are you sure you want to approve this refund?
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Approved refunds will instantly deduct ₦{Number(dispute.amount).toLocaleString()} from your daily earnings and credit the student.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary" 
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-9 py-0 text-xs font-bold rounded-xl"
                            onClick={() => handleResolve(dispute.id, 'approved')}
                            disabled={isResolving}
                          >
                            Yes, Approve Refund
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 h-9 py-0 text-xs font-bold rounded-xl"
                            onClick={() => setConfirmId(null)}
                            disabled={isResolving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resolved Info */}
                {dispute.status !== 'open' && dispute.resolved_at && (
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/30">
                    {dispute.status === 'approved' ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <XCircle size={12} className="text-destructive" />
                    )}
                    <span>
                      Resolved on {format(new Date(dispute.resolved_at), 'MMM dd, yyyy · h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
