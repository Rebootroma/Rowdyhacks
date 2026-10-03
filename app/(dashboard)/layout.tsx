import React from 'react';
import { Header } from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none vault-gradient opacity-60 z-0" />
      <div className="fixed inset-0 pointer-events-none subtle-grid opacity-25 z-0" />

      {/* Interactive Header with Live Persona Switcher */}
      <Header />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-[#090d16]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CrewCash • Non-custodial Hackathon Budgeting Architecture</span>
          <span className="font-mono text-[11px] text-slate-400">
            Integer-Cents Invariant • RLS Protected • Deterministic Financial Health
          </span>
        </div>
      </footer>
    </div>
  );
}
