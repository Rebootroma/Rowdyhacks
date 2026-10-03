import {
  PortfolioAllocation,
  PortfolioSimulationAssumptions,
  PortfolioSimulationResult,
  StressScenarioId,
  StressTestResult,
  StressTestContribution,
} from '@/types/v2';

export const DEFAULT_SIMULATION_ASSUMPTIONS: PortfolioSimulationAssumptions = {
  conservativeAnnualRate: 0.04,
  baselineAnnualRate: 0.07,
  highAnnualRate: 0.10,
};

/**
 * Validates portfolio asset allocation weights.
 * Basis points must sum to exactly 10,000 (100.00%).
 */
export function validateAllocations(
  allocations: Array<{ assetClass: string; weightBps: number }>
): { valid: boolean; totalBps: number; error?: string } {
  if (!allocations || allocations.length === 0) {
    return { valid: false, totalBps: 0, error: 'Allocation list cannot be empty' };
  }

  let totalBps = 0;
  for (const a of allocations) {
    if (a.weightBps < 0 || !Number.isInteger(a.weightBps)) {
      return { valid: false, totalBps, error: `Invalid weight ${a.weightBps} for ${a.assetClass}` };
    }
    totalBps += a.weightBps;
  }

  if (totalBps !== 10000) {
    return {
      valid: false,
      totalBps,
      error: `Allocations must total exactly 10,000 basis points (100%). Current total: ${totalBps} bps (${(totalBps / 100).toFixed(2)}%).`,
    };
  }

  return { valid: true, totalBps: 10000 };
}

/**
 * Hypothetical compounding growth simulator across conservative, baseline, and growth assumptions.
 * Formula: Month-by-month compounding with recurring monthly contributions.
 */
export function simulatePortfolio(input: {
  initialCents: number;
  monthlyContributionCents: number;
  horizonMonths: number;
  assumptions?: Partial<PortfolioSimulationAssumptions>;
}): PortfolioSimulationResult {
  const {
    initialCents,
    monthlyContributionCents,
    horizonMonths,
    assumptions = {},
  } = input;

  const resolvedAssumptions: PortfolioSimulationAssumptions = {
    conservativeAnnualRate: assumptions.conservativeAnnualRate ?? DEFAULT_SIMULATION_ASSUMPTIONS.conservativeAnnualRate,
    baselineAnnualRate: assumptions.baselineAnnualRate ?? DEFAULT_SIMULATION_ASSUMPTIONS.baselineAnnualRate,
    highAnnualRate: assumptions.highAnnualRate ?? DEFAULT_SIMULATION_ASSUMPTIONS.highAnnualRate,
  };

  const simulateCurve = (annualRate: number) => {
    const monthlyRate = annualRate / 12;
    let balance = initialCents;
    for (let m = 0; m < horizonMonths; m++) {
      balance = (balance + monthlyContributionCents) * (1 + monthlyRate);
    }
    return Math.round(balance);
  };

  const conservativeCents = simulateCurve(resolvedAssumptions.conservativeAnnualRate);
  const baselineCents = simulateCurve(resolvedAssumptions.baselineAnnualRate);
  const highCents = simulateCurve(resolvedAssumptions.highAnnualRate);
  const totalContributionsCents = initialCents + monthlyContributionCents * horizonMonths;

  return {
    conservativeCents,
    baselineCents,
    highCents,
    totalContributionsCents,
    horizonMonths,
    assumptions: resolvedAssumptions,
  };
}

const STRESS_SCENARIOS: Record<
  StressScenarioId,
  { name: string; shocks: Record<string, number>; defaultShock: number; explanation: string }
