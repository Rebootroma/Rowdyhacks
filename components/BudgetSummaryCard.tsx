'use client';

import React, { useState } from 'react';
import { Vault, ShieldAlert, ArrowUpRight, TrendingUp, Settings2 } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { updateBudgetAction } from '@/actions/budget';

interface BudgetSummaryCardProps {
  budgetCents: number;
  spentCents: number;
  thresholdCents: number;
  crewId: string;
  canEdit: boolean;
}

export function BudgetSummaryCard({
  budgetCents,
  spentCents,
  thresholdCents,
  crewId,
  canEdit,
}: BudgetSummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBudget, setEditBudget] = useState((budgetCents / 100).toString());
  const [editThreshold, setEditThreshold] = useState((thresholdCents / 100).toString());
  const [loading, setLoading] = useState(false);

  const remainingCents = budgetCents - spentCents;
  const isOverBudget = remainingCents < 0;
  const utilizationRatio = budgetCents > 0 ? spentCents / budgetCents : 0;
  const utilizationPercent = Math.min(Math.round(utilizationRatio * 100), 999);

  let barColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  if (utilizationRatio > 1.0) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (utilizationRatio > 0.85) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (utilizationRatio > 0.7) {
    barColor = 'bg-cyan-500';
    badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const amountCents = Math.round(parseFloat(editBudget) * 100);
    const threshold = Math.round(parseFloat(editThreshold) * 100);

    await updateBudgetAction({
      crewId,
      month: '2026-10-01',
      amountCents,
      approvalThresholdCents: threshold,
    });
    setLoading(false);
    setIsEditing(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
      {/* Subtle Background Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/80 text-emerald-400">
            <Vault className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
              Monthly Shared Vault
            </h2>
            <p className="text-xs text-slate-400">Pacing for October 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} flex items-center gap-1`}
          >
            {utilizationPercent}% Utilized
          </span>
          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Configure Vault Limit & Approval Threshold"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 mb-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configure Vault Parameters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Monthly Vault Budget ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                2-Approval Threshold ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={editThreshold}
                onChange={(e) => setEditThreshold(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">
                Expenses at or above this require 2 approvals
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      ) : null}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Vault Limit
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono mt-1">
            {formatCents(budgetCents)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>2-Approval Threshold:</span>
            <strong className="text-emerald-400 font-mono">{formatCents(thresholdCents)}</strong>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Approved Spent
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono mt-1">
            {formatCents(spentCents)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" />
            <span>Active team operations</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {isOverBudget ? 'Vault Overrun' : 'Remaining Balance'}
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              isOverBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isOverBudget ? `-${formatCents(Math.abs(remainingCents))}` : formatCents(remainingCents)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isOverBudget ? (
              <span className="text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Exceeds target
              </span>
            ) : (
              <span>Available for operations</span>
            )}
          </div>
        </div>
      </div>

      {/* Utilization Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Vault Utilization Pace</span>
          <span className="font-mono text-slate-300">
            {formatCents(spentCents)} of {formatCents(budgetCents)}
          </span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(utilizationRatio * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
