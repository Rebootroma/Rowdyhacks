'use client';

import React, { useState } from 'react';
import { ShieldCheck, Activity, Sparkles, AlertTriangle, CheckCircle, ChevronRight, HelpCircle } from 'lucide-react';
import { HealthScoreResult, BudgetExplanation } from '@/types/domain';

interface HealthScoreCardProps {
  health: HealthScoreResult;
  crewName: string;
  monthlyBudgetCents: number;
  approvedSpendingCents: number;
  remainingCents: number;
  categorySpending: Record<string, number>;
  anomaliesCount: number;
}

export function HealthScoreCard({
  health,
  crewName,
  monthlyBudgetCents,
  approvedSpendingCents,
  remainingCents,
  categorySpending,
  anomaliesCount,
}: HealthScoreCardProps) {
  const [insight, setInsight] = useState<BudgetExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewName,
          monthlyBudgetCents,
          approvedSpendingCents,
          remainingCents,
          utilizationPercent:
            monthlyBudgetCents > 0
              ? Math.round((approvedSpendingCents / monthlyBudgetCents) * 100)
              : 0,
          healthScore: health.score,
          categorySpending,
          anomaliesCount,
        }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setInsight(data.explanation);
      }
    } catch (err) {
      console.error('Failed to load AI insights', err);
    } finally {
      setLoading(false);
    }
  };

  // Circular gauge calculation
  const strokeDashoffset = 283 - (283 * health.score) / 100;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/80 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
                Financial Health Score
              </h2>
              <p className="text-xs text-slate-400">Deterministic Algorithm (0–100)</p>
            </div>
          </div>

          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
            style={{
              color: health.color,
              borderColor: `${health.color}40`,
              backgroundColor: `${health.color}15`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: health.color }}
            />
            {health.label}
          </span>
        </div>

        {/* Dial & Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
          {/* SVG Circular Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={health.color}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono text-slate-100">
                {health.score}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                / 100
              </span>
            </div>
          </div>

          {/* Text Summary */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-sm font-medium text-slate-200">
              {health.score >= 90
                ? 'Exceptional vault discipline and spending distribution.'
                : health.score >= 75
                ? 'Healthy pacing with safe operational reserves.'
                : health.score >= 60
                ? 'Moderate budget pressure detected. Review upcoming splits.'
                : 'Vault pace requires attention. High burn rate detected.'}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculated deterministically from vault utilization, discretionary ratios, active anomalies, and mission targets.
            </p>
            <button
              onClick={() => setShowFactors(!showFactors)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition"
            >
              <span>{showFactors ? 'Hide Score Breakdown' : 'View Scoring Factors'}</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${showFactors ? 'rotate-90' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Factors Breakdown */}
        {showFactors && (
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Scoring Factors Breakdown
            </div>
            {health.factors.map((f, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs gap-3">
                <span className="text-slate-300 flex-1">{f.explanation}</span>
                <span
                  className={`font-mono font-bold shrink-0 ${
                    f.impact > 0
                      ? 'text-emerald-400'
                      : f.impact < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {f.impact > 0 ? `+${f.impact}` : f.impact} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {/* AI Intel Briefing Output */}
        {insight && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 shadow-lg space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                CrewCash Intel Briefing
              </span>
              <span className="text-[10px] text-slate-500">AI Narrative Analysis</span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">{insight.headline}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{insight.summary}</p>

            {insight.observations.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Key Observations</span>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                  {insight.observations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.suggestions.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">Suggestions</span>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                  {insight.suggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={fetchAIInsights}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{loading ? 'Analyzing Vault...' : insight ? 'Refresh AI Intel' : 'Generate AI Intel Briefing'}</span>
        </button>
      </div>
    </div>
  );
}
