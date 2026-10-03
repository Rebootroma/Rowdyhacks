'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ReceiptExtraction,
  UserProfile,
} from '@/types/domain';
import { formatCents, parseDollarsToCents } from '@/lib/utils';
import { calculateEqualSplit } from '@/lib/finance/splits';
import { calculateSpendWarning } from '@/lib/finance/budget';
import { createExpenseAction } from '@/actions/expenses';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Receipt,
  Users,
  Calendar,
  DollarSign,
  Building,
  Upload,
  FileText,
  Check,
} from 'lucide-react';

interface ExpenseFormProps {
  crewId: string;
  members: { user_id: string; profile?: UserProfile }[];
  budgetCents: number;
  spentCents: number;
  thresholdCents: number;
  initialExtraction?: ReceiptExtraction | null;
}

export function ExpenseForm({
  crewId,
  members,
  budgetCents,
  spentCents,
  thresholdCents,
  initialExtraction,
}: ExpenseFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialExtraction?.merchant ? `${initialExtraction.merchant} Restock` : '');
  const [merchant, setMerchant] = useState(initialExtraction?.merchant || '');
  const [amountInput, setAmountInput] = useState(
    initialExtraction ? (initialExtraction.total_cents / 100).toFixed(2) : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    initialExtraction?.category || 'groceries'
  );
  const [expenseDate, setExpenseDate] = useState(
    initialExtraction?.date || new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(
    initialExtraction?.notes || ''
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    members.map((m) => m.user_id)
  );

  const [isScanning, setIsScanning] = useState(false);
  const [receiptConfidence, setReceiptConfidence] = useState<number | null>(
    initialExtraction ? initialExtraction.confidence : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse amount in cents
  const amountCents = parseDollarsToCents(amountInput);

  // Live Smart Spend Warning
  const spendWarning =
    amountCents > 0
      ? calculateSpendWarning(amountCents, budgetCents, spentCents)
      : null;

  // Live Approval Threshold Check
  const willRequireApproval = amountCents >= thresholdCents;

  // Live Equal Splits Preview
  const splitPreviews =
    amountCents > 0 && selectedMemberIds.length > 0
      ? calculateEqualSplit(amountCents, selectedMemberIds)
      : [];

  const handleMemberToggle = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length === 1) return; // Must have at least 1 member
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleSampleReceipt = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/receipts/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'sample_receipt_data',
          mimeType: 'image/jpeg',
        }),
      });
      const data = await res.json();
      if (data.success && data.extraction) {
        const ext = data.extraction as ReceiptExtraction;
        setTitle(`${ext.merchant || 'Grocery'} Supplies`);
        setMerchant(ext.merchant || '');
        setAmountInput((ext.total_cents / 100).toFixed(2));
        setCategory(ext.category);
        if (ext.date) setExpenseDate(ext.date);
        setDescription(`Extracted from ${ext.merchant}. ${ext.items.length} items cataloged.`);
        setReceiptConfidence(ext.confidence);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountCents <= 0) {
      setError('Amount must be greater than $0.00');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Select at least one member to split this expense');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createExpenseAction({
      crewId,
      title,
      merchant: merchant || null,
      description: description || null,
      amountCents,
      category,
      expenseDate,
      memberIds: selectedMemberIds,
    });

    if (res.success) {
      router.push('/expenses');
      router.refresh();
    } else {
      setError(res.error || 'Failed to submit expense');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Receipt Scanner Callout */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Receipt Vision Autofill
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload a physical receipt or trigger our demo parser to extract totals, vendor, and line items.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSampleReceipt}
          disabled={isScanning}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shrink-0 shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isScanning ? 'Extracting Receipt...' : 'Autofill Sample Receipt'}</span>
        </button>
      </div>

      {receiptConfidence !== null && (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              Receipt parsed with{' '}
              <strong className="text-emerald-300 font-mono">
                {Math.round(receiptConfidence * 100)}% confidence
              </strong>
              . Review fields below before submitting.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReceiptConfidence(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Expense Title *
          </label>
          <input
            type="text"
            required
            maxLength={120}
            placeholder="e.g. Costco Bulk Groceries, WiFi Bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Merchant / Vendor
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. Trader Joe's, Target, Amazon"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Total Amount (USD) *
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Stored as exact integer cents: {amountCents}¢
          </span>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expense Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Expense Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Operational Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Supplies for hackathon demo weekend"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Real-time Dynamic Warnings & Approval Notices */}
      {spendWarning && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            spendWarning.severity === 'critical'
              ? 'bg-rose-950/40 border-rose-800 text-rose-200'
              : spendWarning.severity === 'high'
              ? 'bg-amber-950/40 border-amber-800 text-amber-200'
              : 'bg-cyan-950/30 border-cyan-800 text-cyan-200'
          }`}
        >
          {spendWarning.severity === 'critical' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold tracking-wide uppercase text-[11px] block">
              {spendWarning.headline}
            </span>
            <span className="mt-0.5 block leading-relaxed">{spendWarning.message}</span>
          </div>
        </div>
      )}

      {/* Approval Status Notice */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          willRequireApproval
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {willRequireApproval ? (
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {willRequireApproval
              ? `Amount is $\\ge$ ${formatCents(thresholdCents)} threshold. Will require 2 crew member approvals.`
              : `Amount is under ${formatCents(thresholdCents)} threshold. Will be approved immediately.`}
          </span>
        </div>
        <span className="font-mono uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-900">
          {willRequireApproval ? 'Pending Approval' : 'Auto-Approved'}
        </span>
      </div>

      {/* Split Members Selection & Calculation */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Split Among Crew Members ({selectedMemberIds.length} Selected)
          </label>
          <span className="text-[11px] text-slate-500">
            Integer-Cent Equal Split Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {members.map((m) => {
            const isSelected = selectedMemberIds.includes(m.user_id);
            const userSplit = splitPreviews.find((s) => s.userId === m.user_id);

            return (
              <button
                type="button"
                key={m.user_id}
                onClick={() => handleMemberToggle(m.user_id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {m.profile?.display_name || 'Member'}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
                <div className="mt-2 text-xs font-mono font-bold text-emerald-400">
                  {isSelected && userSplit ? formatCents(userSplit.amountCents) : '$0.00'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Action */}
      <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || amountCents <= 0}
          className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/80 transition disabled:opacity-40"
        >
          {loading ? 'Submitting...' : willRequireApproval ? 'Request Approval' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}
