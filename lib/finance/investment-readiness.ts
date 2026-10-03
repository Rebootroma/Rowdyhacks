import { ScoreResult, ScoreFactor } from '@/types/v2';
import { formatCents } from './money';

export interface InvestmentReadinessInput {
  monthlyIncomeCents: number;
  monthlyExpensesCents: number;
  emergencySavingsCents: number;
  revolvingDebtCents?: number;
  revolvingLimitCents?: number;
  investmentHorizonMonths?: number;
  recurringSavingsCents?: number;
}

export function calculateInvestmentReadiness(input: InvestmentReadinessInput): ScoreResult {
  const {
    monthlyIncomeCents,
    monthlyExpensesCents,
    emergencySavingsCents,
    revolvingDebtCents = 0,
    revolvingLimitCents = 0,
    investmentHorizonMonths = 36,
    recurringSavingsCents = 0,
  } = input;

  const factors: ScoreFactor[] = [];

  // 1. Emergency Reserve Coverage (Max 30 points)
  const safeMonthlyExpenses = Math.max(100, monthlyExpensesCents);
  const emergencyMonths = emergencySavingsCents / safeMonthlyExpenses;
  let reservePoints = 5;

  if (emergencyMonths >= 6) {
    reservePoints = 30;
  } else if (emergencyMonths >= 3) {
    reservePoints = 24;
  } else if (emergencyMonths >= 1) {
    reservePoints = 14;
  } else {
    reservePoints = 5;
  }
  factors.push({
    id: 'emergency_reserve',
    title: 'Emergency Cushion',
    points: reservePoints,
    maxPoints: 30,
    explanation: `${emergencyMonths.toFixed(1)} months of reserve coverage (${formatCents(emergencySavingsCents)} saved).`,
  });

  // 2. Monthly Cash Flow Surplus (Max 25 points)
  const monthlySurplusCents = monthlyIncomeCents - monthlyExpensesCents;
  const surplusRatio = monthlyIncomeCents > 0 ? monthlySurplusCents / monthlyIncomeCents : 0;
  let cashFlowPoints = 2;

  if (surplusRatio >= 0.20) {
    cashFlowPoints = 25;
  } else if (surplusRatio >= 0.10) {
    cashFlowPoints = 18;
  } else if (monthlySurplusCents > 0) {
    cashFlowPoints = 10;
  } else {
    cashFlowPoints = 2;
  }
  factors.push({
    id: 'cash_flow',
    title: 'Monthly Cash Flow',
    points: cashFlowPoints,
    maxPoints: 25,
    explanation: monthlySurplusCents >= 0
      ? `Positive monthly surplus of ${formatCents(monthlySurplusCents)} (${Math.round(surplusRatio * 100)}% of income).`
      : `Monthly deficit of ${formatCents(Math.abs(monthlySurplusCents))}. Stabilizing cash flow comes first.`,
  });

  // 3. High-Interest Debt Burden (Max 20 points)
  let debtPoints = 20;
  const util = revolvingLimitCents > 0 ? revolvingDebtCents / revolvingLimitCents : 0;
  if (revolvingDebtCents === 0 || util <= 0.10) {
    debtPoints = 20;
  } else if (util <= 0.30) {
    debtPoints = 15;
  } else if (util <= 0.50) {
    debtPoints = 8;
  } else {
    debtPoints = 2;
  }
  factors.push({
    id: 'debt_burden',
    title: 'High-Interest Debt Pressure',
    points: debtPoints,
    maxPoints: 20,
    explanation: revolvingDebtCents === 0
      ? 'Zero high-interest revolving card debt.'
      : `${formatCents(revolvingDebtCents)} revolving balance (${Math.round(util * 100)}% utilization).`,
  });

  // 4. Time Horizon (Max 15 points)
  let horizonPoints = 4;
  if (investmentHorizonMonths >= 60) {
    horizonPoints = 15;
  } else if (investmentHorizonMonths >= 36) {
    horizonPoints = 12;
  } else if (investmentHorizonMonths >= 12) {
    horizonPoints = 8;
  } else {
    horizonPoints = 4;
  }
  factors.push({
    id: 'time_horizon',
    title: 'Investment Time Horizon',
    points: horizonPoints,
    maxPoints: 15,
    explanation: `${investmentHorizonMonths} months intended runway (${(investmentHorizonMonths / 12).toFixed(1)} years).`,
  });

  // 5. Savings Consistency (Max 10 points)
  let savingsPoints = 2;
  if (recurringSavingsCents > 0 && recurringSavingsCents >= 0.05 * monthlyIncomeCents) {
    savingsPoints = 10;
  } else if (recurringSavingsCents > 0) {
    savingsPoints = 6;
  } else {
    savingsPoints = 2;
  }
  factors.push({
    id: 'savings_consistency',
    title: 'Savings Habit',
    points: savingsPoints,
    maxPoints: 10,
    explanation: recurringSavingsCents > 0
      ? `Regular recurring allocation of ${formatCents(recurringSavingsCents)}/mo.`
      : 'No automatic monthly savings habit established yet.',
  });

  const totalPoints = factors.reduce((sum, f) => sum + f.points, 0);
  const clampedScore = Math.max(0, Math.min(100, totalPoints));

  let label: string;
  if (clampedScore >= 80) {
    label = 'Foundation Strong';
  } else if (clampedScore >= 60) {
    label = 'Start Small / Learn';
  } else if (clampedScore >= 40) {
    label = 'Build Foundation';
  } else {
    label = 'Stabilize First';
  }

  return {
    score: clampedScore,
    label,
    factors,
  };
}
