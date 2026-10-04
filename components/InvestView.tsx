'use client';

import React, { useState, useEffect } from 'react';
import { getDemoState, DemoStoreState, createExpense } from '@/lib/demo/demo-store';
import { MarketTickerTape } from '@/components/MarketTickerTape';
import { Brain, TrendingUp, DollarSign, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function InvestView() {
  const router = useRouter();
  const [state, setState] = useState<DemoStoreState | null>(null);
  
  const [ticker, setTicker] = useState('AAPL');
  const [shares, setShares] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  useEffect(() => {
    if (!ticker) return;
    const fetchPrice = async () => {
      setIsFetchingPrice(true);
      try {
        const res = await fetch(`/api/market/quotes?symbol=${ticker}`);
        const data = await res.json();
        if (data && data.price) {
          setCurrentPrice(data.price);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingPrice(false);
    };
    fetchPrice();
  }, [ticker]);

  if (!state) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm animate-pulse">
        Loading Investment Terminal...
      </div>
    );
  }

  const approvedExpenses = state.expenses.filter((e) => e.status === 'approved');
  const spentCents = approvedExpenses.reduce((acc, e) => acc + e.amount_cents, 0);
  const remainingCents = state.budget.amount_cents - spentCents;

  const totalCostCents = Math.round(shares * currentPrice * 100);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/market/analyze-investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          shares,
          currentPrice,
          totalCostCents,
          remainingBudgetCents: remainingCents,
          crewName: state.crew.name
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis("Analysis unavailable right now.");
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis("Error generating AI analysis.");
    }
    setIsAnalyzing(false);
  };

  const handleInvest = () => {
    if (totalCostCents <= 0) return;
    
    createExpense({
      title: `Investment: ${shares} shares of ${ticker}`,
      merchant: ticker,
      description: `Paper trade investment in ${ticker} at $${currentPrice.toFixed(2)} per share.`,
      amountCents: totalCostCents,
      category: 'investment' as any,
      expenseDate: new Date().toISOString().split('T')[0],
      memberIds: state.members.map(m => m.user_id),
    });
    
    // Redirect to dashboard or approvals to see it
    router.push('/dashboard');
  };

  const isOverBudget = totalCostCents > remainingCents;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-400" />
          Crew Investments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform paper trading runs using {state.crew.name}'s shared vault.
        </p>
      </div>

      <MarketTickerTape />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Form */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            New Trade
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="e.g. AAPL"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Shares
                </label>
                <input
                  type="number"
                  min="1"
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Current Price
                </label>
                <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-300 font-mono flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  {isFetchingPrice ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : currentPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/50 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Investment Cost</span>
                <span className="font-mono text-slate-200">{formatCents(totalCostCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Remaining Budget</span>
                <span className="font-mono text-emerald-400">{formatCents(remainingCents)}</span>
              </div>
              
              {isOverBudget && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300">
                    This investment exceeds your crew's remaining budget. It will require approval and may strain your finances.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !ticker || currentPrice === 0}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4 text-indigo-400" />}
                Ask AI Helper
              </button>
              
              <button
                onClick={handleInvest}
                disabled={totalCostCents <= 0}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition disabled:opacity-50 disabled:shadow-none"
              >
                Execute Trade
              </button>
            </div>
          </div>
        </div>

        {/* AI Helper Analysis Panel */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col">
          <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            AI Investment Advisor
          </h2>
          
          <div className="flex-1 bg-slate-950/50 rounded-xl border border-indigo-500/10 p-5 overflow-y-auto">
            {!aiAnalysis && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <Brain className="w-12 h-12 text-slate-500 mb-3" />
                <p className="text-sm text-slate-400 max-w-[250px]">
                  Select an investment and Ask AI Helper to analyze its impact on your crew's financial health.
                </p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
                <p className="text-sm text-indigo-300 animate-pulse">
                  Analyzing team impact & budget safety...
                </p>
              </div>
            )}
            
            {aiAnalysis && !isAnalyzing && (
              <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed">
                {aiAnalysis.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
