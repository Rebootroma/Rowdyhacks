export type Role = 'owner' | 'treasurer' | 'member';

export type ExpenseCategory =
  | 'housing'
  | 'groceries'
  | 'dining'
  | 'transportation'
  | 'utilities'
  | 'education'
  | 'healthcare'
  | 'entertainment'
  | 'shopping'
  | 'other';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { id: 'housing', label: 'Housing / Rent', icon: 'Home', color: '#6366f1' },
  { id: 'groceries', label: 'Groceries', icon: 'ShoppingCart', color: '#10b981' },
  { id: 'dining', label: 'Dining & Takeout', icon: 'Utensils', color: '#f59e0b' },
  { id: 'transportation', label: 'Transport / Gas', icon: 'Car', color: '#06b6d4' },
  { id: 'utilities', label: 'Utilities & WiFi', icon: 'Zap', color: '#8b5cf6' },
  { id: 'education', label: 'Books & Supplies', icon: 'GraduationCap', color: '#3b82f6' },
  { id: 'healthcare', label: 'Health & Medical', icon: 'Activity', color: '#ec4899' },
  { id: 'entertainment', label: 'Recreation & Fun', icon: 'Film', color: '#f43f5e' },
  { id: 'shopping', label: 'Supplies & Gear', icon: 'Package', color: '#14b8a6' },
  { id: 'other', label: 'Miscellaneous', icon: 'Layers', color: '#64748b' },
];

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type ApprovalDecision = 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email?: string;
  display_name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface Crew {
  id: string;
  name: string;
  description?: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface CrewMember {
  crew_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  profile?: UserProfile;
}

export interface Budget {
  id: string;
  crew_id: string;
  month: string; // YYYY-MM-01
  amount_cents: number;
  approval_threshold_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  crew_id: string;
  created_by: string;
  title: string;
  merchant?: string | null;
  description?: string | null;
  amount_cents: number;
  category: ExpenseCategory;
  expense_date: string;
  status: ExpenseStatus;
  approval_required: boolean;
  receipt_path?: string | null;
  created_at: string;
  updated_at: string;
  creator?: UserProfile;
  splits?: ExpenseSplit[];
  approvals?: ExpenseApproval[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount_cents: number;
  profile?: UserProfile;
}

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  user_id: string;
  decision: ApprovalDecision;
  decided_at: string;
  profile?: UserProfile;
}

export interface SavingsGoal {
  id: string;
  crew_id: string;
  title: string;
  target_cents: number;
  current_cents: number;
  due_date?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  crew_id: string;
  actor_user_id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: UserProfile;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  crew_id?: string | null;
  type: string;
  title: string;
  body: string;
  read_at?: string | null;
  created_at: string;
}

// Financial Analytics & Health
export interface HealthScoreFactor {
  code: string;
  impact: number; // positive or negative points
  explanation: string;
}

export interface HealthScoreResult {
  score: number; // 0 - 100 clamped
  label: 'Strong' | 'Healthy' | 'Needs Attention' | 'Action Recommended';
  color: string;
  factors: HealthScoreFactor[];
}

export interface SpendWarning {
  severity: 'low' | 'medium' | 'high' | 'critical';
  headline: string;
  message: string;
  remainingBeforeCents: number;
  remainingAfterCents: number;
  shareOfRemaining: number;
}

export interface SpendingAnomaly {
  severity: 'low' | 'medium' | 'high';
  category: ExpenseCategory;
  reason: string;
  amountCents: number;
  baselineCents?: number;
}

// AI Structures
export interface ReceiptItem {
  name: string;
  quantity: number;
  amount_cents: number;
}

export interface ReceiptExtraction {
  merchant: string | null;
  date: string | null;
  subtotal_cents?: number | null;
  tax_cents?: number | null;
  tip_cents?: number | null;
  total_cents: number;
  currency: string | null;
  category: ExpenseCategory;
  items: ReceiptItem[];
  confidence: number;
  notes?: string;
}

export interface BudgetExplanation {
  headline: string;
  summary: string;
  observations: string[];
  suggestions: string[];
}

export interface BudgetRescueAdjustment {
  category: ExpenseCategory;
  recommendedCutCents: number;
  actionText: string;
}

export interface BudgetRescueResult {
  headline: string;
  shortageCents: number;
  adjustments: BudgetRescueAdjustment[];
  safetyNotes: string;
}
