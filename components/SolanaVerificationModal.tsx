'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  X,
  Loader2,
  Cpu,
  Hash,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SolanaVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature: string;
  digest: string;
  expenseTitle?: string;
  amountCents?: number;
}

export function SolanaVerificationModal({
  isOpen,
  onClose,
  signature,
  digest,
  expenseTitle,
  amountCents,
}: SolanaVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [data, setData] = useState<{
    ok: boolean;
    slot?: number;
    blockTime?: number;
    feeLamports?: number;
    logMessages?: string[];
    explorerUrl?: string;
    onChainMemo?: string | null;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !signature) return;

    // Reset and fetch live verification from Solana RPC
    setLoading(true);
    setData(null);

    fetch('/api/solana/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, digest }),
    })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        console.error('Failed to verify on-chain', err);
        setData({
          ok: false,
          reason: 'Network error communicating with Solana Devnet RPC',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, signature, digest]);

  if (!isOpen) return null;

  const handleCopySig = () => {
    navigator.clipboard.writeText(signature);
    setCopiedSig(true);
    setTimeout(() => setCopiedSig(false), 2000);
  };

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(digest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  const explorerUrl =
    data?.explorerUrl ||
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-950/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                Solana Devnet Audit Proof
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  SPL Memo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographically anchored on-chain consensus digest
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Status Banner */}
          {loading ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span>Querying Solana Devnet RPC live for confirmation...</span>
            </div>
          ) : data?.ok ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-emerald-200">
                  Cryptographically Verified on Solana Devnet
                </div>
                <div className="text-xs text-emerald-300/80 mt-0.5">
                  The on-chain transaction logs match the exact SHA-256 payload digest. Zero record alteration is mathematically possible.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-rose-200">
                  Verification Notice
                </div>
                <div className="text-xs text-rose-300/80 mt-0.5">
                  {data?.reason || 'Awaiting full confirmation or signature query timeout.'}
                </div>
              </div>
            </div>
          )}

          {/* Expense Context if provided */}
          {expenseTitle && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">Expense Allocation</span>
                <div className="font-semibold text-slate-200">{expenseTitle}</div>
              </div>
              {amountCents !== undefined && (
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Total Value</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm">
                    ${(amountCents / 100).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Digest */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Hash className="w-3.5 h-3.5 text-violet-400" />
                Canonical SHA-256 Digest
              </span>
              <button
                onClick={handleCopyDigest}
                className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                {copiedDigest ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedDigest ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
              {digest}
            </div>
          </div>

          {/* Solana Transaction Signature */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Solana Devnet Signature
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopySig}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedSig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedSig ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 underline underline-offset-2"
                >
                  Solana Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 break-all select-all">
              {signature}
            </div>
          </div>

          {/* Live Blockchain Metrics */}
          {data?.ok && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-violet-400" />
                  Confirmation Slot
                </div>
                <div className="font-mono text-sm font-semibold text-slate-200 mt-1">
                  {data.slot ? data.slot.toLocaleString() : '—'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-400" />
                  Block Timestamp
                </div>
                <div className="font-mono text-xs font-semibold text-slate-200 mt-1 truncate">
                  {data.blockTime
                    ? new Date(data.blockTime * 1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Confirmed'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-amber-400" />
                  Network Gas Fee
                </div>
                <div className="font-mono text-xs font-semibold text-amber-300 mt-1">
                  {data.feeLamports !== undefined
                    ? `${(data.feeLamports / 1e9).toFixed(6)} SOL`
                    : '0.000005 SOL'}
                </div>
              </div>
            </div>
          )}

          {/* Raw Program Logs */}
          {data?.logMessages && data.logMessages.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-slate-400 font-medium">
                Solana Virtual Machine (SVM) Instruction Logs:
              </span>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 max-h-36 overflow-y-auto space-y-1">
                {data.logMessages.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('success')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('Memo')
                        ? 'text-violet-300'
                        : 'text-slate-400'
                    }
                  >
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="text-[11px] text-slate-500">
            Network: <span className="text-slate-300">Solana Devnet</span> • Program:{' '}
            <span className="text-slate-300">SPL Memo v1</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 transition"
            >
              Open Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
