import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApprovalDigestPayload,
  computeDecisionDigest,
  hashApprovalPayload,
  verifyApprovalDigest,
} from '../digest';

describe('solana approval digests', () => {
  it('produces a stable decision digest regardless of input order', () => {
    const a = computeDecisionDigest([
      { userId: 'u-b', decision: 'approved', decidedAt: '2026-10-03T12:00:00Z' },
      { userId: 'u-a', decision: 'approved', decidedAt: '2026-10-03T11:00:00Z' },
    ]);
    const b = computeDecisionDigest([
      { userId: 'u-a', decision: 'approved', decidedAt: '2026-10-03T11:00:00Z' },
      { userId: 'u-b', decision: 'approved', decidedAt: '2026-10-03T12:00:00Z' },
    ]);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it('builds a PII-free canonical payload and verifies digests', () => {
    const payload = buildApprovalDigestPayload({
      approvalId: 'appr-2',
      expenseId: 'exp-001',
      amountCents: 62000,
      finalizedAt: '2026-10-03T18:00:00.000Z',
      decisions: [
        { userId: 'jordan', decision: 'approved' },
        { userId: 'sam', decision: 'approved' },
      ],
    });

    assert.equal(payload.version, 1);
    assert.equal(payload.amount_cents, 62000);
    assert.ok(!('merchant' in payload));
    assert.ok(!('title' in payload));

    const digest = hashApprovalPayload(payload);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.equal(verifyApprovalDigest(payload, digest), true);
    assert.equal(verifyApprovalDigest(payload, '0'.repeat(64)), false);
  });

  it('changes digest when amount_cents changes', () => {
    const base = {
      approvalId: 'appr-2',
      expenseId: 'exp-001',
      finalizedAt: '2026-10-03T18:00:00.000Z',
      decisions: [{ userId: 'jordan', decision: 'approved' as const }],
    };
    const d1 = hashApprovalPayload(buildApprovalDigestPayload({ ...base, amountCents: 62000 }));
    const d2 = hashApprovalPayload(buildApprovalDigestPayload({ ...base, amountCents: 62001 }));
    assert.notEqual(d1, d2);
  });
});