> = {
  broad_market_shock: {
    name: 'Broad Market Correction',
    shocks: {
      us_equity: -0.10,
      equities: -0.10,
      stocks: -0.10,
      tech: -0.12,
      international: -0.10,
      bonds: 0.02,
      cash: 0.0,
      crypto: -0.20,
    },
    defaultShock: -0.08,
    explanation: 'Simulates a standard broad-market pullback of ~10% equities with mild flight to bonds.',
  },
  tech_shock: {
    name: 'Tech Sector Selloff',
    shocks: {
      tech: -0.25,
      us_equity: -0.08,
      equities: -0.08,
      international: -0.05,
      bonds: 0.01,
      cash: 0.0,
      crypto: -0.15,
    },
    defaultShock: -0.05,
    explanation: 'Simulates a sharp 25% drawdown in tech-heavy sleeves while fixed income remains insulated.',
  },
  rate_shock: {
    name: 'Interest Rate Spike',
    shocks: {
      bonds: -0.08,
      us_equity: -0.04,
      tech: -0.06,
      international: -0.04,
      cash: 0.01,
      crypto: -0.10,
    },
    defaultShock: -0.04,
    explanation: 'Simulates rising benchmark rates impacting fixed-income bond durations and long-duration equities.',
  },
  international_shock: {
    name: 'Global Currency & Emerging Market Strain',
    shocks: {
      international: -0.12,
      us_equity: -0.03,
      tech: -0.02,
      bonds: 0.0,
      cash: 0.0,
      crypto: -0.05,
    },
    defaultShock: -0.03,
    explanation: 'Simulates foreign exchange swings and foreign market downturns affecting global holdings.',
  },
};

/**
 * Runs a weighted portfolio stress test scenario.
 */
export function runStressTest(input: {
  allocationsBps: PortfolioAllocation[];
  scenarioId: StressScenarioId;
}): StressTestResult {
  const { allocationsBps, scenarioId } = input;
  const scenario = STRESS_SCENARIOS[scenarioId] || STRESS_SCENARIOS.broad_market_shock;

  const contributions: StressTestContribution[] = [];
  let totalModeledChange = 0;

  for (const alloc of allocationsBps) {
    const key = alloc.assetClass.toLowerCase().replace(/[\s-_]/g, '');
    let matchedShock = scenario.defaultShock;

    for (const [shockKey, shockVal] of Object.entries(scenario.shocks)) {
      if (key.includes(shockKey) || shockKey.includes(key)) {
        matchedShock = shockVal;
        break;
      }
    }

    const weightRatio = alloc.weightBps / 10000;
    const contributionPercent = weightRatio * matchedShock * 100;
    totalModeledChange += contributionPercent;

    contributions.push({
      assetClass: alloc.assetClass,
      shockPercent: matchedShock * 100,
      weightBps: alloc.weightBps,
      contributionPercent: Number(contributionPercent.toFixed(2)),
    });
  }

  return {
    scenarioId,
    scenarioName: scenario.name,
    modeledChangePercent: Number(totalModeledChange.toFixed(2)),
    contributions,
    explanation: scenario.explanation,
  };
}

/**
 * Computes sample standard deviation of daily return series.
 * Annualized volatility = dailyVol * sqrt(252).
 */
export function calculateVolatility(dailyReturns: number[]): {
  dailyVolatility: number;
  annualizedVolatility: number;
} {
  if (!dailyReturns || dailyReturns.length < 2) {
    return { dailyVolatility: 0, annualizedVolatility: 0 };
  }

  const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) /
    (dailyReturns.length - 1);
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252);

  return {
    dailyVolatility: Number(dailyVolatility.toFixed(6)),
    annualizedVolatility: Number(annualizedVolatility.toFixed(4)),
  };
}

/**
 * Calculates historical peak and maximum drawdown from price series.
 * Drawdown_t = (Price_t - Peak_t) / Peak_t
 */
export function calculateDrawdown(prices: number[]): {
  maxDrawdownPercent: number;
  drawdownSeries: number[];
} {
  if (!prices || prices.length === 0) {
    return { maxDrawdownPercent: 0, drawdownSeries: [] };
  }

  let runningPeak = prices[0];
  let maxDrawdown = 0;
  const drawdownSeries: number[] = [];

  for (const price of prices) {
    if (price > runningPeak) {
      runningPeak = price;
    }
    const dd = runningPeak > 0 ? (price - runningPeak) / runningPeak : 0;
    drawdownSeries.push(Number((dd * 100).toFixed(2)));
    if (dd < maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  return {
    maxDrawdownPercent: Number((maxDrawdown * 100).toFixed(2)),
    drawdownSeries,
  };
}
