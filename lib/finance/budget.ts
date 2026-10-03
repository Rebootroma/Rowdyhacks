import { SpendWarning } from '@/types/domain';
import { formatCents } from '@/lib/utils';

export function calculateSpendWarning(
  proposedExpenseCents: number,
  monthlyBudgetCents: number,
  currentApprovedSpendingCents: number
): SpendWarning {
  const remainingBefore = Math.max(0, monthlyBudgetCents - currentApprovedSpendingCents);
  const remainingAfter = monthlyBudgetCents - (currentApprovedSpendingCents + proposedExpenseCents);
  const shareOfRemaining = remainingBefore > 0 ? proposedExpenseCents / remainingBefore : 1.0;

  if (remainingAfter < 0) {
    const deficitCents = Math.abs(remainingAfter);
    return {
      severity: 'critical',
      headline: 'Exceeds Remaining Vault Budget',
      message: `This expense of ${formatCents(proposedExpenseCents)} will exceed your remaining monthly vault by ${formatCents(deficitCents)}.`,
      remainingBeforeCents: remainingBefore,
      remainingAfterCents: remainingAfter,
      shareOfRemaining,
    };
  }

  if (shareOfRemaining >= 0.5) {
    return {
      severity: 'high',
      headline: 'High Vault Impact',
      message: `This expense consumes ${Math.round(shareOfRemaining * 100)}% of your remaining monthly vault balance (${formatCents(remainingBefore)} remaining).`,
      remainingBeforeCents: remainingBefore,
      remainingAfterCents: remainingAfter,
      shareOfRemaining,
    };
  }

  if (shareOfRemaining >= 0.25) {
    return {
      severity: 'medium',
      headline: 'Noticeable Vault Impact',
      message: `This expense uses ${Math.round(shareOfRemaining * 100)}% of your remaining monthly vault balance.`,
      remainingBeforeCents: remainingBefore,
      remainingAfterCents: remainingAfter,
      shareOfRemaining,
    };
  }

  return {
    severity: 'low',
    headline: 'Within Safe Limits',
    message: `This expense uses only ${Math.round(shareOfRemaining * 100)}% of the remaining vault.`,
    remainingBeforeCents: remainingBefore,
    remainingAfterCents: remainingAfter,
    shareOfRemaining,
  };
}
