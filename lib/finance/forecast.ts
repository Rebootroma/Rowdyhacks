import { BurnRateForecastResult } from '@/types/v2';

export interface AverageForecastInput {
  approvedMonthSpendCents: number;
  elapsedDays: number;
  daysInMonth?: number;
  monthlyBudgetCents: number;
  dailySpendHistory?: number[];
}

export interface EwmaForecastInput {
  dailySpends: number[]; // sequential daily spending cents from day 1 to currentDay
  daysInMonth?: number;
  currentDay?: number;
  monthlyBudgetCents: number;
  approvedMonthSpendCents?: number;
  alpha?: number; // default 0.30
}

/**
 * Calculates budget exhaustion date based on remaining budget and daily burn rate.
 */
export function computeBudgetExhaustionDate(
  remainingBudgetCents: number,
  dailyBurnCents: number,
  startDate: Date = new Date()
): string | null {
  if (dailyBurnCents <= 0 || remainingBudgetCents <= 0) {
    return null;
  }

  const daysRemaining = Math.floor(remainingBudgetCents / dailyBurnCents);
  const targetDate = new Date(startDate.getTime());
  targetDate.setUTCDate(targetDate.getUTCDate() + daysRemaining);

  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates budget forecast using simple historical average burn rate.
 */
export function computeAverageForecast(input: AverageForecastInput): BurnRateForecastResult {
  const {
    approvedMonthSpendCents,
    elapsedDays,
    daysInMonth = 30,
    monthlyBudgetCents,
  } = input;

  const safeElapsedDays = Math.max(1, elapsedDays);
  const dailyBurnCents = Math.round(approvedMonthSpendCents / safeElapsedDays);
  const projectedMonthEndCents = dailyBurnCents * daysInMonth;
  const projectedRemainingCents = monthlyBudgetCents - projectedMonthEndCents;

  const remainingBudgetCents = Math.max(0, monthlyBudgetCents - approvedMonthSpendCents);
  const exhaustionDate = computeBudgetExhaustionDate(remainingBudgetCents, dailyBurnCents);

  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (safeElapsedDays > 14) {
    confidence = 'high';
  } else if (safeElapsedDays >= 7) {
    confidence = 'medium';
  }

  return {
    method: 'average',
    dailyBurnCents,
    projectedMonthEndCents,
    projectedRemainingCents,
    exhaustionDate,
    confidence,
    daysInMonth,
    elapsedDays: safeElapsedDays,
  };
}

/**
 * Calculates budget forecast using Exponentially Weighted Moving Average (EWMA).
 * EWMA_t = alpha * spend_t + (1 - alpha) * EWMA_(t-1)
 */
export function computeEwmaForecast(input: EwmaForecastInput): BurnRateForecastResult {
  const {
    dailySpends,
    daysInMonth = 30,
    currentDay = dailySpends.length,
    monthlyBudgetCents,
    alpha = 0.30,
  } = input;

  // If insufficient history (< 5 days), fallback to simple average
  const totalApproved = input.approvedMonthSpendCents ?? dailySpends.reduce((a, b) => a + b, 0);
  if (dailySpends.length < 5) {
    return computeAverageForecast({
      approvedMonthSpendCents: totalApproved,
      elapsedDays: currentDay,
      daysInMonth,
      monthlyBudgetCents,
    });
  }

  // Calculate EWMA
  let ewma = dailySpends[0];
  for (let i = 1; i < dailySpends.length; i++) {
    ewma = alpha * dailySpends[i] + (1 - alpha) * ewma;
  }

  const dailyBurnCents = Math.round(ewma);
  const remainingDays = Math.max(0, daysInMonth - currentDay);
  const projectedMonthEndCents = totalApproved + dailyBurnCents * remainingDays;
  const projectedRemainingCents = monthlyBudgetCents - projectedMonthEndCents;

  const remainingBudgetCents = Math.max(0, monthlyBudgetCents - totalApproved);
  const exhaustionDate = computeBudgetExhaustionDate(remainingBudgetCents, dailyBurnCents);

  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (dailySpends.length > 14) {
    confidence = 'high';
  } else if (dailySpends.length >= 7) {
    confidence = 'medium';
  }

  return {
    method: 'ewma',
    dailyBurnCents,
    projectedMonthEndCents,
    projectedRemainingCents,
    exhaustionDate,
    confidence,
    daysInMonth,
    elapsedDays: currentDay,
  };
}

/**
 * Spending acceleration comparing recent 7 days vs previous 7 days.
 */
export function calculateSpendingAcceleration(
  recent7DaysCents: number,
  previous7DaysCents: number
): { accelerationPercent: number; label: string } {
  const baseline = Math.max(100, previous7DaysCents); // prevent divide by zero
  const change = (recent7DaysCents - previous7DaysCents) / baseline;
  const accelerationPercent = Math.round(change * 100);

  let label: string;
  if (accelerationPercent > 10) {
    label = `Spending velocity ↑ ${accelerationPercent}% compared to prior 7-day period.`;
  } else if (accelerationPercent < -10) {
    label = `Spending velocity ↓ ${Math.abs(accelerationPercent)}% compared to prior 7-day period.`;
  } else {
    label = `Spending velocity is steady (flat compared to prior 7-day period).`;
  }

  return { accelerationPercent, label };
}
