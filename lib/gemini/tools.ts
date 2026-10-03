import { computeAverageForecast } from '@/lib/finance/forecast';
import { calculateSpendWarning } from '@/lib/finance/budget';
import { calculateCreditHealth } from '@/lib/finance/credit-health';
import { calculateInvestmentReadiness } from '@/lib/finance/investment-readiness';
import { runStressTest, calculateVolatility, calculateDrawdown } from '@/lib/finance/portfolio';
import { ExpenseCategory } from '@/types/domain';
import { StressScenarioId } from '@/types/v2';
import { getMarketQuotes } from '@/lib/market/client';

export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'get_personal_summary',
    description: 'Retrieve current personal monthly income, approved expenses, surplus, and emergency savings.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_crew_budget_forecast',
    description: 'Retrieve shared Crew vault budget, approved spend, burn rate, and month-end forecast.',
    parameters: {
      type: 'OBJECT',
      properties: {
        crewId: { type: 'STRING', description: 'Crew identifier' },
      },
      required: ['crewId'],
    },
  },
  {
    name: 'simulate_purchase',
    description: 'Simulates the impact of a proposed purchase on the remaining shared budget and determines warning severity.',
    parameters: {
      type: 'OBJECT',
      properties: {
        crewId: { type: 'STRING', description: 'Crew identifier' },
        amountCents: { type: 'INTEGER', description: 'Proposed expense in integer cents' },
        category: { type: 'STRING', description: 'Expense category' },
      },
      required: ['crewId', 'amountCents', 'category'],
    },
  },
  {
    name: 'get_spending_trends',
    description: 'Retrieves spending trends, acceleration percentage, and category breakdown over a time window.',
    parameters: {
      type: 'OBJECT',
      properties: {
        days: { type: 'INTEGER', description: 'Window in days (7 to 180)' },
        crewId: { type: 'STRING', description: 'Optional crew id' },
      },
    },
  },
  {
    name: 'get_credit_health',
    description: 'Retrieves the educational CrewCash Credit Health score, utilization percentage, and transparent factors.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_investment_readiness',
    description: 'Retrieves the educational Investment Readiness score, emergency cushion coverage, and financial foundation status.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'run_portfolio_stress_test',
    description: 'Simulates a hypothetical market shock scenario (broad market, tech, rate, or international) on a student portfolio allocation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        scenarioId: {
          type: 'STRING',
          enum: ['broad_market_shock', 'tech_shock', 'rate_shock', 'international_shock'],
          description: 'Shock scenario preset',
        },
      },
      required: ['scenarioId'],
    },
  },
  {
    name: 'get_market_metrics',
    description: 'Returns historical educational metrics (price, volatility, maximum drawdown) for demo instruments.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Ticker symbol e.g. SPY, AAPL, BND' },
      },
      required: ['symbol'],
    },
  },
];

/**
 * Executes a deterministic financial tool call on behalf of Gemini Coach.
 * Ensures Gemini cannot write to the database or approve transactions.
 */
