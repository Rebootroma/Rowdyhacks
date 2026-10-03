'use client';

import React, { useState, useEffect } from 'react';
import {
  getDemoState,
  getCurrentUser,
  DemoStoreState,
} from '@/lib/demo/demo-store';
import { ApprovalCard } from '@/components/ApprovalCard';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { formatCents } from '@/lib/utils';

export default function ApprovalsPage() {
  const [state, setState] = useState<DemoStoreState | null>(null);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  const currentUser = getCurrentUser(state);
  const pendingExpenses = state.expenses.filter((e) => e.status === 'pending');
  const finalizedExpenses = state.expenses.filter((e) => e.status === 'approved' && e.approval_required);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Dual-Approval Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Expenses $\ge$ {formatCents(state.budget.approval_threshold_cents)} require 2 crew votes to finalize. 1 rejection rejects the allocation.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Voting as:</span>
          <span className="text-slate-200 font-semibold">{currentUser.display_name}</span>
        </div>
      </div>

      {/* Pending Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200 font-['Outfit'] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Active Approval Requests ({pendingExpenses.length})
          </h2>
          <span className="text-xs text-slate-500">
            Switch personas in the header to test multi-user voting
          </span>
        </div>

        {pendingExpenses.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-2 border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">
              All Clear! No Pending Approvals
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any future expenses exceeding {formatCents(state.budget.approval_threshold_cents)} will automatically populate this queue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingExpenses.map((expense) => (
              <ApprovalCard
                key={expense.id}
                expense={expense}
                currentUser={currentUser}
                thresholdCents={state.budget.approval_threshold_cents}
              />
            ))}
          </div>
        )}
      </div>

      {/* Finalized Approved with Dual Approval */}
      {finalizedExpenses.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h2 className="text-base font-semibold text-slate-200 font-['Outfit'] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Previously Approved via Dual Consent ({finalizedExpenses.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalizedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{exp.title}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCents(exp.amount_cents)}
                  </span>
                </div>
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Merchant: {exp.merchant || 'N/A'}</span>
                  <span className="text-emerald-400 font-medium">Approved ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
