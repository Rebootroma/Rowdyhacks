'use client';

import React, { useState, useEffect } from 'react';
import { getDemoState, DemoStoreState } from '@/lib/demo/demo-store';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { Target, PlusCircle, Trophy } from 'lucide-react';
import { formatCents } from '@/lib/utils';

export default function GoalsPage() {
  const [state, setState] = useState<DemoStoreState | null>(null);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  const totalSaved = state.goals.reduce((acc, g) => acc + g.current_cents, 0);
  const totalTarget = state.goals.reduce((acc, g) => acc + g.target_cents, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight flex items-center gap-2.5">
            <Target className="w-7 h-7 text-emerald-400" />
            Crew Missions & Savings Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Collaborative group savings goals for hardware, apartment upgrades, and events.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs flex items-center gap-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Total Saved</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">
              {formatCents(totalSaved)}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Total Target</span>
            <span className="text-slate-200 font-mono font-bold text-sm">
              {formatCents(totalTarget)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.goals.map((goal) => (
          <SavingsGoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
