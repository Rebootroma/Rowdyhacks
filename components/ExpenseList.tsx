'use client';

import React, { useState } from 'react';
import { Expense, EXPENSE_CATEGORIES } from '@/types/domain';
import { formatCents, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Search,
  Filter,
  Users,
  ChevronDown,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onSelectExpense?: (expense: Expense) => void;
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (
      search &&
      !e.title.toLowerCase().includes(search.toLowerCase()) &&
      !e.merchant?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: Expense['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Approved ✓
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending …
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected ✕
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Vault Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400">
            {filtered.length} of {expenses.length} total operations
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search title, merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-44 sm:w-52"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* List Content */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No expenses match the selected filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => {
            const isExpanded = expandedId === expense.id;
            const categoryObj = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);

            return (
              <div
                key={expense.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition-all"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-700/60"
                      style={{
                        backgroundColor: `${categoryObj?.color || '#64748b'}15`,
                        color: categoryObj?.color || '#64748b',
                      }}
                    >
                      <Receipt className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <span>{expense.title}</span>
                        {getStatusBadge(expense.status)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{formatDate(expense.expense_date)}</span>
                        {expense.merchant && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">{expense.merchant}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{expense.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-100">
                        {formatCents(expense.amount_cents)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {expense.splits?.length || 1} splits
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Splits Breakdown */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                    {expense.description && (
                      <p className="text-xs text-slate-300 italic mb-2">
                        "{expense.description}"
                      </p>
                    )}

                    <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-emerald-400" />
                      Integer-Cent Equal Member Splits
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {expense.splits?.map((split) => (
                        <div
                          key={split.id}
                          className="flex items-center justify-between text-xs bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60"
                        >
                          <span className="text-slate-300 truncate">
                            {split.profile?.display_name || 'Member'}
                          </span>
                          <span className="font-mono font-medium text-emerald-400">
                            {formatCents(split.amount_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
