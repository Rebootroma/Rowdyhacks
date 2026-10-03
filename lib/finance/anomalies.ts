import { Expense, ExpenseCategory, SpendingAnomaly } from '@/types/domain';
import { formatCents } from '@/lib/utils';

export function detectSpendingAnomalies(
  expense: { amount_cents: number; category: ExpenseCategory; id?: string },
  historicalExpenses: Expense[],
  remainingBudgetCents?: number
): SpendingAnomaly | null {
  const { amount_cents, category } = expense;

  // Filter approved historical expenses in same category, excluding current expense if already in list
  const categoryHistory = historicalExpenses
    .filter(
      (e) =>
        e.category === category &&
        e.status === 'approved' &&
        (!expense.id || e.id !== expense.id)
    )
    .slice(0, 30);

  // 1. Budget proportion spike check
  if (remainingBudgetCents !== undefined && remainingBudgetCents > 0) {
    if (amount_cents >= 0.4 * remainingBudgetCents) {
      return {
        severity: 'high',
        category,
        amountCents: amount_cents,
        reason: `This single transaction accounts for ${Math.round((amount_cents / remainingBudgetCents) * 100)}% of your remaining monthly vault budget.`,
      };
    }
  }

  // 2. Statistical anomaly detection based on history
  if (categoryHistory.length >= 4) {
    const amounts = categoryHistory.map((e) => e.amount_cents);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + 2 * stdDev;

    if (amount_cents > threshold) {
      const severity = amount_cents > mean + 3 * stdDev ? 'high' : 'medium';
      return {
        severity,
        category,
        amountCents: amount_cents,
        baselineCents: Math.round(mean),
        reason: `Amount (${formatCents(amount_cents)}) is significantly higher than your typical ${category} expense (historical average: ${formatCents(Math.round(mean))}, 2σ threshold: ${formatCents(Math.round(threshold))}).`,
      };
    }
  } else if (categoryHistory.length > 0) {
    const amounts = categoryHistory.map((e) => e.amount_cents);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    if (amount_cents >= 3 * avg) {
      return {
        severity: 'medium',
        category,
        amountCents: amount_cents,
        baselineCents: Math.round(avg),
        reason: `Amount (${formatCents(amount_cents)}) is 3x higher than your previous ${category} average of ${formatCents(Math.round(avg))}.`,
      };
    }
  }

  return null;
}

import { V2AnomalyResult, V2AnomalyFactor, AnomalyRiskBand } from '@/types/v2';

export interface V2AnomalyInput {
  expense: { amount_cents: number; category: ExpenseCategory; id?: string; expense_date?: string };
  historicalExpenses: Expense[];
  remainingBudgetCents: number;
  recent7DaysSpendCents?: number;
  previous7DaysSpendCents?: number;
}

/**
 * CrewCash V2 Multi-Signal Explainable Anomaly Engine.
 * Combines 5 deterministic and statistical signals into a 0-100 score.
 * Never labels transactions as fraud.
 */
