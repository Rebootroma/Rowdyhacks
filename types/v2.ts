import { ExpenseCategory, Role } from './domain';

// Standard Score Result with Transparent Factors (Section 7 AI Agent Instructions)
export interface ScoreFactor {
  id: string;
  title: string;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface ScoreResult {
  score: number; // 0 - 100
  label: string;
  factors: ScoreFactor[];
}

// Personal Profile & Financial Snapshot
export interface PersonalProfile {
  userId: string;
  monthlyIncomeCents: number;
  cashBalanceCents: number;
  emergencySavingsCents: number;
  revolvingBalanceCents?: number;
  revolvingLimitCents?: number;
  onTimePaymentPercent?: number; // 0 - 100
  averageAccountAgeMonths?: number;
  hardInquiries?: number;
  userEnteredCreditScore?: number; // 300 - 850 (educational reference only)
  riskTolerance?: 'low' | 'moderate' | 'high';
  investmentHorizonMonths?: number;
  updatedAt?: string;
}

// Approval Policy Models
export interface ApprovalPolicy {
  id?: string;
  crewId?: string;
  minCents: number;
  maxCents: number | null;
  requiredApprovals: number;
  requiredRoles: Array<Role | 'viewer'>;
  autoApprove: boolean;
  priority?: number;
}

export interface PolicyEvaluationResult {
  autoApprove: boolean;
  requiredApprovals: number;
  requiredRoles: Array<Role | 'viewer'>;
  matchedPolicyId?: string;
  ruleExplanation: string;
}

// Financial Event for Tiger Data / Time-Series Hypertable
export interface FinancialEvent {
  time: string; // ISO timestamp
  id: string;
  scopeType: 'personal' | 'crew';
  scopeId: string;
  actorUserId?: string;
  eventType: string;
  amountCents?: number;
  category?: string;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, unknown>;
}

// Metric Snapshots
export interface PersonalMetricSnapshot {
  time: string;
  userId: string;
  financialHealth: number;
  creditHealth?: number;
  investmentReadiness?: number;
  monthlySpendCents: number;
  monthlyIncomeCents: number;
  cashBalanceCents: number;
  creditUtilizationPercent?: number;
  metadata?: Record<string, unknown>;
}

export interface CrewMetricSnapshot {
  time: string;
  crewId: string;
  approvedSpendCents: number;
  pendingSpendCents: number;
  remainingBudgetCents: number;
  dailyBurnCents: number;
  projectedMonthEndCents: number;
  healthScore: number;
  metadata?: Record<string, unknown>;
}

// Market Price Data
export interface MarketPrice {
  time: string;
  symbol: string;
  price: number;
  volume?: number;
  source: string;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  source: string;
  updatedAt: string;
}

// Portfolio & Simulation Types
export interface PortfolioAllocation {
  assetClass: string;
  assetType?: 'etf' | 'stock' | 'bond' | 'cash' | 'crypto';
  weightBps: number; // 10000 bps = 100.00%
}

export interface PortfolioSimulationAssumptions {
  conservativeAnnualRate: number; // e.g. 0.04
  baselineAnnualRate: number;     // e.g. 0.07
  highAnnualRate: number;         // e.g. 0.10
}

export interface PortfolioSimulationResult {
  conservativeCents: number;
  baselineCents: number;
  highCents: number;
  totalContributionsCents: number;
  horizonMonths: number;
  assumptions: PortfolioSimulationAssumptions;
}

export type StressScenarioId =
  | 'broad_market_shock'
  | 'tech_shock'
  | 'rate_shock'
  | 'international_shock';

export interface StressTestContribution {
  assetClass: string;
  shockPercent: number;
  weightBps: number;
  contributionPercent: number;
}

export interface StressTestResult {
  scenarioId: StressScenarioId;
  scenarioName: string;
  modeledChangePercent: number;
  contributions: StressTestContribution[];
  explanation: string;
}

// Forecast Types
export interface BurnRateForecastResult {
  method: 'average' | 'ewma';
  dailyBurnCents: number;
  projectedMonthEndCents: number;
  projectedRemainingCents: number;
  exhaustionDate: string | null;
  confidence: 'low' | 'medium' | 'high';
  daysInMonth: number;
  elapsedDays: number;
}

// Receipt Integrity Verification
export interface ReceiptIntegrityChecks {
  itemSumCents: number;
  subtotalCents: number;
  subtotalDifferenceCents: number;
  taxCents: number;
  tipCents: number;
  computedTotalCents: number;
  printedTotalCents: number;
  printedTotalDifferenceCents: number;
  isConsistent: boolean;
  notes?: string;
}

// V2 Multi-Signal Anomaly
export type AnomalyRiskBand = 'normal' | 'review' | 'unusual' | 'high attention';

export interface V2AnomalyFactor {
  signal: 'amount_anomaly' | 'budget_impact' | 'velocity_anomaly' | 'burst_signal' | 'category_novelty';
  score: number;
  maxScore: number;
  description: string;
}

export interface V2AnomalyResult {
  totalScore: number; // 0 - 100
  riskBand: AnomalyRiskBand;
  factors: V2AnomalyFactor[];
  summary: string;
}

// Solana Anchor
export interface SolanaAnchor {
  id?: string;
  expenseId: string;
  digest: string;
  signature: string;
  network: 'devnet';
  anchoredAt: string;
}

// Gemini Tool Call Contract
export interface GeminiToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface GeminiToolResult {
  tool: string;
  output: Record<string, unknown>;
}
