import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatCents,
  parseCents,
  isValidCents,
  centsToDecimal,
  decimalToCents,
} from '../money';
import {
  evaluateApprovalPolicy,
  canFinalizeApproval,
  DEFAULT_APPROVAL_POLICIES,
} from '../policies';
import {
  computeAverageForecast,
  computeEwmaForecast,
  computeBudgetExhaustionDate,
  calculateSpendingAcceleration,
} from '../forecast';
import {
  calculateCreditHealth,
  simulateCredit,
  CREDIT_HEALTH_DISCLAIMER,
} from '../credit-health';
import { calculateInvestmentReadiness } from '../investment-readiness';
import {
  validateAllocations,
  simulatePortfolio,
  runStressTest,
  calculateVolatility,
  calculateDrawdown,
} from '../portfolio';
import { calculateV2AnomalyScore } from '../anomalies';
import { verifyReceiptIntegrity } from '../receipt-integrity';
import {
  savePersonalSnapshotSchema,
  approvalPolicyItemSchema,
  portfolioSimulationSchema,
} from '@/lib/validation/schemas';

describe('V2 Financial Math & Integer Cents Invariant', () => {
  it('formats integer cents into formatted currency', () => {
    assert.strictEqual(formatCents(12599), '$125.99');
    assert.strictEqual(formatCents(0), '$0.00');
    assert.strictEqual(formatCents(50), '$0.50');
    assert.strictEqual(formatCents(100000), '$1,000.00');
  });

  it('parses currency strings into exact integer cents', () => {
    assert.strictEqual(parseCents('$42.50'), 4250);
    assert.strictEqual(parseCents('1,250.99'), 125099);
    assert.strictEqual(parseCents('  $0.99  '), 99);
    assert.strictEqual(parseCents(500), 500);
  });

  it('validates integer cents safety', () => {
    assert.strictEqual(isValidCents(500), true);
    assert.strictEqual(isValidCents(0), true);
    assert.strictEqual(isValidCents(-50), false);
    assert.strictEqual(isValidCents(42.5), false);
    assert.strictEqual(isValidCents('4200'), false);
  });

  it('converts between decimal dollars and cents safely', () => {
    assert.strictEqual(centsToDecimal(4250), 42.5);
    assert.strictEqual(decimalToCents(42.5), 4250);
    assert.strictEqual(decimalToCents(19.99), 1999);
  });
});

describe('V2 Approval Policy Engine', () => {
  it('auto-approves expenses below $50 tier', () => {
    const policy = evaluateApprovalPolicy(3500); // $35.00
    assert.strictEqual(policy.autoApprove, true);
    assert.strictEqual(policy.requiredApprovals, 0);

    const finalization = canFinalizeApproval(policy, []);
    assert.strictEqual(finalization.finalized, true);
    assert.strictEqual(finalization.status, 'approved');
  });

  it('requires 1 approval for $50 to $199.99 tier', () => {
    const policy = evaluateApprovalPolicy(12000); // $120.00
    assert.strictEqual(policy.autoApprove, false);
    assert.strictEqual(policy.requiredApprovals, 1);

    // No approvals -> pending
    const step0 = canFinalizeApproval(policy, []);
    assert.strictEqual(step0.finalized, false);
    assert.strictEqual(step0.status, 'pending');

    // 1 approval from a member -> approved
    const step1 = canFinalizeApproval(policy, [
      { userId: 'u2', role: 'member', decision: 'approved' },
    ]);
    assert.strictEqual(step1.finalized, true);
    assert.strictEqual(step1.status, 'approved');
  });

  it('requires 2 approvals with owner/treasurer for high-value $500+ tier', () => {
    const policy = evaluateApprovalPolicy(65000); // $650.00
    assert.strictEqual(policy.autoApprove, false);
    assert.strictEqual(policy.requiredApprovals, 2);
    assert.deepStrictEqual(policy.requiredRoles, ['owner', 'treasurer']);

    // 2 approvals from general members without owner/treasurer is not sufficient
    const stepMemberOnly = canFinalizeApproval(policy, [
      { userId: 'u2', role: 'member', decision: 'approved' },
      { userId: 'u3', role: 'member', decision: 'approved' },
    ]);
    assert.strictEqual(stepMemberOnly.finalized, false);
    assert.strictEqual(stepMemberOnly.missingRoles.length > 0, true);

    // Approvals from owner and treasurer fulfill high governance
    const stepFull = canFinalizeApproval(policy, [
      { userId: 'u_owner', role: 'owner', decision: 'approved' },
      { userId: 'u_treasurer', role: 'treasurer', decision: 'approved' },
    ]);
    assert.strictEqual(stepFull.finalized, true);
    assert.strictEqual(stepFull.status, 'approved');
    assert.strictEqual(stepFull.missingRoles.length, 0);
  });

  it('immediately transitions to rejected if any voter rejects', () => {
    const policy = evaluateApprovalPolicy(30000); // $300.00
    const step = canFinalizeApproval(policy, [
      { userId: 'u1', role: 'treasurer', decision: 'approved' },
      { userId: 'u2', role: 'owner', decision: 'rejected' },
    ]);
    assert.strictEqual(step.finalized, true);
    assert.strictEqual(step.status, 'rejected');
  });
});

