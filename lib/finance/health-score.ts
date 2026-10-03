import { HealthScoreFactor, HealthScoreResult, ExpenseCategory } from '@/types/domain';

interface HealthScoreInput {
  budgetAmountCents: number;
  approvedSpendingCents: number;
  categorySpending: Record<ExpenseCategory, number>;
  activeAnomaliesCount: number;
  goalStatus?: 'on_track' | 'behind' | 'none';
}

/**
 * 100% Deterministic Financial Health Score Engine.
 * Never hallucinated by an LLM.
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const {
    budgetAmountCents,
    approvedSpendingCents,
    categorySpending,
    activeAnomaliesCount,
    goalStatus = 'none',
  } = input;

  let currentScore = 100;
  const factors: HealthScoreFactor[] = [];

  // 1. Budget Utilization Factor
  const utilizationRatio = budgetAmountCents > 0 ? approvedSpendingCents / budgetAmountCents : 0;
  const utilizationPercent = Math.round(utilizationRatio * 100);

  if (utilizationRatio > 1.0) {
    currentScore -= 30;
    factors.push({
      code: 'BUDGET_OVERRUN',
      impact: -30,
      explanation: `Spending has exceeded the monthly vault limit (${utilizationPercent}% utilized).`,
    });
  } else if (utilizationRatio > 0.85) {
    currentScore -= 15;
    factors.push({
      code: 'BUDGET_HIGH_UTILIZATION',
      impact: -15,
      explanation: `Vault utilization is high (${utilizationPercent}%). Spending is nearing the monthly limit.`,
    });
  } else if (utilizationRatio > 0.70) {
    currentScore -= 5;
    factors.push({
      code: 'BUDGET_ELEVATED',
      impact: -5,
      explanation: `Moderate vault pace (${utilizationPercent}%). On pace for typical monthly operations.`,
    });
  } else {
    factors.push({
      code: 'BUDGET_OPTIMAL',
      impact: 0,
      explanation: `Disciplined vault pace (${utilizationPercent}% utilized). Plenty of runway remaining.`,
    });
  }

  // 2. Discretionary Spending Ratio
  // Discretionary: dining + entertainment + shopping
  if (approvedSpendingCents > 0) {
    const discretionaryCents =
      (categorySpending.dining || 0) +
      (categorySpending.entertainment || 0) +
      (categorySpending.shopping || 0);
    const discretionaryRatio = discretionaryCents / approvedSpendingCents;

    if (discretionaryRatio > 0.35) {
      currentScore -= 10;
      factors.push({
        code: 'HIGH_DISCRETIONARY',
        impact: -10,
        explanation: `Discretionary expenses (dining, entertainment, shopping) make up ${Math.round(discretionaryRatio * 100)}% of approved spending.`,
      });
    }
  }

  // 3. Active Anomalies Factor (-5 per anomaly, max -15)
  if (activeAnomaliesCount > 0) {
    const deduction = Math.min(activeAnomaliesCount * 5, 15);
    currentScore -= deduction;
    factors.push({
      code: 'ACTIVE_ANOMALIES',
      impact: -deduction,
      explanation: `${activeAnomaliesCount} unusual spending ${activeAnomaliesCount === 1 ? 'spike has' : 'spikes have'} been flagged for review.`,
    });
  }

  // 4. Savings Goals Factor
  if (goalStatus === 'on_track') {
    currentScore += 5;
    factors.push({
      code: 'GOAL_ON_TRACK',
      impact: 5,
      explanation: 'Active group mission savings goal is on track.',
    });
  } else if (goalStatus === 'behind') {
    currentScore -= 5;
    factors.push({
      code: 'GOAL_BEHIND',
      impact: -5,
      explanation: 'Group mission savings goal is falling behind schedule.',
    });
  }

  // Clamp strictly between 0 and 100
  const finalScore = Math.max(0, Math.min(100, currentScore));

  // Determine band & UI label
  let label: HealthScoreResult['label'] = 'Strong';
  let color = '#10b981'; // Green

  if (finalScore >= 90) {
    label = 'Strong';
    color = '#10b981';
  } else if (finalScore >= 75) {
    label = 'Healthy';
    color = '#06b6d4'; // Teal/Cyan
  } else if (finalScore >= 60) {
    label = 'Needs Attention';
    color = '#f59e0b'; // Amber
  } else {
    label = 'Action Recommended';
    color = '#f43f5e'; // Rose/Red
  }

  return {
    score: finalScore,
    label,
    color,
    factors,
  };
}
