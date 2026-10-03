'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Vault,
  Receipt,
  CheckCircle2,
  PieChart,
  Target,
  Users,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { DEMO_USERS } from '@/lib/demo/demo-data';
import {
  getDemoState,
  setCurrentUser,
  resetDemoState,
  DemoStoreState,
} from '@/lib/demo/demo-store';

export function Header() {
  const pathname = usePathname();
  const [state, setState] = useState<DemoStoreState | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  const currentUser =
    Object.values(DEMO_USERS).find((u) => u.id === state.currentUserId) || DEMO_USERS.alex;
  const currentMember = state.members.find((m) => m.user_id === currentUser.id);

  const pendingCount = state.expenses.filter((e) => e.status === 'pending').length;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(state.crew.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset demo state back to default Roadrunner House seeds?')) {
      resetDemoState();
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Vault', icon: Vault },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    {
      href: '/approvals',
      label: 'Approvals',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { href: '/analytics', label: 'Intel', icon: PieChart },
    { href: '/goals', label: 'Missions', icon: Target },
    { href: '/members', label: 'Crew', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      {/* Top Demo Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 px-4 py-1.5 border-b border-emerald-500/20 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300 tracking-wide uppercase text-[10px]">
            Demo Mode Active
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">
            Crew: <strong className="text-slate-100">{state.crew.name}</strong>
          </span>
          <button
            onClick={handleCopyInvite}
            title="Click to copy invite code"
            className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px] font-mono transition-colors"
          >
            <span>{state.crew.invite_code}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Persona Switcher & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsPersonaOpen(!isPersonaOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 text-xs font-medium transition"
            >
              <span className="text-slate-400">Persona:</span>
              <span className="text-emerald-400 font-semibold">{currentUser.display_name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded uppercase">
                {currentMember?.role || 'member'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isPersonaOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-lg bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Switch Active Persona
                </div>
                {Object.values(DEMO_USERS).map((user) => {
                  const m = state.members.find((mem) => mem.user_id === user.id);
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user.id);
                        setIsPersonaOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{user.display_name}</div>
                        <div className="text-[10px] text-slate-500">{user.email}</div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {m?.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            title="Reset to fresh demo seeds"
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-950/20 transition text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/60 group-hover:scale-105 transition-transform">
                <Vault className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent font-['Outfit']">
                  CrewCash
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono -mt-1">
                  Shared Vault
                </span>
              </div>
            </Link>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/expenses/new"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-emerald-950/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
