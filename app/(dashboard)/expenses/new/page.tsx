'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDemoState, DemoStoreState } from '@/lib/demo/demo-store';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export default function NewExpensePage() {
  const [state, setState] = useState<DemoStoreState | null>(null);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  const approvedExpenses = state.expenses.filter((e) => e.status === 'approved');
  const spentCents = approvedExpenses.reduce((acc, e) => acc + e.amount_cents, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-['Outfit']">
            Add Vault Expense
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic integer splits, live spend impact checks, and vision receipt parsing
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <ExpenseForm
          crewId={state.crew.id}
          members={state.members}
          budgetCents={state.budget.amount_cents}
          spentCents={spentCents}
          thresholdCents={state.budget.approval_threshold_cents}
        />
      </div>
    </div>
  );
}
