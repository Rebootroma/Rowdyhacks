'use client';

import React, { useState } from 'react';
import { SavingsGoal } from '@/types/domain';
import { formatCents, formatDate, parseDollarsToCents } from '@/lib/utils';
import { contributeGoalAction } from '@/actions/goals';
import { Target, PlusCircle, CheckCircle2, Trophy } from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export function SavingsGoalCard({ goal }: SavingsGoalCardProps) {
  const [isContributing, setIsContributing] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);

  const percent = Math.min(Math.round((goal.current_cents / goal.target_cents) * 100), 100);
  const isCompleted = goal.current_cents >= goal.target_cents;

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseDollarsToCents(amountInput);
    if (cents <= 0) return;

    setLoading(true);
    await contributeGoalAction(goal.id, cents);
    setLoading(false);
    setIsContributing(false);
    setAmountInput('');
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition-all shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-['Outfit']">
                {goal.title}
              </h3>
              {goal.due_date && (
                <p className="text-[11px] text-slate-400">Target Date: {formatDate(goal.due_date)}</p>
              )}
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}
          >
            {percent}%
          </span>
        </div>

        {/* Progress Display */}
        <div className="my-4 space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono text-emerald-400 font-bold text-base">
              {formatCents(goal.current_cents)}
            </span>
            <span className="text-slate-400 font-mono">
              of {formatCents(goal.target_cents)}
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {isContributing && (
          <form onSubmit={handleContribute} className="my-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-[11px] font-medium text-slate-300">
              Contribution Amount ($)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="25.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="pt-2 flex justify-between items-center text-xs">
        {isCompleted ? (
          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
            <Trophy className="w-3.5 h-3.5" /> Mission Accomplished!
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">
            {formatCents(goal.target_cents - goal.current_cents)} to target
          </span>
        )}

        <button
          onClick={() => setIsContributing(!isContributing)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{isContributing ? 'Cancel' : 'Contribute'}</span>
        </button>
      </div>
    </div>
  );
}
