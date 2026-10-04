'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getDemoState,
  getCurrentUser,
  DemoStoreState,
} from '@/lib/demo/demo-store';
import { calculateHealthScore } from '@/lib/finance/health-score';
import { BudgetSummaryCard } from '@/components/BudgetSummaryCard';
import { HealthScoreCard } from '@/components/HealthScoreCard';
import { SpendingChart } from '@/components/SpendingChart';
import { ExpenseList } from '@/components/ExpenseList';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { AuditLogFeed } from '@/components/AuditLogFeed';
import { VaultAudioBriefing } from '@/components/VaultAudioBriefing';
import { GeminiCoachPanel } from '@/components/GeminiCoachPanel';
import { MarketTickerTape } from '@/components/MarketTickerTape';
import { ExpenseCategory } from '@/types/domain';
import {
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Target,
  Plus,
} from 'lucide-react';
import { formatCents } from '@/lib/utils';

export function DashboardView() {
  const [state, setState] = useState<DemoStoreState | null>(null);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm animate-pulse">
        Initializing Shared Vault...
      </div>
    );
  }

  const currentUser = getCurrentUser(state);
  const currentMember = state.members.find((m) => m.user_id === currentUser.id);
  const canManageVault = currentMember?.role === 'owner' || currentMember?.role === 'treasurer';

  // Compute approved spending
  const approvedExpenses = state.expenses.filter((e) => e.status === 'approved');
  const spentCents = approvedExpenses.reduce((acc, e) => acc + e.amount_cents, 0);

  // Category spending breakdown
  const categorySpending = approvedExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount_cents;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Pending approvals
  const pendingExpenses = state.expenses.filter((e) => e.status === 'pending');

  // Goals status
  const primaryGoal = state.goals[0];
  const goalStatus = primaryGoal
    ? primaryGoal.current_cents >= primaryGoal.target_cents * 0.5
      ? 'on_track'
      : 'behind'
    : 'none';

  // Calculate Deterministic Health Score
  const healthScore = calculateHealthScore({
    budgetAmountCents: state.budget.amount_cents,
    approvedSpendingCents: spentCents,
    categorySpending,
    activeAnomaliesCount: 0,
    goalStatus,
  });

  // Generate dynamic briefing text
  const remainingCents = state.budget.amount_cents - spentCents;
  const remainingPercentage = state.budget.amount_cents > 0 ? Math.round((remainingCents / state.budget.amount_cents) * 100) : 0;
  const briefingText = `Good morning, ${currentUser.display_name}. CrewCash Mission Control update for ${state.crew.name}: Current vault balance stands at $${(remainingCents / 100).toFixed(2)} with ${remainingPercentage}% runway remaining. You have ${pendingExpenses.length} pending ${pendingExpenses.length === 1 ? 'transaction' : 'transactions'} awaiting clearance. All vault systems are green.`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner & Crew Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight">
            {state.crew.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <strong className="text-emerald-400">{currentUser.display_name}</strong> •{' '}
            <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Role: {currentMember?.role || 'Member'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/80 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Expense</span>
          </Link>
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Approvals Queue ({pendingExpenses.length})</span>
          </Link>
        </div>
      </div>

      {/* Audio Briefing */}
      <VaultAudioBriefing briefingText={briefingText} />

      {/* Pending Approvals Alert Banner */}
      {pendingExpenses.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                {pendingExpenses.length} Expense{pendingExpenses.length > 1 ? 's' : ''} Awaiting Dual Approval
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Transactions $\ge$ {formatCents(state.budget.approval_threshold_cents)} require 2 crew votes to finalize.
              </p>
            </div>
          </div>

          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shrink-0"
          >
            <span>Review Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Solana Devnet On-Chain Audit Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 px-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-violet-300">Solana Devnet Audit Active:</span>
          <span className="text-slate-400">
            {state.solanaAnchors?.length || 0} high-value transaction{state.solanaAnchors?.length === 1 ? '' : 's'} cryptographically sealed on-chain.
          </span>
        </div>
        <Link
          href="/ledger"
          className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 font-medium transition shrink-0"
        >
          <span>Open Solana Ledger</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Top 2 Cards: Budget Summary & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetSummaryCard
          budgetCents={state.budget.amount_cents}
          spentCents={spentCents}
          thresholdCents={state.budget.approval_threshold_cents}
          crewId={state.crew.id}
          canEdit={canManageVault}
        />

        <HealthScoreCard
          health={healthScore}
          crewName={state.crew.name}
          monthlyBudgetCents={state.budget.amount_cents}
          approvedSpendingCents={spentCents}
          remainingCents={state.budget.amount_cents - spentCents}
          categorySpending={categorySpending}
          anomaliesCount={0}
        />
      </div>

      {/* Gemini Financial Coach with ElevenLabs Voice */}
      <GeminiCoachPanel
        crewId={state.crew.id}
        crewName={state.crew.name}
        mode="crew"
      />

      {/* Educational Market Ticker (Finnhub / Polygon / Timescale hypertable) */}
      <MarketTickerTape />

      {/* Category Chart & Savings Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart
            categorySpending={categorySpending}
            totalApprovedCents={spentCents}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100 font-['Outfit'] flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Shared Missions
            </h2>
            <Link href="/goals" className="text-xs text-emerald-400 hover:underline">
              View All
            </Link>
          </div>
          {state.goals.map((g) => (
            <SavingsGoalCard key={g.id} goal={g} />
          ))}
        </div>
      </div>

      {/* Recent Ledger & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseList expenses={state.expenses} />
        </div>

        <div>
          <AuditLogFeed logs={state.auditLogs} />
        </div>
      </div>
    </div>
  );
}
