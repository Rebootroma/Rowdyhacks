'use client';

import React, { useState } from 'react';
import { Expense, UserProfile } from '@/types/domain';
import { formatCents, formatDate } from '@/lib/utils';
import { recordApprovalAction } from '@/actions/expenses';
import { getDemoState, saveDemoState } from '@/lib/demo/demo-store';
import { SolanaVerificationModal } from '@/components/SolanaVerificationModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Cpu,
} from 'lucide-react';

interface ApprovalCardProps {
  expense: Expense;
  currentUser: UserProfile;
  thresholdCents: number;
}

export function ApprovalCard({ expense, currentUser, thresholdCents }: ApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [anchorInfo, setAnchorInfo] = useState<{ signature: string; digest: string } | null>(null);

  const isCreator = expense.created_by === currentUser.id;
  const existingVote = expense.approvals?.find((a) => a.user_id === currentUser.id);

  const approvals = expense.approvals?.filter((a) => a.decision === 'approved') || [];
  const rejections = expense.approvals?.filter((a) => a.decision === 'rejected') || [];

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    const res = await recordApprovalAction(expense.id, decision);
    if (!res.success) {
      setError(res.error || 'Failed to record decision');
    } else if (res.expense) {
      const currentState = getDemoState();
      const updatedExpenses = currentState.expenses.map((e) =>
        e.id === res.expense.id ? res.expense : e
      );
      let updatedAnchors = currentState.solanaAnchors || [];
      if (res.solanaAnchor) {
        updatedAnchors = [
          res.solanaAnchor,
          ...updatedAnchors.filter((a) => a.expenseId !== res.expense.id),
        ];
        setAnchorInfo({
          signature: res.solanaAnchor.signature,
          digest: res.solanaAnchor.digest,
        });
      }
      saveDemoState({
        ...currentState,
        expenses: updatedExpenses,
        solanaAnchors: updatedAnchors,
      });
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition-all shadow-md">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100 font-['Outfit']">
              {expense.title}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Pending (2 Required)
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>By {expense.creator?.display_name || 'Member'}</span>
            <span>•</span>
            <span>{formatDate(expense.expense_date)}</span>
            {expense.merchant && (
              <>
                <span>•</span>
                <span className="text-slate-300">{expense.merchant}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold font-mono text-emerald-400">
            {formatCents(expense.amount_cents)}
          </div>
          <div className="text-[10px] text-amber-400/90 font-mono">
            Exceeds {formatCents(thresholdCents)} threshold
          </div>
        </div>
      </div>

      {/* Description if present */}
      {expense.description && (
        <p className="text-xs text-slate-300 my-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          {expense.description}
        </p>
      )}

      {/* Progress & Voting Matrix */}
      <div className="my-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Approval Status:
          </span>
          <span className="font-mono text-slate-200">
            {approvals.length} of 2 Approvals
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${Math.min((approvals.length / 2) * 100, 100)}%` }}
          />
        </div>

        {/* Voter Avatars / Names */}
        {expense.approvals && expense.approvals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span>Decisions recorded:</span>
            {expense.approvals.map((appr) => (
              <span
                key={appr.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                  appr.decision === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                {appr.decision === 'approved' ? (
                  <CheckCircle2 className="w-2.5 h-2.5" />
                ) : (
                  <XCircle className="w-2.5 h-2.5" />
                )}
                {appr.profile?.display_name || 'Member'}: {appr.decision === 'approved' ? 'Approved ✓' : 'Rejected ✕'}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="my-2 p-2 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Decision Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {isCreator ? (
            <span className="text-slate-400 italic">
              You submitted this expense. Other crew members must vote to approve.
            </span>
          ) : existingVote ? (
            <span className="text-emerald-400 font-medium">
              You voted {existingVote.decision === 'approved' ? 'Approved ✓' : 'Rejected ✕'}.
            </span>
          ) : (
            <span>Cast your decision to finalize or reject this allocation.</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleDecision('rejected')}
            disabled={loading || isCreator || !!existingVote}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject ✕</span>
          </button>

          <button
            onClick={() => handleDecision('approved')}
            disabled={loading || isCreator || !!existingVote}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/60 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve ✓</span>
          </button>
        </div>
      </div>

      {/* Solana Anchor Callout if finalized */}
      {(() => {
        const currentAnchor = anchorInfo || getDemoState().solanaAnchors?.find((a) => a.expenseId === expense.id);
        if (!currentAnchor) return null;
        return (
          <div className="mt-4 p-3 rounded-lg bg-violet-950/40 border border-violet-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-violet-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="font-semibold text-violet-200">Anchored on Solana Devnet</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                  Tx: {currentAnchor.signature.slice(0, 16)}...
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setAnchorInfo({ signature: currentAnchor.signature, digest: currentAnchor.digest });
                setShowVerifyModal(true);
              }}
              className="px-2.5 py-1 rounded-md bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 text-[11px] font-medium transition shrink-0"
            >
              Verify On-Chain
            </button>
          </div>
        );
      })()}

      {/* Verification Modal */}
      {showVerifyModal && anchorInfo && (
        <SolanaVerificationModal
          isOpen={true}
          onClose={() => setShowVerifyModal(false)}
          signature={anchorInfo.signature}
          digest={anchorInfo.digest}
          expenseTitle={expense.title}
          amountCents={expense.amount_cents}
        />
      )}
    </div>
  );
}
