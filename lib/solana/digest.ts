import { createHash } from 'crypto';

/**
 * Canonical approval payload anchored on Solana Devnet.
 * Never include names, emails, receipts, merchants, or other PII.
 */
export interface ApprovalDigestPayload {
  version: 1;
  approval_id: string;
  expense_id: string;
  amount_cents: number;
  finalized_at: string;
  decision_digest: string;
}

export interface ApprovalDecisionInput {
  userId: string;
  decision: 'approved' | 'rejected';
  decidedAt?: string;
}

/**
 * Deterministic SHA-256 hex digest of sorted approval decisions.
 * Uses only opaque user IDs + decisions (no display names).
 */
export function computeDecisionDigest(decisions: ApprovalDecisionInput[]): string {
  const normalized = decisions
    .map((d) => ({
      user_id: d.userId,
      decision: d.decision,
      decided_at: d.decidedAt ?? null,
    }))
    .sort((a, b) => a.user_id.localeCompare(b.user_id));

  return sha256Hex(stableStringify(normalized));
}

export function buildApprovalDigestPayload(input: {
  approvalId: string;
  expenseId: string;
  amountCents: number;
  finalizedAt: string;
  decisions: ApprovalDecisionInput[];
}): ApprovalDigestPayload {
  if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
    throw new Error('amount_cents must be a non-negative integer');
  }

  return {
    version: 1,
    approval_id: input.approvalId,
    expense_id: input.expenseId,
    amount_cents: input.amountCents,
    finalized_at: input.finalizedAt,
    decision_digest: computeDecisionDigest(input.decisions),
  };
}

/** Canonical JSON serialization with sorted object keys. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return value;
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Hash the canonical approval payload for on-chain memo anchoring. */
export function hashApprovalPayload(payload: ApprovalDigestPayload): string {
  return sha256Hex(stableStringify(payload));
}

export function verifyApprovalDigest(
  payload: ApprovalDigestPayload,
  expectedDigest: string
): boolean {
  return hashApprovalPayload(payload) === expectedDigest;
}
