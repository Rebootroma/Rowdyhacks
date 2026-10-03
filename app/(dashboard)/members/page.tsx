'use client';

import React, { useState, useEffect } from 'react';
import {
  getDemoState,
  setCurrentUser,
  DemoStoreState,
} from '@/lib/demo/demo-store';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  UserCheck,
  Key,
  Info,
} from 'lucide-react';

export default function MembersPage() {
  const [state, setState] = useState<DemoStoreState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setState(getDemoState());
    const onUpdate = () => setState(getDemoState());
    window.addEventListener('crewcash_state_updated', onUpdate);
    return () => window.removeEventListener('crewcash_state_updated', onUpdate);
  }, []);

  if (!state) return null;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(state.crew.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit'] tracking-tight flex items-center gap-2.5">
          <Users className="w-7 h-7 text-emerald-400" />
          Crew Roster & Access Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Active group members, role-based authorization (RBAC), and invite credentials.
        </p>
      </div>

      {/* Crew Invite Code Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            Vault Invite Code
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-0.5">{state.crew.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{state.crew.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-emerald-500/40 px-4 py-2 rounded-xl text-base font-mono font-bold text-emerald-400 tracking-wider">
            {state.crew.invite_code}
          </div>
          <button
            onClick={handleCopyInvite}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Copy invite code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100 font-['Outfit']">
            Active Crew Members ({state.members.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click "Switch Persona" to test that member's perspective
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.members.map((member) => {
            const isCurrent = member.user_id === state.currentUserId;
            return (
              <div
                key={member.user_id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
                    {member.profile?.display_name.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>{member.profile?.display_name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {member.profile?.email} • Joined {formatDate(member.joined_at)}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span
                    className={`inline-block text-[11px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                      member.role === 'owner'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : member.role === 'treasurer'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {member.role}
                  </span>

                  {!isCurrent && (
                    <div>
                      <button
                        onClick={() => setCurrentUser(member.user_id)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Switch Persona
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Permission Matrix Reference */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Crew Role Capabilities Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Monthly Vault Budget</th>
                <th className="py-2.5 px-3">Dual-Approval Voting</th>
                <th className="py-2.5 px-3">Expense Submission</th>
                <th className="py-2.5 px-3">Missions & Goals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-indigo-400">Owner (Alex)</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Control (Set & Edit)</td>
                <td className="py-2.5 px-3 text-emerald-400">Yes (non-creator)</td>
                <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                <td className="py-2.5 px-3 text-emerald-400">Manage & Contribute</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-amber-400">Treasurer (Jordan)</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Control (Set & Edit)</td>
                <td className="py-2.5 px-3 text-emerald-400">Yes (non-creator)</td>
                <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                <td className="py-2.5 px-3 text-emerald-400">Manage & Contribute</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-300">Member (Sam, Taylor)</td>
                <td className="py-2.5 px-3 text-slate-500">View Only</td>
                <td className="py-2.5 px-3 text-emerald-400">Yes (non-creator)</td>
                <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                <td className="py-2.5 px-3 text-emerald-400">Contribute</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