export async function executeFinancialTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case 'get_personal_summary': {
      return {
        month: new Date().toISOString().slice(0, 7),
        monthlyIncomeCents: 170000, // $1,700
        monthlyExpensesCents: 124000, // $1,240
        monthlySurplusCents: 46000, // +$460
        emergencySavingsCents: 90000, // $900
        creditUtilizationPercent: 31,
      };
    }

    case 'get_crew_budget_forecast': {
      // Mock / deterministic roadrunner robotics data
      const forecast = computeAverageForecast({
        monthlyBudgetCents: 300000, // $3,000
        approvedMonthSpendCents: 123600, // $1,236
        elapsedDays: 14,
        daysInMonth: 30,
      });
      return {
        crewName: 'Roadrunner Robotics',
        monthlyBudgetCents: 300000,
        approvedSpendCents: 123600,
        remainingBudgetCents: 300000 - 123600,
        dailyBurnCents: forecast.dailyBurnCents,
        projectedMonthEndCents: forecast.projectedMonthEndCents,
        projectedRemainingCents: forecast.projectedRemainingCents,
        exhaustionDate: forecast.exhaustionDate,
        confidence: forecast.confidence,
      };
    }

    case 'simulate_purchase': {
      const amountCents = Number(args.amountCents) || 0;
      const warning = calculateSpendWarning(amountCents, 300000, 123600);
      return {
        proposedExpenseCents: amountCents,
        remainingBeforeCents: warning.remainingBeforeCents,
        remainingAfterCents: warning.remainingAfterCents,
        shareOfRemainingPercent: Math.round(warning.shareOfRemaining * 100),
        severity: warning.severity,
        warningHeadline: warning.headline,
        warningMessage: warning.message,
      };
    }

    case 'get_spending_trends': {
      return {
        windowDays: Number(args.days) || 30,
        velocityChangePercent: 24,
        accelerationHeadline: 'Spending velocity ↑ 24% over recent 7 days',
        topCategories: [
          { category: 'supplies', amountCents: 45000 },
          { category: 'dining', amountCents: 31200 },
          { category: 'transportation', amountCents: 18000 },
        ],
      };
    }

    case 'get_credit_health': {
      const result = calculateCreditHealth({
        revolvingBalanceCents: 31000, // $310
        revolvingLimitCents: 100000, // $1,000 (31%)
        onTimePaymentPercent: 98,
        averageAccountAgeMonths: 18,
        hardInquiries: 1,
      });
      return {
        score: result.score,
        label: result.label,
        factors: result.factors,
        disclaimer: 'CrewCash Credit Health is an educational model and not a credit bureau score.',
      };
    }

    case 'get_investment_readiness': {
      const result = calculateInvestmentReadiness({
        monthlyIncomeCents: 170000,
        monthlyExpensesCents: 124000,
        emergencySavingsCents: 90000,
        revolvingDebtCents: 31000,
        revolvingLimitCents: 100000,
        investmentHorizonMonths: 36,
      });
      return {
        score: result.score,
        label: result.label,
        factors: result.factors,
      };
    }

    case 'run_portfolio_stress_test': {
      const scenarioId = (args.scenarioId as StressScenarioId) || 'broad_market_shock';
      const result = runStressTest({
        scenarioId,
        allocationsBps: [
          { assetClass: 'US Equity ETF (SPY)', weightBps: 6000 },
          { assetClass: 'International ETF (VXUS)', weightBps: 2000 },
          { assetClass: 'Bonds (BND)', weightBps: 1500 },
          { assetClass: 'Cash Equivalent', weightBps: 500 },
        ],
      });
      return {
        scenarioName: result.scenarioName,
        modeledChangePercent: result.modeledChangePercent,
        contributions: result.contributions,
        explanation: result.explanation,
      };
    }

    case 'get_market_metrics': {
      const symbol = String(args.symbol || 'SPY').toUpperCase();
      const quotes = await getMarketQuotes([symbol]);
      const quote = quotes[0];

      // Sample 30-day prices for demo volatility calculation anchored on current price
      const current = quote ? quote.price : 574.82;
      const samplePrices = [
        current * 0.96,
        current * 0.97,
        current * 0.95,
        current * 0.98,
        current * 0.99,
        current * 0.975,
        current * 1.01,
        current * 0.995,
        current * 1.005,
        current,
      ];
      const dailyReturns = [];
      for (let i = 1; i < samplePrices.length; i++) {
        dailyReturns.push((samplePrices[i] - samplePrices[i - 1]) / samplePrices[i - 1]);
      }
      const vol = calculateVolatility(dailyReturns);
      const dd = calculateDrawdown(samplePrices);

      return {
        symbol,
        latestPrice: quote ? quote.price : current,
        dayChange: quote ? quote.change : 0,
        dayChangePercent: quote ? quote.changePercent : 0,
        high: quote ? quote.high : current,
        low: quote ? quote.low : current,
        dataSource: quote ? quote.source : 'demo-feed',
        annualizedVolatilityPercent: Math.round(vol.annualizedVolatility * 100),
        maxDrawdownPercent: dd.maxDrawdownPercent,
        note: 'Historical educational metrics only. Not an indicator of future performance.',
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
