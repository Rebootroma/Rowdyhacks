import {
  UserProfile,
  Crew,
  CrewMember,
  Budget,
  Expense,
  ExpenseStatus,
  SavingsGoal,
  AuditLog,
  ExpenseCategory,
  ExpenseSplit,
  ExpenseApproval,
  SolanaAnchor,
} from '@/types/domain';
import {
  DEMO_USERS,
  DEMO_CREW,
  DEMO_MEMBERS,
  DEMO_BUDGET,
  DEMO_EXPENSES,
  DEMO_GOALS,
  DEMO_AUDIT_LOGS,
} from './demo-data';
import { calculateEqualSplit } from '../finance/splits';

export interface DemoStoreState {
  currentUserId: string;
  crew: Crew;
  members: CrewMember[];
  budget: Budget;
  expenses: Expense[];
  goals: SavingsGoal[];
  auditLogs: AuditLog[];
  solanaAnchors: SolanaAnchor[];
}

const STORAGE_KEY = 'crewcash_demo_state_v1';

// Server-side singleton in-memory state
let serverState: DemoStoreState = {
  currentUserId: DEMO_USERS.alex.id,
  crew: { ...DEMO_CREW },
  members: [...DEMO_MEMBERS],
  budget: { ...DEMO_BUDGET },
  expenses: JSON.parse(JSON.stringify(DEMO_EXPENSES)),
  goals: JSON.parse(JSON.stringify(DEMO_GOALS)),
  auditLogs: JSON.parse(JSON.stringify(DEMO_AUDIT_LOGS)),
  solanaAnchors: [],
};

function withDefaults(state: DemoStoreState): DemoStoreState {
  return {
    ...state,
    solanaAnchors: state.solanaAnchors ?? [],
  };
}

export function getDemoState(): DemoStoreState {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return withDefaults(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved demo state', e);
      }
    }
  }
  return withDefaults(serverState);
}

export function saveDemoState(state: DemoStoreState): void {
  serverState = state;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('crewcash_state_updated'));
  }
}

export function resetDemoState(): DemoStoreState {
  const initial: DemoStoreState = {
    currentUserId: DEMO_USERS.alex.id,
    crew: { ...DEMO_CREW },
    members: [...DEMO_MEMBERS],
    budget: { ...DEMO_BUDGET },
    expenses: JSON.parse(JSON.stringify(DEMO_EXPENSES)),
    goals: JSON.parse(JSON.stringify(DEMO_GOALS)),
    auditLogs: JSON.parse(JSON.stringify(DEMO_AUDIT_LOGS)),
    solanaAnchors: [],
  };
  saveDemoState(initial);
  return initial;
}

export function saveSolanaAnchor(anchor: SolanaAnchor): SolanaAnchor {
  const state = getDemoState();
  const without = (state.solanaAnchors ?? []).filter((a) => a.expenseId !== anchor.expenseId);
  state.solanaAnchors = [anchor, ...without];
  saveDemoState(state);
  return anchor;
}

export function getSolanaAnchorForExpense(expenseId: string): SolanaAnchor | undefined {
  return getDemoState().solanaAnchors?.find((a) => a.expenseId === expenseId);
}

export function getCurrentUser(state = getDemoState()): UserProfile {
  const found = Object.values(DEMO_USERS).find((u) => u.id === state.currentUserId);
  return found || DEMO_USERS.alex;
}

export function setCurrentUser(userId: string): void {
  const state = getDemoState();
  state.currentUserId = userId;
  saveDemoState(state);
}

export function getCrewMembers(state = getDemoState()): CrewMember[] {
  return state.members;
}

export function getBudget(state = getDemoState()): Budget {
  return state.budget;
}

export function updateBudget(amountCents: number, approvalThresholdCents: number): Budget {
  const state = getDemoState();
  const actor = getCurrentUser(state);

  state.budget = {
    ...state.budget,
    amount_cents: amountCents,
    approval_threshold_cents: approvalThresholdCents,
    updated_at: new Date().toISOString(),
  };

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    crew_id: state.crew.id,
    actor_user_id: actor.id,
    action: 'BUDGET_UPDATED',
    entity_type: 'budget',
    entity_id: state.budget.id,
    metadata: { amount_cents: amountCents, threshold_cents: approvalThresholdCents },
    created_at: new Date().toISOString(),
    actor,
  });

  saveDemoState(state);
  return state.budget;
}