describe('V2 Burn-Rate Forecast & EWMA Engine', () => {
  it('computes simple historical average burn rate and projected month-end', () => {
    const forecast = computeAverageForecast({
      approvedMonthSpendCents: 140000, // $1,400 spent
      elapsedDays: 14,
      daysInMonth: 30,
      monthlyBudgetCents: 300000, // $3,000 budget
    });

    assert.strictEqual(forecast.method, 'average');
    assert.strictEqual(forecast.dailyBurnCents, 10000); // $100 / day
    assert.strictEqual(forecast.projectedMonthEndCents, 300000); // $3,000
    assert.strictEqual(forecast.projectedRemainingCents, 0);
    assert.strictEqual(forecast.confidence, 'medium'); // 14 days is medium
  });

  it('computes EWMA forecast with alpha = 0.30 when history >= 5 days', () => {
    // 7 days of spending
    const dailySpends = [5000, 6000, 4500, 8000, 10000, 12000, 15000];
    const forecast = computeEwmaForecast({
      dailySpends,
      daysInMonth: 30,
      currentDay: 7,
      monthlyBudgetCents: 400000,
      alpha: 0.30,
    });

    assert.strictEqual(forecast.method, 'ewma');
    assert.strictEqual(forecast.dailyBurnCents > 0, true);
    assert.strictEqual(forecast.projectedMonthEndCents > 0, true);
    assert.strictEqual(forecast.confidence, 'medium');
  });

  it('falls back to simple average when EWMA daily points < 5', () => {
    const dailySpends = [5000, 8000, 6000];
    const forecast = computeEwmaForecast({
      dailySpends,
      daysInMonth: 30,
      currentDay: 3,
      monthlyBudgetCents: 200000,
    });

    assert.strictEqual(forecast.method, 'average');
    assert.strictEqual(forecast.confidence, 'low');
  });

  it('computes budget exhaustion date correctly', () => {
    const refDate = new Date('2026-10-01T00:00:00Z');
    // $1,000 remaining, burning $100/day -> 10 days remaining -> Oct 11
    const exhaustion = computeBudgetExhaustionDate(100000, 10000, refDate);
    assert.strictEqual(exhaustion, '2026-10-11');

    // If burn rate <= 0, returns null
    assert.strictEqual(computeBudgetExhaustionDate(100000, 0), null);
  });

  it('calculates spending acceleration between two 7-day windows', () => {
    const accel = calculateSpendingAcceleration(124000, 100000); // +24%
    assert.strictEqual(accel.accelerationPercent, 24);
    assert.strictEqual(accel.label.includes('↑ 24%'), true);
  });
});

describe('V2 Credit Health Engine & Simulator', () => {
  it('calculates educational credit health with transparent factors', () => {
    const res = calculateCreditHealth({
      revolvingBalanceCents: 30000, // $300
      revolvingLimitCents: 100000, // $1,000 (30% utilization -> 25 pts)
      onTimePaymentPercent: 99, // 35 pts
      averageAccountAgeMonths: 24, // 12 pts
      hardInquiries: 0, // 10 pts
      hasCreditMix: true, // 10 pts
    });

    // 35 + 25 + 12 + 10 + 10 = 92
    assert.strictEqual(res.score, 92);
    assert.strictEqual(res.label, 'Excellent');
    assert.strictEqual(res.factors.length, 5);
  });

  it('simulates balance paydown and models utilization and score delta', () => {
    const sim = simulateCredit({
      totalLimitCents: 100000, // $1,000
      currentBalanceCents: 70000, // 70% utilization (high)
      simulatedBalanceCents: 10000, // 10% utilization (exceptional)
      onTimePaymentPercent: 98,
      averageAccountAgeMonths: 18,
      hardInquiries: 1,
    });

    assert.strictEqual(sim.currentUtilizationPercent, 70);
    assert.strictEqual(sim.simulatedUtilizationPercent, 10);
    assert.strictEqual(sim.scoreDifference > 0, true);
    assert.strictEqual(sim.disclaimer, CREDIT_HEALTH_DISCLAIMER);
  });
});

