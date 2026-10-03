import { z } from 'zod';

export const expenseCategoriesEnum = z.enum([
  'housing',
  'groceries',
  'dining',
  'transportation',
  'utilities',
  'education',
  'healthcare',
  'entertainment',
  'shopping',
  'other',
]);

export const expenseStatusEnum = z.enum(['draft', 'pending', 'approved', 'rejected']);

export const roleEnum = z.enum(['owner', 'treasurer', 'member']);

// Auth
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Crews
export const createCrewSchema = z.object({
  name: z.string().min(1, 'Crew name is required').max(80, 'Name must be under 80 characters'),
  description: z.string().max(250).optional().nullable(),
});

export const joinCrewSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(3, 'Invalid invite code format')
    .transform((val) => val.toUpperCase()),
});

// Budgets
export const setBudgetSchema = z.object({
  crewId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Month must be in YYYY-MM-01 format'),
  amountCents: z.number().int().positive('Budget amount must be greater than $0'),
  approvalThresholdCents: z
    .number()
    .int()
    .nonnegative('Threshold must be at least $0')
    .default(20000), // Default $200.00
});

// Expenses
export const expenseSplitSchema = z.object({
  userId: z.string(),
  amountCents: z.number().int().nonnegative('Split cannot be negative'),
});

export const createExpenseSchema = z.object({
  crewId: z.string(),
  title: z.string().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  merchant: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  amountCents: z.number().int().positive('Amount must be greater than $0'),
  category: expenseCategoriesEnum,
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  receiptPath: z.string().optional().nullable(),
  splits: z.array(expenseSplitSchema).min(1, 'Expense must be split among at least 1 member'),
});

// Approvals
export const recordApprovalSchema = z.object({
  expenseId: z.string(),
  decision: z.enum(['approved', 'rejected']),
});