export function createExpense(input: {
  title: string;
  merchant?: string | null;
  description?: string | null;
  amountCents: number;
  category: ExpenseCategory;
  expenseDate: string;
  memberIds: string[];
  receiptPath?: string | null;
}): Expense {
  const state = getDemoState();
  const actor = getCurrentUser(state);

  // Approval Threshold Logic: >= threshold requires approvals
  const approvalRequired = input.amountCents >= state.budget.approval_threshold_cents;
  const status: ExpenseStatus = approvalRequired ? 'pending' : 'approved';

  // Calculate strict integer cents splits
  const splitCalculations = calculateEqualSplit(input.amountCents, input.memberIds);
  const expenseId = `exp-${Date.now()}`;

  const splits: ExpenseSplit[] = splitCalculations.map((sc, i) => {
    const memberProfile = Object.values(DEMO_USERS).find((u) => u.id === sc.userId);
    return {
      id: `split-${Date.now()}-${i}`,
      expense_id: expenseId,
      user_id: sc.userId,
      amount_cents: sc.amountCents,
      profile: memberProfile,
    };
  });

  const newExpense: Expense = {
    id: expenseId,
    crew_id: state.crew.id,
    created_by: actor.id,
    title: input.title,
    merchant: input.merchant,
    description: input.description,
    amount_cents: input.amountCents,
    category: input.category,
    expense_date: input.expenseDate,
    status,
    approval_required: approvalRequired,
    receipt_path: input.receiptPath,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator: actor,
    splits,
    approvals: [],
  };

  state.expenses.unshift(newExpense);

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    crew_id: state.crew.id,
    actor_user_id: actor.id,
    action: approvalRequired ? 'EXPENSE_PENDING_APPROVAL' : 'EXPENSE_APPROVED_DIRECT',
    entity_type: 'expense',
    entity_id: expenseId,
    metadata: {
      title: input.title,
      amount_cents: input.amountCents,
      category: input.category,
      status,
    },
    created_at: new Date().toISOString(),
    actor,
  });

  saveDemoState(state);
  return newExpense;
}

export function recordApprovalDecision(
  expenseId: string,
  decision: 'approved' | 'rejected'
): Expense {
  const state = getDemoState();
  const actor = getCurrentUser(state);

  const expenseIndex = state.expenses.findIndex((e) => e.id === expenseId);
  if (expenseIndex === -1) throw new Error('Expense not found');

  const expense = { ...state.expenses[expenseIndex] };

  // Rule: creator cannot approve own expense
  if (expense.created_by === actor.id) {
    throw new Error('Expense creator cannot approve their own expense');
  }

  // Prevent duplicate voting
  const existingVote = expense.approvals?.find((a) => a.user_id === actor.id);
  if (existingVote) {
    throw new Error('You have already recorded a decision on this expense');
  }

  const newApproval: ExpenseApproval = {
    id: `appr-${Date.now()}`,
    expense_id: expense.id,
    user_id: actor.id,
    decision,
    decided_at: new Date().toISOString(),
    profile: actor,
  };

  const updatedApprovals = [...(expense.approvals || []), newApproval];
  expense.approvals = updatedApprovals;

  if (decision === 'rejected') {
    expense.status = 'rejected';
  } else {
    // 2 Approvals required to finalize
    const approvedCount = updatedApprovals.filter((a) => a.decision === 'approved').length;
    if (approvedCount >= 2) {
      expense.status = 'approved';
    }
  }

  expense.updated_at = new Date().toISOString();
  state.expenses[expenseIndex] = expense;

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    crew_id: state.crew.id,
    actor_user_id: actor.id,
    action: decision === 'approved' ? 'EXPENSE_APPROVED_VOTE' : 'EXPENSE_REJECTED_VOTE',
    entity_type: 'expense',
    entity_id: expense.id,
    metadata: {
      decision,
      new_status: expense.status,
      approvals_count: expense.approvals.filter((a) => a.decision === 'approved').length,
    },
    created_at: new Date().toISOString(),
    actor,
  });

  saveDemoState(state);
  return expense;
}

export function contributeToGoal(goalId: string, amountCents: number): SavingsGoal {
  const state = getDemoState();
  const actor = getCurrentUser(state);

  const goalIndex = state.goals.findIndex((g) => g.id === goalId);
  if (goalIndex === -1) throw new Error('Goal not found');

  const goal = { ...state.goals[goalIndex] };
  goal.current_cents += amountCents;
  state.goals[goalIndex] = goal;

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    crew_id: state.crew.id,
    actor_user_id: actor.id,
    action: 'GOAL_CONTRIBUTION',
    entity_type: 'savings_goal',
    entity_id: goal.id,
    metadata: { amount_cents: amountCents, total_current_cents: goal.current_cents },
    created_at: new Date().toISOString(),
    actor,
  });

  saveDemoState(state);
  return goal;
}
