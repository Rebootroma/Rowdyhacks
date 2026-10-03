import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateEqualSplit, validateCustomSplits } from '../splits';
import { calculateHealthScore } from '../health-score';
import { calculateSpendWarning } from '../budget';

describe('Financial Math - Integer Cents Equal Splits', () => {
  it('splits 1000 cents evenly across 4 members', () => {
    const splits = calculateEqualSplit(1000, ['u1', 'u2', 'u3', 'u4']);
    assert.strictEqual(splits.length, 4);
    assert.deepStrictEqual(
      splits.map((s) => s.amountCents),
      [250, 250, 250, 250]
    );
    assert.strictEqual(
      splits.reduce((acc, s) => acc + s.amountCents, 0),
      1000
    );
  });

  it('splits 1001 cents across 3 members with exact cent preservation (334, 334, 333)', () => {
    const splits = calculateEqualSplit(1001, ['u1', 'u2', 'u3']);
    assert.strictEqual(splits.length, 3);
    assert.deepStrictEqual(
      splits.map((s) => s.amountCents),
      [334, 334, 333]
    );
    assert.strictEqual(
      splits.reduce((acc, s) => acc + s.amountCents, 0),
      1001
    );
  });

  it('splits 1 cent across 2 members without losing cent', () => {
    const splits = calculateEqualSplit(1, ['u1', 'u2']);
    assert.strictEqual(splits.length, 2);
    assert.deepStrictEqual(
      splits.map((s) => s.amountCents),
      [1, 0]
    );
    assert.strictEqual(
      splits.reduce((acc, s) => acc + s.amountCents, 0),
      1
    );
  });

  it('validates custom split sum matches total cents', () => {
    const valid = validateCustomSplits(1000, [
      { userId: 'u1', amountCents: 600 },
      { userId: 'u2', amountCents: 400 },
    ]);
    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.diffCents, 0);

    const invalid = validateCustomSplits(1000, [
      { userId: 'u1', amountCents: 500 },
      { userId: 'u2', amountCents: 400 },
    ]);
    assert.strictEqual(invalid.valid, false);
    assert.strictEqual(invalid.diffCents, 100);
  });
});

describe('Financial Health Score Engine', () => {
  it('returns perfect 100 for low utilization and no anomalies', () => {
    const res = calculateHealthScore({
      budgetAmountCents: 200000,
      approvedSpendingCents: 60000, // 30%
      categorySpending: {
        housing: 50000,
        groceries: 10000,
        dining: 0,
        transportation: 0,
        utilities: 0,
        education: 0,
        healthcare: 0,
        entertainment: 0,
        shopping: 0,
        other: 0,
      },
      activeAnomaliesCount: 0,
    });
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.label, 'Strong');
  });

  it('applies correct deductions for budget overage and high discretionary spend', () => {
    const res = calculateHealthScore({
      budgetAmountCents: 100000,
      approvedSpendingCents: 110000, // Over 100% -> -30 pts
      categorySpending: {
        dining: 50000, // Discretionary > 35% -> -10 pts
        entertainment: 20000,
        housing: 40000,
        groceries: 0,
        transportation: 0,
        utilities: 0,
        education: 0,
        healthcare: 0,
        shopping: 0,
        other: 0,
      },
      activeAnomaliesCount: 1, // -5 pts
    });
    // 100 - 30 - 10 - 5 = 55
    assert.strictEqual(res.score, 55);
    assert.strictEqual(res.label, 'Action Recommended');
  });
});

describe('Smart Spend Warnings', () => {
  it('flags critical when proposed expense exceeds remaining budget', () => {
    const warning = calculateSpendWarning(30000, 100000, 80000); // 30000 > 20000 remaining
    assert.strictEqual(warning.severity, 'critical');
    assert.strictEqual(warning.remainingAfterCents, -10000);
  });

  it('flags high when consuming 50%+ of remaining budget', () => {
    const warning = calculateSpendWarning(25000, 100000, 50000); // 25000 / 50000 = 50%
    assert.strictEqual(warning.severity, 'high');
  });
});
