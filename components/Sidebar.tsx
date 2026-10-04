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
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  TrendingUp,
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Scroll,
  Menu,
  X,
} from 'lucide-react';
import { DEMO_USERS } from '@/lib/demo/demo-data';
import {
  getDemoState,
  setCurrentUser,
  resetDemoState,
  DemoStoreState,
} from '@/lib/demo/demo-store';

/* ─── NAV STRUCTURE ─────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/* ─── COMPONENT ─────────────────────────────────────── */

export function Sidebar() {
  const pathname = usePathname();
  const [state, setState] = useState<DemoStoreState | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  /* ─── GROUPED NAV ─────────────────────────────────── */

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/analytics', label: 'Intel', icon: PieChart },
      ],
    },
    {
      title: 'Operations',
      items: [
        { href: '/expenses', label: 'Expenses', icon: Receipt },
        {
          href: '/approvals',
          label: 'Approvals',
          icon: CheckCircle2,
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
        {
          href: '/ledger',
          label: 'Solana Ledger',
          icon: Shield,
          badge: (state.solanaAnchors?.length ?? 0) > 0 ? state.solanaAnchors?.length : undefined,
        },
        { href: '/invest', label: 'Investments', icon: TrendingUp },
      ],
    },
    {
      title: 'Planning',
      items: [
        { href: '/goals', label: 'Missions', icon: Target },
      ],
    },
    {
      title: 'Team',
      items: [
        { href: '/members', label: 'Crew Members', icon: Users },
      ],
    },
  ];

  /* ─── SIDEBAR CONTENT ────────────────────────────── */

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Brand ────────────────────────────────── */}
      <div className={`flex items-center px-4 pt-5 pb-4 border-b border-slate-800/60 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/60 group-hover:scale-105 transition-transform">
            <img src="/logo.jpg" alt="CrewCash" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent font-['Outfit'] leading-tight">
                CrewCash
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono -mt-0.5">
                Shared Vault
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── Crew Badge ─────────────────────────── */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold">Active Crew</p>
              <p className="text-sm font-bold text-slate-100 mt-0.5">{state.crew.name}</p>
            </div>
            <button
              onClick={handleCopyInvite}
              title="Copy invite code"
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/30 text-[10px] font-mono transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{state.crew.invite_code}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Action ───────────────────────── */}
      <div className={`px-3 mt-4 ${collapsed ? 'flex justify-center' : ''}`}>
        <Link
          href="/expenses/new"
          className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.98] ${
            collapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-2.5 text-xs'
          }`}
          title="Add Expense"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          {!collapsed && <span>Add Expense</span>}
        </Link>
      </div>

      {/* ── Navigation Groups ──────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 mt-5 space-y-5 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 mb-2">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                      {!collapsed && <span>{item.label}</span>}
                      {item.badge !== undefined && (
                        <span className={`${collapsed ? 'absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px]' : 'ml-auto text-[10px] px-1.5 py-0.5'} bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold rounded-full`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom: Persona Switcher ────────────── */}
      <div className="mt-auto border-t border-slate-800/60 px-3 py-3 space-y-2">
        {/* Demo Mode pill */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase text-emerald-400/80 tracking-wider">Demo Mode</span>
            </div>
            <button
              onClick={handleReset}
              title="Reset to fresh demo seeds"
              className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Persona Selector */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className={`w-full flex items-center gap-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3 py-2.5 transition ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-md">
              {currentUser.display_name.charAt(0)}
            </div>
            {!collapsed && (
              <>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">{currentUser.display_name}</span>
                  <span className="text-[10px] text-slate-500 truncate">{currentMember?.role || 'member'}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isPersonaOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {/* Persona Dropdown */}
          {isPersonaOpen && (
            <div className={`absolute ${collapsed ? 'left-full ml-2' : 'left-0 right-0'} bottom-full mb-1 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 min-w-[220px]`}>
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-slate-500 tracking-wider border-b border-slate-800 mb-1">
                Switch Persona
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
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-3 transition ${
                      isCurrent
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {user.display_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.display_name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {m?.role}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Collapse Toggle (desktop only) ────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center w-full py-3 border-t border-slate-800/60 text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition text-xs gap-1.5"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile Hamburger ──────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-2 text-slate-300 hover:text-emerald-400 shadow-lg transition"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile Overlay ────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ─────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] z-50 bg-[#0b1120] border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Desktop Sidebar ───────────────────── */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-[#0b1120] border-r border-slate-800/80 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
