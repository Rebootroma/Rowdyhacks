'use client';

import React from 'react';
import { AuditLog } from '@/types/domain';
import { formatDate } from '@/lib/utils';
import { Shield, Clock, User, CheckCircle2, AlertCircle, FileText, TrendingUp, Brain } from 'lucide-react';

interface AuditLogFeedProps {
  logs: AuditLog[];
}

export function AuditLogFeed({ logs }: AuditLogFeedProps) {
  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return (
        <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
          {action.replace(/_/g, ' ')}
        </span>
      );
    }
    if (action.includes('REJECTED')) {
      return (
        <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
          {action.replace(/_/g, ' ')}
        </span>
      );
    }
    if (action.includes('PENDING')) {
      return (
        <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
          {action.replace(/_/g, ' ')}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const renderMetadata = (log: AuditLog) => {
    const meta = log.metadata as any;
    if (meta.category === 'investment') {
      return (
        <div className="mt-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Crew Investment Executed</span>
          </div>
          <div className="text-[11px] text-slate-300">
            {meta.title} — Impacted Shared Budget
          </div>
        </div>
      );
    }
    return (
      <div className="text-[11px] text-slate-400 font-mono">
        {JSON.stringify(log.metadata)
          .replace(/[\{\}\"]/g, '')
          .replace(/,/g, ', ')}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700/80">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
              Security & Audit Trail
            </h2>
            <p className="text-xs text-slate-400">Tamper-evident log of all vault operations</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Immutable Log
        </span>
      </div>

      <div className="space-y-3">
        {logs.slice(0, 10).map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between gap-3 text-xs bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">
                    {log.actor?.display_name || 'System / Member'}
                  </span>
                  {getActionBadge(log.action)}
                </div>
                <div className="text-right shrink-0 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
              {renderMetadata(log)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
