import { ScoreResult, ScoreFactor } from '@/types/v2';

export const CREDIT_HEALTH_DISCLAIMER =
  'CrewCash Credit Health is an educational model and not a credit bureau score.';

export interface CreditHealthInput {
  revolvingBalanceCents?: number;
  revolvingLimitCents?: number;
  onTimePaymentPercent?: number; // 0 - 100
  averageAccountAgeMonths?: number;
  hardInquiries?: number;
  hasCreditMix?: boolean;
}

export interface CreditSimulationInput extends CreditHealthInput {
  totalLimitCents: number;
  currentBalanceCents: number;
  simulatedBalanceCents: number;
}

export interface CreditSimulationResult {
  currentUtilizationPercent: number;
  simulatedUtilizationPercent: number;
  currentScore: ScoreResult;
  simulatedScore: ScoreResult;
  scoreDifference: number;
  disclaimer: string;
}

/**
 * Deterministic educational Credit Health Score Engine.
 * Never hallucinated by an LLM.
 */
export function calculateCreditHealth(input: CreditHealthInput): ScoreResult {
  const {
    revolvingBalanceCents = 0,
    revolvingLimitCents = 0,
    onTimePaymentPercent = 100,
    averageAccountAgeMonths = 12,
    hardInquiries = 0,
    hasCreditMix = false,
  } = input;

  const factors: ScoreFactor[] = [];

  // 1. Payment Behavior (Max 35 points)
  let paymentPoints = 35;
  if (onTimePaymentPercent >= 99) {
    paymentPoints = 35;
  } else if (onTimePaymentPercent >= 95) {
    paymentPoints = 28;
  } else if (onTimePaymentPercent >= 90) {
    paymentPoints = 20;
  } else {
    paymentPoints = 10;
  }
  factors.push({
    id: 'payment_behavior',
    title: 'Payment History',
    points: paymentPoints,
    maxPoints: 35,
    explanation: `${onTimePaymentPercent}% on-time payment track record across reported accounts.`,
  });

  // 2. Revolving Credit Utilization (Max 30 points)
  let utilizationPoints = 30;
  let utilPercent = 0;
  if (revolvingLimitCents > 0) {
    utilPercent = Math.round((revolvingBalanceCents / revolvingLimitCents) * 100);
    if (utilPercent <= 10) {
      utilPoints(30, `${utilPercent}% utilization (exceptional: under 10% threshold)`);
    } else if (utilPercent <= 30) {
      utilPoints(25, `${utilPercent}% utilization (healthy: under standard 30% guideline)`);
    } else if (utilPercent <= 50) {
      utilPoints(16, `${utilPercent}% utilization (moderate: elevated balance ratio)`);
    } else if (utilPercent <= 75) {
      utilPoints(8, `${utilPercent}% utilization (high: consuming major portion of credit line)`);
    } else {
      utilPoints(2, `${utilPercent}% utilization (critical: nearing maximum revolving limit)`);
    }
  } else {
    factors.push({
      id: 'utilization',
      title: 'Credit Utilization',
      points: 20,
      maxPoints: 30,
      explanation: 'No revolving credit line active. Establishing a card with low usage builds this metric.',
    });
  }

  function utilPoints(pts: number, exp: string) {
    utilizationPoints = pts;
    factors.push({
      id: 'utilization',
      title: 'Credit Utilization',
      points: pts,
      maxPoints: 30,
      explanation: exp,
    });
  }

  // 3. Length of Credit History / Account Age (Max 15 points)
  let agePoints = 5;
  if (averageAccountAgeMonths >= 36) {
    agePoints = 15;
  } else if (averageAccountAgeMonths >= 24) {
    agePoints = 12;
  } else if (averageAccountAgeMonths >= 12) {
    agePoints = 9;
  } else {
    agePoints = 5;
  }
  factors.push({
    id: 'account_age',
    title: 'Credit Age',
    points: agePoints,
    maxPoints: 15,
    explanation: `Average account age of ${averageAccountAgeMonths} months.`,
  });

  // 4. Credit Mix (Max 10 points)
  const mixPoints = hasCreditMix ? 10 : 7;
  factors.push({
    id: 'credit_mix',
    title: 'Account Variety',
    points: mixPoints,
    maxPoints: 10,
    explanation: hasCreditMix
      ? 'Balanced mix of revolving lines and installment or student accounts.'
      : 'Primarily single-type credit line.',
  });

  // 5. Recent Inquiries (Max 10 points)
  let inquiryPoints = 10;
  if (hardInquiries === 0) {
    inquiryPoints = 10;
  } else if (hardInquiries === 1) {
    inquiryPoints = 8;
  } else if (hardInquiries === 2) {
    inquiryPoints = 5;
  } else {
    inquiryPoints = 2;
  }
  factors.push({
    id: 'inquiries',
    title: 'Recent Hard Inquiries',
    points: inquiryPoints,
    maxPoints: 10,
    explanation: hardInquiries === 0
      ? '0 hard inquiries in the past 12 months.'
      : `${hardInquiries} hard credit inquiry application(s) detected.`,
  });

  const totalPoints = factors.reduce((sum, f) => sum + f.points, 0);
  const clampedScore = Math.max(0, Math.min(100, totalPoints));

  let label = 'Healthy';
  if (clampedScore >= 85) label = 'Excellent';
  else if (clampedScore >= 70) label = 'Good';
  else if (clampedScore >= 55) label = 'Fair';
  else label = 'Building Foundation';

  return {
    score: clampedScore,
    label,
    factors,
  };
}

/**
 * Simulates the impact of paying down or charging a revolving credit balance.
 */
export function simulateCredit(input: CreditSimulationInput): CreditSimulationResult {
  const { totalLimitCents, currentBalanceCents, simulatedBalanceCents } = input;

  const currentUtilizationPercent = totalLimitCents > 0
    ? Math.round((currentBalanceCents / totalLimitCents) * 100)
    : 0;

  const simulatedUtilizationPercent = totalLimitCents > 0
    ? Math.round((simulatedBalanceCents / totalLimitCents) * 100)
    : 0;

  const currentScore = calculateCreditHealth({
    ...input,
    revolvingLimitCents: totalLimitCents,
    revolvingBalanceCents: currentBalanceCents,
  });

  const simulatedScore = calculateCreditHealth({
    ...input,
    revolvingLimitCents: totalLimitCents,
    revolvingBalanceCents: simulatedBalanceCents,
  });

  return {
    currentUtilizationPercent,
    simulatedUtilizationPercent,
    currentScore,
    simulatedScore,
    scoreDifference: simulatedScore.score - currentScore.score,
    disclaimer: CREDIT_HEALTH_DISCLAIMER,
  };
}
