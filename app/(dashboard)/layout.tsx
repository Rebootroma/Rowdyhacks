import React from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none vault-gradient opacity-60 z-0" />
      <div className="fixed inset-0 pointer-events-none subtle-grid opacity-25 z-0" />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500 bg-[#090d16]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CrewCash • Non-custodial Hackathon Budgeting Architecture</span>
            <span className="font-mono text-[11px] text-slate-400">
              Integer-Cents Invariant • RLS Protected • Deterministic Financial Health
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