// Savings Goals
export const createGoalSchema = z.object({
  crewId: z.string(),
  title: z.string().min(1, 'Title is required').max(80),
  targetCents: z.number().int().positive('Target must be greater than $0'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const contributeGoalSchema = z.object({
  goalId: z.string(),
  amountCents: z.number().int().positive('Contribution must be positive'),
});

// AI Schemas (strict outputs)
export const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().default(1),
  amount_cents: z.number().int(),
});

export const receiptExtractionSchema = z.object({
  merchant: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  subtotal_cents: z.number().int().nullable().optional(),
  tax_cents: z.number().int().nullable().optional(),
  tip_cents: z.number().int().nullable().optional(),
  total_cents: z.number().int(),
  currency: z.string().nullable().default(null),
  category: expenseCategoriesEnum.default('other'),
  items: z.array(receiptItemSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.85),
  notes: z.string().optional(),
});

export const budgetExplanationSchema = z.object({
  headline: z.string().max(120),
  summary: z.string().max(600),
  observations: z.array(z.string().max(200)).max(3),
  suggestions: z.array(z.string().max(200)).max(3),
});

export const budgetRescueSchema = z.object({
  headline: z.string(),
  shortageCents: z.number().int(),
  adjustments: z.array(
    z.object({
      category: expenseCategoriesEnum,
      recommendedCutCents: z.number().int(),
      actionText: z.string(),
    })
  ),
  safetyNotes: z.string(),
});

// =========================================================
// CREWCASH V2 SCHEMAS
// =========================================================

// Personal Profile Snapshot
export const savePersonalSnapshotSchema = z.object({
  monthlyIncomeCents: z.number().int().nonnegative('Monthly income must be nonnegative'),
  cashBalanceCents: z.number().int(),
  emergencySavingsCents: z.number().int().nonnegative('Emergency savings must be nonnegative'),
  revolvingBalanceCents: z.number().int().nonnegative().optional(),
  revolvingLimitCents: z.number().int().positive().optional(),
  onTimePaymentPercent: z.number().min(0).max(100).optional(),
  averageAccountAgeMonths: z.number().int().nonnegative().optional(),
  hardInquiries: z.number().int().nonnegative().optional(),
  userEnteredCreditScore: z.number().int().min(300).max(850).optional(),
  riskTolerance: z.enum(['low', 'moderate', 'high']).optional(),
  investmentHorizonMonths: z.number().int().nonnegative().optional(),
});

// Approval Policy
export const approvalPolicyItemSchema = z.object({
  minCents: z.number().int().nonnegative(),
  maxCents: z.number().int().nonnegative().nullable(),
  requiredApprovals: z.number().int().min(0).max(10),
  requiredRoles: z.array(roleEnum).default([]),
  autoApprove: z.boolean().default(false),
  priority: z.number().int().default(0),
}).refine(
  (data) => data.maxCents === null || data.maxCents >= data.minCents,
  {
    message: 'maxCents must be greater than or equal to minCents',
    path: ['maxCents'],
  }
);

export const setApprovalPoliciesSchema = z.object({
  crewId: z.string(),
  policies: z.array(approvalPolicyItemSchema).min(1, 'Must provide at least one policy tier'),
});

// Credit Simulation
export const creditSimulationSchema = z.object({
  totalLimitCents: z.number().int().positive('Total limit must be positive'),
  currentBalanceCents: z.number().int().nonnegative('Current balance must be nonnegative'),
  simulatedBalanceCents: z.number().int().nonnegative('Simulated balance must be nonnegative'),
  onTimePaymentPercent: z.number().min(0).max(100).optional(),
  averageAccountAgeMonths: z.number().int().nonnegative().optional(),
  hardInquiries: z.number().int().nonnegative().optional(),
});

// Portfolio Allocation & Simulation
export const portfolioAllocationItemSchema = z.object({
  assetClass: z.string().min(1, 'Asset class name required'),
  assetType: z.enum(['etf', 'stock', 'bond', 'cash', 'crypto']).optional(),
  weightBps: z.number().int().min(0).max(10000),
});

export const portfolioSimulationSchema = z.object({
  initialCents: z.number().int().nonnegative('Initial investment must be nonnegative'),
  monthlyContributionCents: z.number().int().nonnegative('Monthly contribution must be nonnegative'),
  horizonMonths: z.number().int().min(1).max(600, 'Horizon must be between 1 and 600 months'),
  allocationsBps: z.array(portfolioAllocationItemSchema).min(1),
  assumptions: z
    .object({
      conservativeAnnualRate: z.number().min(0).max(0.50),
      baselineAnnualRate: z.number().min(0).max(0.50),
      highAnnualRate: z.number().min(0).max(0.50),
    })
    .optional(),
}).refine(
  (data) => {
    const total = data.allocationsBps.reduce((acc, a) => acc + a.weightBps, 0);
    return total === 10000;
  },
  {
    message: 'Allocation weights must sum to exactly 10,000 basis points (100.00%)',
    path: ['allocationsBps'],
  }
);

// Portfolio Stress Test
export const portfolioStressTestSchema = z.object({
  allocationsBps: z.array(portfolioAllocationItemSchema).min(1),
  scenarioId: z.enum([
    'broad_market_shock',
    'tech_shock',
    'rate_shock',
    'international_shock',
  ]),
});

// Financial Event Append Schema (Tiger Data hypertable)
export const financialEventAppendSchema = z.object({
  scopeType: z.enum(['personal', 'crew']),
  scopeId: z.string(),
  eventType: z.string().min(1),
  actorUserId: z.string().optional(),
  amountCents: z.number().int().optional(),
  category: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// Receipt Integrity Verification Schema
export const receiptIntegrityChecksSchema = z.object({
  itemSumCents: z.number().int(),
  subtotalCents: z.number().int(),
  subtotalDifferenceCents: z.number().int(),
  taxCents: z.number().int(),
  tipCents: z.number().int(),
  computedTotalCents: z.number().int(),
  printedTotalCents: z.number().int(),
  printedTotalDifferenceCents: z.number().int(),
  isConsistent: z.boolean(),
  notes: z.string().optional(),
});

// Gemini Coach Request Schema
export const geminiCoachRequestSchema = z.object({
  mode: z.enum(['personal', 'crew']),
  message: z.string().min(1, 'Message is required').max(1000),
  crewId: z.string().nullable().optional(),
});

// Tool Argument Schemas for Gemini Function Calling
export const getPersonalSummaryArgsSchema = z.object({});

export const getCrewBudgetForecastArgsSchema = z.object({
  crewId: z.string().min(1),
});

export const simulatePurchaseArgsSchema = z.object({
  crewId: z.string().min(1),
  amountCents: z.number().int().positive(),
  category: expenseCategoriesEnum,
});

export const getSpendingTrendsArgsSchema = z.object({
  days: z.number().int().min(7).max(180).default(30),
  crewId: z.string().optional(),
});

export const simulateCreditArgsSchema = z.object({
  simulatedBalanceCents: z.number().int().nonnegative(),
});
