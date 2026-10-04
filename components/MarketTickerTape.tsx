'use client';

import React, { useEffect, useState } from 'react';
import { MarketQuote } from '@/types/v2';
import { TrendingUp, TrendingDown, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

export function MarketTickerTape() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [provider, setProvider] = useState<string>('demo');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchQuotes = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch('/api/market/quotes');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setQuotes(json.data);
        setProvider(json.provider || 'demo');
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch market quotes:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(() => fetchQuotes(true), 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-['Outfit']">
                Educational Market Ticker
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                provider !== 'demo'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              }`}>
                {provider !== 'demo' ? `${provider.toUpperCase()} LIVE` : 'DEMO TICKER FEED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Benchmark indices & student club asset classes (TimescaleDB hypertable backed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-slate-500 font-mono">
              Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={() => fetchQuotes(false)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition disabled:opacity-50"
            title="Refresh market prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ticker Marquee Row */}
      <div className="overflow-hidden w-full relative group">
        {/* Gradient fades for edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[rgba(15,23,42,0.9)] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[rgba(15,23,42,0.9)] to-transparent z-10"></div>

        <div className="animate-marquee">
          {[...quotes, ...quotes].map((q, idx) => {
            const isPositive = q.change >= 0;
            return (
              <div
                key={`${q.symbol}-${idx}`}
                className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between mx-1.5 w-[140px] shrink-0"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-200 font-mono">{q.symbol}</span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                      isPositive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {isPositive ? '+' : ''}
                    {q.changePercent.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-semibold text-slate-100 font-mono">
                    ${q.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isPositive ? '+' : ''}${q.change.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          For educational simulations only. Does not constitute investment advice.
        </span>
        <span className="font-mono">Finnhub / Polygon / AlphaVantage compatible</span>
      </div>
    </div>
  );
}
