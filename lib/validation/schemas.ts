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
