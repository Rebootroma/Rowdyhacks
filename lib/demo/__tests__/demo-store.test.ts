import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  resetDemoState,
  createExpense,
  recordApprovalDecision,
  setCurrentUser,
} from '../demo-store';
import { DEMO_USERS } from '../demo-data';

describe('Expense State Machine & Approval Logic', () => {
  beforeEach(() => {
    resetDemoState();
  });

  it('immediately approves expense below threshold (< $150.00)', () => {
    setCurrentUser(DEMO_USERS.alex.id);
    const exp = createExpense({
      title: 'Coffee and Donuts',
      amountCents: 1850, // $18.50 < $150.00
      category: 'dining',
      expenseDate: '2026-10-03',
      memberIds: [DEMO_USERS.alex.id, DEMO_USERS.jordan.id],
    });

    assert.strictEqual(exp.status, 'approved');
    assert.strictEqual(exp.approval_required, false);
    assert.strictEqual(exp.splits?.length, 2);
  });

  it('marks expense pending when amount >= threshold ($150.00)', () => {
    setCurrentUser(DEMO_USERS.alex.id);
    const exp = createExpense({
      title: 'Apartment Vacuum Cleaner',
      amountCents: 18000, // $180.00 >= $150.00
      category: 'shopping',
      expenseDate: '2026-10-03',
      memberIds: [DEMO_USERS.alex.id, DEMO_USERS.jordan.id, DEMO_USERS.sam.id],
    });

    assert.strictEqual(exp.status, 'pending');
    assert.strictEqual(exp.approval_required, true);
  });

  it('prevents expense creator from approving their own expense', () => {
    setCurrentUser(DEMO_USERS.alex.id);
    const exp = createExpense({
      title: 'Soundbar',
      amountCents: 20000,
      category: 'entertainment',
      expenseDate: '2026-10-03',
      memberIds: [DEMO_USERS.alex.id, DEMO_USERS.jordan.id],
    });

    assert.throws(() => {
      recordApprovalDecision(exp.id, 'approved');
    }, /creator cannot approve/);
  });

  it('transitions to approved after 2 approvals', () => {
    setCurrentUser(DEMO_USERS.alex.id);
    const exp = createExpense({
      title: 'High-end Router',
      amountCents: 22000,
      category: 'utilities',
      expenseDate: '2026-10-03',
      memberIds: [DEMO_USERS.alex.id, DEMO_USERS.jordan.id, DEMO_USERS.sam.id],
    });

    // Jordan votes approved
    setCurrentUser(DEMO_USERS.jordan.id);
    const step1 = recordApprovalDecision(exp.id, 'approved');
    assert.strictEqual(step1.status, 'pending'); // 1 approval not enough

    // Sam votes approved
    setCurrentUser(DEMO_USERS.sam.id);
    const step2 = recordApprovalDecision(exp.id, 'approved');
    assert.strictEqual(step2.status, 'approved'); // 2 approvals reached!
  });

  it('transitions to rejected after 1 rejection', () => {
    setCurrentUser(DEMO_USERS.alex.id);
    const exp = createExpense({
      title: 'Inflatable Hot Tub',
      amountCents: 35000,
      category: 'entertainment',
      expenseDate: '2026-10-03',
      memberIds: [DEMO_USERS.alex.id, DEMO_USERS.jordan.id],
    });

    setCurrentUser(DEMO_USERS.jordan.id);
    const step1 = recordApprovalDecision(exp.id, 'rejected');
    assert.strictEqual(step1.status, 'rejected');
  });
});
