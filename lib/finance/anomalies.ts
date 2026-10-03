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
