import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { SolanaAnchor } from '@/types/v2';
import {
  ApprovalDecisionInput,
  ApprovalDigestPayload,
  buildApprovalDigestPayload,
  hashApprovalPayload,
  verifyApprovalDigest,
} from './digest';
import {
  createSolanaConnection,
  isSolanaConfigured,
  loadSolanaKeypair,
} from './client';

/** Solana Memo Program — permanently records the digest in tx logs. */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface AnchorApprovalInput {
  approvalId: string;
  expenseId: string;
  amountCents: number;
  finalizedAt?: string;
  decisions: ApprovalDecisionInput[];
}

export interface AnchorApprovalResult {
  digest: string;
  signature: string;
  network: 'devnet';
  anchoredAt: string;
  payload: ApprovalDigestPayload;
  explorerUrl: string;
  skipped?: boolean;
  skipReason?: string;
}

function explorerUrl(signature: string, network: 'devnet' = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
}

function createMemoInstruction(payer: PublicKey, memo: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf8'),
  });
}

/**
 * Anchor a tamper-evident approval digest on Solana Devnet via Memo program.
 * Server-only: never accept a raw canonical body from the browser.
 */
export async function anchorApproval(input: AnchorApprovalInput): Promise<AnchorApprovalResult> {
  const finalizedAt = input.finalizedAt ?? new Date().toISOString();
  const payload = buildApprovalDigestPayload({
    approvalId: input.approvalId,
    expenseId: input.expenseId,
    amountCents: input.amountCents,
    finalizedAt,
    decisions: input.decisions,
  });
  const digest = hashApprovalPayload(payload);

  if (!isSolanaConfigured()) {
    return {
      digest,
      signature: `local-only:${digest.slice(0, 16)}`,
      network: 'devnet',
      anchoredAt: finalizedAt,
      payload,
      explorerUrl: '',
      skipped: true,
      skipReason: 'SOLANA_PRIVATE_KEY not configured',
    };
  }

  const connection = createSolanaConnection();
  const payer = loadSolanaKeypair();
  const memo = `crewcash:v1:${digest}`;

  const tx = new Transaction().add(createMemoInstruction(payer.publicKey, memo));
  const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: 'confirmed',
    maxRetries: 3,
  });

  const anchoredAt = new Date().toISOString();

  return {
    digest,
    signature,
    network: 'devnet',
    anchoredAt,
    payload,
    explorerUrl: explorerUrl(signature),
  };
}

export interface OnChainVerificationResult {
  ok: boolean;
  onChainMemo: string | null;
  slot?: number;
  blockTime?: number;
  feeLamports?: number;
  logMessages?: string[];
  explorerUrl?: string;
  reason?: string;
}

export async function verifyOnChainDigest(input: {
  digest: string;
  signature: string;
}): Promise<OnChainVerificationResult> {
  if (!input.signature || input.signature.startsWith('local-only:')) {
    return { ok: false, onChainMemo: null, reason: 'No on-chain signature to verify' };
  }

  const connection = createSolanaConnection();
  const tx = await connection.getTransaction(input.signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    return { ok: false, onChainMemo: null, reason: 'Transaction not found on Solana Devnet RPC' };
  }

  const logs = tx.meta?.logMessages ?? [];
  const memoLog = logs.find((line: string) => line.includes(input.digest) || line.includes('Memo'));
  const expected = `crewcash:v1:${input.digest}`;
  const ok = logs.some((line: string) => line.includes(expected) || line.includes(input.digest));

  return {
    ok,
    onChainMemo: memoLog ?? null,
    slot: tx.slot,
    blockTime: tx.blockTime ?? undefined,
    feeLamports: tx.meta?.fee,
    logMessages: logs,
    explorerUrl: explorerUrl(input.signature),
    reason: ok ? undefined : 'Digest not found in transaction memo logs',
  };
}

export function toSolanaAnchorRecord(
  expenseId: string,
  result: AnchorApprovalResult
): SolanaAnchor {
  return {
    expenseId,
    digest: result.digest,
    signature: result.signature,
    network: result.network,
    anchoredAt: result.anchoredAt,
  };
}

export function verifyLocalDigest(
  payload: ApprovalDigestPayload,
  digest: string
): boolean {
  return verifyApprovalDigest(payload, digest);
}

export type { Connection, Keypair };
