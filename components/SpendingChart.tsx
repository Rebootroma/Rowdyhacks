'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/domain';
import { formatCents } from '@/lib/utils';
import { PieChart as ChartIcon } from 'lucide-react';

interface SpendingChartProps {
  categorySpending: Record<ExpenseCategory, number>;
  totalApprovedCents: number;
}

export function SpendingChart({ categorySpending, totalApprovedCents }: SpendingChartProps) {
  const chartData = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat.label,
    categoryId: cat.id,
    amountCents: categorySpending[cat.id] || 0,
    color: cat.color,
  })).filter((item) => item.amountCents > 0);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct =
        totalApprovedCents > 0
          ? ((data.amountCents / totalApprovedCents) * 100).toFixed(1)
          : '0';
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs">
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            {data.name}
          </div>
          <div className="text-emerald-400 font-mono font-bold mt-1">
            {formatCents(data.amountCents)} ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/80 text-emerald-400">
              <ChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
                Spending by Category
              </h2>
              <p className="text-xs text-slate-400">Approved allocations this month</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">
            Total: {formatCents(totalApprovedCents)}
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No approved category expenses recorded yet.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="w-full md:w-1/2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip content={customTooltip} />
                  <Pie
                    data={chartData}
                    dataKey="amountCents"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown List */}
            <div className="w-full md:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
              {chartData.map((item) => {
                const percent =
                  totalApprovedCents > 0
                    ? Math.round((item.amountCents / totalApprovedCents) * 100)
                    : 0;
                return (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-300 truncate max-w-[120px]">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-200 font-medium">
                        {formatCents(item.amountCents)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono w-8 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
