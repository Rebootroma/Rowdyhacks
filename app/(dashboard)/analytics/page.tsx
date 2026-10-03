'use client';

import React, { useState, useEffect } from 'react';
import { getDemoState, DemoStoreState } from '@/lib/demo/demo-store';
import { SpendingChart } from '@/components/SpendingChart';
import { detectSpendingAnomalies } from '@/lib/finance/anomalies';
import { ExpenseCategory, BudgetRescueResult, SpendingAnomaly } from '@/types/domain';
import { formatCents } from '@/lib/utils';
import {
  PieChart,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Scissors,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [state, setState] = useState<DemoStoreState | null>(null);
  const [rescuePlan, setRescuePlan] = useState<BudgetRescueResult | null>(null);
  const [loadingRescue, setLoadingRescue] = useState(false);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  const approvedExpenses = state.expenses.filter((e) => e.status === 'approved');
  const spentCents = approvedExpenses.reduce((acc, e) => acc + e.amount_cents, 0);

  const categorySpending = approvedExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount_cents;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Detect statistical anomalies
  const anomalies: { anomaly: SpendingAnomaly; title: string }[] = [];
  approvedExpenses.forEach((exp) => {
    const a = detectSpendingAnomalies(exp, approvedExpenses, state.budget.amount_cents - spentCents);
    if (a) {
      anomalies.push({ anomaly: a, title: exp.title });
    }
  });

  const handleGenerateRescue = async () => {
    setLoadingRescue(true);
    try {
      const res = await fetch('/api/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyBudgetCents: state.budget.amount_cents,
          approvedSpendingCents: spentCents,
          categorySpending,
        }),
      });
      const data = await res.json();
      if (data.success && data.rescue) {
        setRescuePlan(data.rescue);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRescue(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight flex items-center gap-2.5">
          <PieChart className="w-7 h-7 text-cyan-400" />
          Vault Intel & Strategic Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Deep telemetry on category spending, statistical anomaly detection, and tactical budget rescue plans.
        </p>
      </div>

      {/* Spending Breakdown Chart */}
      <div className="grid grid-cols-1 gap-6">
        <SpendingChart
          categorySpending={categorySpending}
          totalApprovedCents={spentCents}
        />
      </div>

      {/* Statistical Anomaly Detection Engine */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
                Statistical Spending Anomaly Engine
              </h2>
              <p className="text-xs text-slate-400">
                Non-AI statistical standard deviation (2σ) baseline analysis
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {anomalies.length} Flagged
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All approved transactions are within historical standard deviation bounds.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs flex items-start gap-3"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                      {item.anomaly.severity} Severity
                    </span>
                  </div>
                  <p className="text-slate-300">{item.anomaly.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tactical Budget Rescue Plan */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
                Tactical Budget Rescue
              </h2>
              <p className="text-xs text-slate-400">
                Actionable adjustment suggestions prioritizing discretionary cuts
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateRescue}
            disabled={loadingRescue}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loadingRescue ? 'Calculating Plan...' : 'Calculate Budget Rescue'}</span>
          </button>
        </div>

        {rescuePlan ? (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30">
              <h3 className="text-sm font-bold text-slate-100">{rescuePlan.headline}</h3>
              <p className="text-xs text-slate-400 mt-1">{rescuePlan.safetyNotes}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {rescuePlan.adjustments.map((adj, i) => (
                <div
                  key={i}
                  className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {adj.category}
                    </span>
                    <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                      {adj.actionText}
                    </p>
                  </div>
                  <div className="pt-2 text-xs font-mono font-bold text-emerald-400 border-t border-slate-800">
                    Est. Preservation: {formatCents(adj.recommendedCutCents)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            Click "Calculate Budget Rescue" above to evaluate discretionary adjustments.
          </div>
        )}
      </div>
    </div>
  );
}