describe('V2 Investment Readiness Engine', () => {
  it('scores high readiness for strong emergency cushion and cash flow', () => {
    const res = calculateInvestmentReadiness({
      monthlyIncomeCents: 300000, // $3,000
      monthlyExpensesCents: 180000, // $1,800 (surplus = $1,200 = 40% of income -> 25 pts)
      emergencySavingsCents: 1200000, // $12,000 = 6.6 months -> 30 pts
      revolvingDebtCents: 0, // 20 pts
      investmentHorizonMonths: 60, // 5 yrs -> 15 pts
      recurringSavingsCents: 30000, // 10% of income -> 10 pts
    });

    // 30 + 25 + 20 + 15 + 10 = 100
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.label, 'Foundation Strong');
  });

  it('scores low readiness when emergency fund is missing and debt is high', () => {
    const res = calculateInvestmentReadiness({
      monthlyIncomeCents: 200000,
      monthlyExpensesCents: 210000, // Deficit!
      emergencySavingsCents: 20000, // < 1 month
      revolvingDebtCents: 150000,
      revolvingLimitCents: 200000, // 75% utilization
      investmentHorizonMonths: 6,
    });

    assert.strictEqual(res.score < 40, true);
    assert.strictEqual(res.label, 'Stabilize First');
  });
});

describe('V2 Portfolio Math & Stress Testing', () => {
  it('validates allocation weights must sum to exactly 10,000 bps', () => {
    const valid = validateAllocations([
      { assetClass: 'US Equities', weightBps: 6000 },
      { assetClass: 'International', weightBps: 2000 },
      { assetClass: 'Bonds', weightBps: 2000 },
    ]);
    assert.strictEqual(valid.valid, true);

    const invalid = validateAllocations([
      { assetClass: 'US Equities', weightBps: 6000 },
      { assetClass: 'International', weightBps: 2000 },
    ]);
    assert.strictEqual(invalid.valid, false);
    assert.strictEqual(invalid.totalBps, 8000);
  });

  it('simulates compounding growth over horizon with monthly contributions', () => {
    const sim = simulatePortfolio({
      initialCents: 100000, // $1,000
      monthlyContributionCents: 20000, // $200 / month
      horizonMonths: 12, // 1 year
      assumptions: {
        conservativeAnnualRate: 0.04,
        baselineAnnualRate: 0.07,
        highAnnualRate: 0.10,
      },
    });

    assert.strictEqual(sim.totalContributionsCents, 340000); // 1000 + 2400 = $3,400
    assert.strictEqual(sim.conservativeCents > sim.totalContributionsCents, true);
    assert.strictEqual(sim.baselineCents > sim.conservativeCents, true);
    assert.strictEqual(sim.highCents > sim.baselineCents, true);
  });

  it('runs weighted portfolio stress tests under shocks', () => {
    const stress = runStressTest({
      allocationsBps: [
        { assetClass: 'US Equity ETF', weightBps: 7000 },
        { assetClass: 'Tech ETF', weightBps: 2000 },
        { assetClass: 'Bonds', weightBps: 1000 },
      ],
      scenarioId: 'tech_shock',
    });

    assert.strictEqual(stress.scenarioId, 'tech_shock');
    assert.strictEqual(stress.modeledChangePercent < 0, true);
    assert.strictEqual(stress.contributions.length, 3);
  });

  it('calculates daily and annualized volatility from return series', () => {
    const returns = [0.01, -0.005, 0.015, -0.01, 0.008, 0.002, -0.004];
    const vol = calculateVolatility(returns);
    assert.strictEqual(vol.dailyVolatility > 0, true);
    assert.strictEqual(vol.annualizedVolatility > vol.dailyVolatility, true);
  });

  it('calculates running peak and maximum drawdown from price series', () => {
    const prices = [100, 105, 110, 99, 90, 95, 108];
    // Peak is 110, trough is 90 -> drawdown is (90 - 110)/110 = -18.18%
    const dd = calculateDrawdown(prices);
    assert.strictEqual(dd.maxDrawdownPercent < -15, true);
    assert.strictEqual(dd.drawdownSeries.length, 7);
  });
});

