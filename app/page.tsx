import Link from 'next/link';
import { Vault, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Users, PieChart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none vault-gradient opacity-70" />
      <div className="fixed inset-0 pointer-events-none subtle-grid opacity-30" />

      {/* Hero Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/80">
            <Vault className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent font-['Outfit']">
            CrewCash
          </span>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/80 transition-all hover:scale-105"
        >
          <span>Open Shared Vault</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Engineered for RowdyHacks 2026 & Group Living</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight font-['Outfit'] leading-tight">
          The Shared Vault for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Hackathons & Crew Living
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
          Collaborative group finances without the chaos. Zero floating-point rounding errors,
          dual-approval threshold security, deterministic health scoring, and AI vision receipt processing.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left pt-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Exact Integer-Cent Splits</span>
            </div>
            <p className="text-xs text-slate-400">
              No fractional cent drift. Splits sum up to the exact cent across all members.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Users className="w-4 h-4" />
              <span>Dual-Approval Security</span>
            </div>
            <p className="text-xs text-slate-400">
              Transactions exceeding threshold require 2 crew approvals to finalize.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <PieChart className="w-4 h-4" />
              <span>Deterministic Health Score</span>
            </div>
            <p className="text-xs text-slate-400">
              Strict 0–100 algorithmic score paired with optional AI narrative briefing.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-950/80 transition-all hover:scale-105"
          >
            <span>Launch Roadrunner House Demo Vault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-3 text-xs text-slate-500">
            No sign-up required • Pre-seeded with 4 crew members, pending approvals & sample receipts
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        CrewCash • Collaborative Group Budgeting Prototype • Built for RowdyHacks
      </footer>
    </div>
  );
}
