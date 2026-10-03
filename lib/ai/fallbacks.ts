import { BudgetExplanation, BudgetRescueResult, ExpenseCategory } from '@/types/domain';
import { formatCents } from '@/lib/utils';
import type { BudgetInsightInput, BudgetRescueInput } from './provider';

export function generateFallbackBudgetExplanation(input: BudgetInsightInput): BudgetExplanation {
  const {
    crewName,
    monthlyBudgetCents,
    approvedSpendingCents,
    remainingCents,
    utilizationPercent,
    healthScore,
    categorySpending,
    anomaliesCount,
  } = input;

  const topCategories = Object.entries(categorySpending)
    .filter(([_, cents]) => cents > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const topCategoryText = topCategories.length
    ? topCategories.map(([cat, cents]) => `${cat} (${formatCents(cents)})`).join(' and ')
    : 'general living expenses';

  let headline = `${crewName} Vault Status: Balanced & On Track`;
  let summary = `Your crew has utilized ${utilizationPercent}% of the monthly vault with ${formatCents(remainingCents)} remaining. Spending is driven primarily by ${topCategoryText}.`;
  const observations: string[] = [];
  const suggestions: string[] = [];

  if (utilizationPercent > 85) {
    headline = `${crewName} Vault Alert: Nearing Capacity`;
    summary = `Spending has reached ${utilizationPercent}% of this month's vault. Only ${formatCents(remainingCents)} remains for upcoming operations.`;
    observations.push(`High vault pace: only ${formatCents(remainingCents)} remaining.`);
    suggestions.push('Review non-essential discretionary expenses before the end of the billing cycle.');
  } else {
    observations.push(`Solid vault discipline: ${formatCents(remainingCents)} available for future mission goals.`);
    suggestions.push('Maintain current pace to hit your shared group savings target.');
  }

  if (anomaliesCount > 0) {
    observations.push(`${anomaliesCount} transaction(s) triggered smart spend warnings.`);
    suggestions.push('Verify large split totals with all participating crew members.');
  } else {
    observations.push('No unusual spending anomalies detected this month.');
  }

  return {
    headline,
    summary,
    observations: observations.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
  };
}

export function generateFallbackBudgetRescue(input: BudgetRescueInput): BudgetRescueResult {
  const { monthlyBudgetCents, approvedSpendingCents, categorySpending } = input;
  const shortage = Math.max(0, approvedSpendingCents - monthlyBudgetCents);

  const dining = categorySpending.dining || 0;
  const entertainment = categorySpending.entertainment || 0;
  const shopping = categorySpending.shopping || 0;

  const adjustments: BudgetRescueResult['adjustments'] = [];

  if (dining > 10000) {
    const cut = Math.round(dining * 0.25);
    adjustments.push({
      category: 'dining',
      recommendedCutCents: cut,
      actionText: `Opt for shared group cooking sessions to trim ~${formatCents(cut)} from takeout expenses.`,
    });
  }

  if (entertainment > 8000) {
    const cut = Math.round(entertainment * 0.3);
    adjustments.push({
      category: 'entertainment',
      recommendedCutCents: cut,
      actionText: `Leverage campus recreation or free student activities to save ~${formatCents(cut)}.`,
    });
  }

  if (shopping > 5000) {
    const cut = Math.round(shopping * 0.2);
    adjustments.push({
      category: 'shopping',
      recommendedCutCents: cut,
      actionText: `Postpone non-essential gear purchases to preserve ${formatCents(cut)} in reserves.`,
    });
  }

  if (adjustments.length === 0) {
    adjustments.push({
      category: 'other',
      recommendedCutCents: shortage > 0 ? shortage : 5000,
      actionText: 'Review discretionary category transactions in your pending approvals queue.',
    });
  }

  return {
    headline: shortage > 0 ? 'Tactical Budget Rebalancing Plan' : 'Proactive Vault Optimization',
    shortageCents: shortage,
    adjustments: adjustments.slice(0, 3),
    safetyNotes:
      'Essential categories (rent, utilities, groceries, and medical) are protected and excluded from budget rescue suggestions.',
  };
}