describe('V2 Explainable Anomaly Engine', () => {
  it('scores normal transactions with low score and normal band', () => {
    const result = calculateV2AnomalyScore({
      expense: { amount_cents: 2500, category: 'dining' },
      historicalExpenses: [
        {
          id: '1',
          crew_id: 'c1',
          created_by: 'u1',
          title: 'Lunch',
          amount_cents: 2200,
          category: 'dining',
          expense_date: '2026-10-01',
          status: 'approved',
          approval_required: false,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          crew_id: 'c1',
          created_by: 'u1',
          title: 'Dinner',
          amount_cents: 2800,
          category: 'dining',
          expense_date: '2026-10-02',
          status: 'approved',
          approval_required: false,
          created_at: '',
          updated_at: '',
        },
      ],
      remainingBudgetCents: 100000,
    });

    assert.strictEqual(result.riskBand, 'normal');
    assert.strictEqual(result.totalScore < 30, true);
    assert.strictEqual(result.factors.length, 5);
  });

  it('flags high attention for huge budget impact and category spike', () => {
    const result = calculateV2AnomalyScore({
      expense: { amount_cents: 65000, category: 'entertainment', expense_date: '2026-10-03' },
      historicalExpenses: [
        {
          id: '1',
          crew_id: 'c1',
          created_by: 'u1',
          title: 'Movie',
          amount_cents: 1500,
          category: 'entertainment',
          expense_date: '2026-10-01',
          status: 'approved',
          approval_required: false,
          created_at: '',
          updated_at: '',
        },
      ],
      remainingBudgetCents: 80000, // $650 out of $800 = >80% remaining budget!
      recent7DaysSpendCents: 150000,
      previous7DaysSpendCents: 50000, // +200% acceleration
    });

    assert.strictEqual(['unusual', 'high attention'].includes(result.riskBand), true);
    assert.strictEqual(result.totalScore >= 50, true);
  });
});

describe('V2 Receipt Arithmetic Integrity Verification', () => {
  it('passes when line items, taxes, and totals balance exactly', () => {
    const checks = verifyReceiptIntegrity({
      subtotal_cents: 2000,
      tax_cents: 160,
      tip_cents: 300,
      total_cents: 2460,
      items: [
        { name: 'Burger', amount_cents: 1200 },
        { name: 'Fries', amount_cents: 800 },
      ],
    });

    assert.strictEqual(checks.isConsistent, true);
    assert.strictEqual(checks.subtotalDifferenceCents, 0);
    assert.strictEqual(checks.printedTotalDifferenceCents, 0);
  });

  it('flags discrepancy when printed total does not match line item math', () => {
    const checks = verifyReceiptIntegrity({
      subtotal_cents: 2000,
      tax_cents: 160,
      tip_cents: 0,
      total_cents: 3500, // Mismatch!
      items: [{ name: 'Item', amount_cents: 2000 }],
    });

    assert.strictEqual(checks.isConsistent, false);
    assert.strictEqual(checks.printedTotalDifferenceCents, 1340);
  });
});

describe('V2 Zod Schemas Validation', () => {
  it('validates personal snapshot schema successfully', () => {
    const valid = savePersonalSnapshotSchema.safeParse({
      monthlyIncomeCents: 170000,
      cashBalanceCents: 50000,
      emergencySavingsCents: 90000,
      revolvingBalanceCents: 31000,
      revolvingLimitCents: 100000,
      onTimePaymentPercent: 99,
      averageAccountAgeMonths: 20,
    });
    assert.strictEqual(valid.success, true);
  });

  it('rejects approval policy if maxCents is smaller than minCents', () => {
    const invalid = approvalPolicyItemSchema.safeParse({
      minCents: 5000,
      maxCents: 2000, // Invalid!
      requiredApprovals: 1,
      requiredRoles: ['member'],
      autoApprove: false,
    });
    assert.strictEqual(invalid.success, false);
  });

  it('rejects portfolio simulation if allocations do not sum to 10,000 bps', () => {
    const invalid = portfolioSimulationSchema.safeParse({
      initialCents: 100000,
      monthlyContributionCents: 10000,
      horizonMonths: 12,
      allocationsBps: [
        { assetClass: 'Equities', weightBps: 5000 },
        { assetClass: 'Bonds', weightBps: 2000 },
      ], // Only 7,000 bps!
    });
    assert.strictEqual(invalid.success, false);
  });
});
