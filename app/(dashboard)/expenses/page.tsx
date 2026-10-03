'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDemoState, DemoStoreState } from '@/lib/demo/demo-store';
import { ExpenseList } from '@/components/ExpenseList';
import { Plus, Receipt } from 'lucide-react';

export default function ExpensesPage() {
  const [state, setState] = useState<DemoStoreState | null>(null);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight">
            Vault Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete transaction history and equal integer-cent splits
          </p>
        </div>

        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/80 transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Expense</span>
        </Link>
      </div>

      <ExpenseList expenses={state.expenses} />
    </div>
  );
}