export function calculateV2AnomalyScore(input: V2AnomalyInput): V2AnomalyResult {
  const {
    expense,
    historicalExpenses,
    remainingBudgetCents,
    recent7DaysSpendCents = 0,
    previous7DaysSpendCents = 0,
  } = input;

  const factors: V2AnomalyFactor[] = [];
  const { amount_cents, category } = expense;

  const categoryHistory = historicalExpenses.filter(
    (e) => e.category === category && e.status === 'approved' && (!expense.id || e.id !== expense.id)
  );

  // 1. Amount Anomaly (Max 30 points)
  let amountScore = 0;
  let amountDesc = 'Amount aligns with normal historical transactions in this category.';
  if (categoryHistory.length >= 4) {
    const amounts = categoryHistory.map((e) => e.amount_cents);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0) {
      const zScore = (amount_cents - mean) / stdDev;
      if (zScore > 3.0) {
        amountScore = 30;
        amountDesc = `Amount exceeds historical category average by >3 standard deviations (z = ${zScore.toFixed(1)}).`;
      } else if (zScore > 2.0) {
        amountScore = 20;
        amountDesc = `Amount exceeds historical category average by 2+ standard deviations (z = ${zScore.toFixed(1)}).`;
      } else if (zScore > 1.0) {
        amountScore = 10;
        amountDesc = `Amount is somewhat elevated relative to category average (z = ${zScore.toFixed(1)}).`;
      }
    }
  } else if (categoryHistory.length > 0) {
    const avg = categoryHistory.reduce((a, b) => a + b.amount_cents, 0) / categoryHistory.length;
    if (amount_cents >= 3 * avg) {
      amountScore = 25;
      amountDesc = `Amount is 3x+ higher than the ${category} average of ${formatCents(Math.round(avg))}.`;
    } else if (amount_cents >= 2 * avg) {
      amountScore = 15;
      amountDesc = `Amount is 2x+ higher than the ${category} average of ${formatCents(Math.round(avg))}.`;
    }
  }
  factors.push({
    signal: 'amount_anomaly',
    score: amountScore,
    maxScore: 30,
    description: amountDesc,
  });

  // 2. Budget Impact (Max 25 points)
  let budgetScore = 0;
  let budgetDesc = 'Proportionate impact on remaining budget.';
  if (remainingBudgetCents > 0) {
    const shareOfRemaining = amount_cents / remainingBudgetCents;
    if (shareOfRemaining >= 0.50) {
      budgetScore = 25;
      budgetDesc = `Consumes ${Math.round(shareOfRemaining * 100)}% of the total remaining monthly budget.`;
    } else if (shareOfRemaining >= 0.35) {
      budgetScore = 18;
      budgetDesc = `Consumes ${Math.round(shareOfRemaining * 100)}% of remaining monthly runway.`;
    } else if (shareOfRemaining >= 0.20) {
      budgetScore = 10;
      budgetDesc = `Consumes ${Math.round(shareOfRemaining * 100)}% of remaining budget.`;
    }
  } else if (amount_cents > 0) {
    budgetScore = 25;
    budgetDesc = 'Proposed transaction occurs when budget is already exhausted or exceeded.';
  }
  factors.push({
    signal: 'budget_impact',
    score: budgetScore,
    maxScore: 25,
    description: budgetDesc,
  });

  // 3. Velocity Anomaly / Acceleration (Max 20 points)
  let velocityScore = 0;
  let velocityDesc = 'Spending velocity is within normal limits.';
  if (previous7DaysSpendCents > 0) {
    const acceleration = (recent7DaysSpendCents - previous7DaysSpendCents) / previous7DaysSpendCents;
    if (acceleration > 0.50) {
      velocityScore = 20;
      velocityDesc = `Crew spending has surged ${Math.round(acceleration * 100)}% in the past 7 days compared to prior window.`;
    } else if (acceleration > 0.25) {
      velocityScore = 12;
      velocityDesc = `Crew spending accelerated ${Math.round(acceleration * 100)}% over recent 7-day period.`;
    }
  }
  factors.push({
    signal: 'velocity_anomaly',
    score: velocityScore,
    maxScore: 20,
    description: velocityDesc,
  });

  // 4. Burst Signal (Max 15 points)
  // Check if multiple expenses in the same category were created today/yesterday
  const today = expense.expense_date || new Date().toISOString().slice(0, 10);
  const recentSameCategory = historicalExpenses.filter(
    (e) => e.category === category && e.expense_date === today
  );
  let burstScore = 0;
  let burstDesc = 'No transaction burst detected.';
  if (recentSameCategory.length >= 3) {
    burstScore = 15;
    burstDesc = `Cluster burst: ${recentSameCategory.length + 1} transactions recorded in '${category}' on the same date.`;
  } else if (recentSameCategory.length === 2) {
    burstScore = 8;
    burstDesc = `Rapid activity: 3 transactions in '${category}' within a single day.`;
  }
  factors.push({
    signal: 'burst_signal',
    score: burstScore,
    maxScore: 15,
    description: burstDesc,
  });

  // 5. Category Novelty (Max 10 points)
  let noveltyScore = 0;
  let noveltyDesc = 'Category has established spending history.';
  if (categoryHistory.length === 0 && historicalExpenses.length >= 5) {
    noveltyScore = 10;
    noveltyDesc = `First time Crew has ever recorded an expense under category '${category}'.`;
  }
  factors.push({
    signal: 'category_novelty',
    score: noveltyScore,
    maxScore: 10,
    description: noveltyDesc,
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

  let riskBand: AnomalyRiskBand = 'normal';
  if (totalScore >= 70) {
    riskBand = 'high attention';
  } else if (totalScore >= 50) {
    riskBand = 'unusual';
  } else if (totalScore >= 30) {
    riskBand = 'review';
  } else {
    riskBand = 'normal';
  }

  let summary: string;
  if (riskBand === 'high attention') {
    summary = `High attention required: multiple spending signals flagged (score ${totalScore}/100).`;
  } else if (riskBand === 'unusual') {
    summary = `Unusual transaction profile detected (score ${totalScore}/100). Review recommended.`;
  } else if (riskBand === 'review') {
    summary = `Noticeable spending variation (score ${totalScore}/100).`;
  } else {
    summary = `Standard spending profile (score ${totalScore}/100).`;
  }

  return {
    totalScore,
    riskBand,
    factors,
    summary,
  };
}
