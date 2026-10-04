import {
  UserProfile,
  Crew,
  CrewMember,
  Budget,
  Expense,
  SavingsGoal,
  AuditLog,
} from '@/types/domain';
import { SolanaAnchor } from '@/types/v2';

export const DEMO_USERS: Record<string, UserProfile> = {
  alex: {
    id: 'user-alex-001',
    display_name: 'Alex Chen (Owner)',
    email: 'alex@crewcash.local',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-09-01T12:00:00Z',
  },
  jordan: {
    id: 'user-jordan-002',
    display_name: 'Jordan Rivera (Treasurer)',
    email: 'jordan@crewcash.local',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-09-01T12:00:00Z',
  },
  sam: {
    id: 'user-sam-003',
    display_name: 'Sam Patel (Member)',
    email: 'sam@crewcash.local',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-09-02T14:00:00Z',
  },
  taylor: {
    id: 'user-taylor-004',
    display_name: 'Taylor Kim (Member)',
    email: 'taylor@crewcash.local',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-09-03T09:30:00Z',
  },
};

export const DEMO_CREW: Crew = {
  id: 'crew-roadrunner-001',
  name: 'Roadrunner House',
  description: 'Shared Vault for RowdyHacks Team & Campus Apartment 404',
  invite_code: 'VAULT-RRH2026',
  created_by: DEMO_USERS.alex.id,
  created_at: '2026-09-01T12:00:00Z',
};

export const DEMO_MEMBERS: CrewMember[] = [
  {
    crew_id: DEMO_CREW.id,
    user_id: DEMO_USERS.alex.id,
    role: 'owner',
    joined_at: '2026-09-01T12:00:00Z',
    profile: DEMO_USERS.alex,
  },
  {
    crew_id: DEMO_CREW.id,
    user_id: DEMO_USERS.jordan.id,
    role: 'treasurer',
    joined_at: '2026-09-01T12:05:00Z',
    profile: DEMO_USERS.jordan,
  },
  {
    crew_id: DEMO_CREW.id,
    user_id: DEMO_USERS.sam.id,
    role: 'member',
    joined_at: '2026-09-02T14:00:00Z',
    profile: DEMO_USERS.sam,
  },
  {
    crew_id: DEMO_CREW.id,
    user_id: DEMO_USERS.taylor.id,
    role: 'member',
    joined_at: '2026-09-03T09:30:00Z',
    profile: DEMO_USERS.taylor,
  },
];

export const DEMO_BUDGET: Budget = {
  id: 'budget-roadrunner-current',
  crew_id: DEMO_CREW.id,
  month: '2026-10-01',
  amount_cents: 240000, // $2,400.00
  approval_threshold_cents: 15000, // $150.00
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    crew_id: DEMO_CREW.id,
    created_by: DEMO_USERS.alex.id,
    title: 'Apartment Monthly Rent & Parking',
    merchant: 'The Block Student Living',
    description: 'October core shared rent lease',
    amount_cents: 140000, // $1,400.00
    category: 'housing',
    expense_date: '2026-10-01',
    status: 'approved',
    approval_required: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    creator: DEMO_USERS.alex,
    splits: [
      { id: 's-1', expense_id: 'exp-001', user_id: DEMO_USERS.alex.id, amount_cents: 35000, profile: DEMO_USERS.alex },
      { id: 's-2', expense_id: 'exp-001', user_id: DEMO_USERS.jordan.id, amount_cents: 35000, profile: DEMO_USERS.jordan },
      { id: 's-3', expense_id: 'exp-001', user_id: DEMO_USERS.sam.id, amount_cents: 35000, profile: DEMO_USERS.sam },
      { id: 's-4', expense_id: 'exp-001', user_id: DEMO_USERS.taylor.id, amount_cents: 35000, profile: DEMO_USERS.taylor },
    ],
    approvals: [
      { id: 'a-1', expense_id: 'exp-001', user_id: DEMO_USERS.jordan.id, decision: 'approved', decided_at: '2026-10-01T08:30:00Z', profile: DEMO_USERS.jordan },
      { id: 'a-2', expense_id: 'exp-001', user_id: DEMO_USERS.sam.id, decision: 'approved', decided_at: '2026-10-01T08:45:00Z', profile: DEMO_USERS.sam },
    ],
  },
  {
    id: 'exp-002',
    crew_id: DEMO_CREW.id,
    created_by: DEMO_USERS.jordan.id,
    title: 'Gigabit Fiber Internet & WiFi',
    merchant: 'AT&T Fiber',
    description: 'Shared 1Gbps internet service',
    amount_cents: 8000, // $80.00
    category: 'utilities',
    expense_date: '2026-10-02',
    status: 'approved',
    approval_required: false,
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
    creator: DEMO_USERS.jordan,
    splits: [
      { id: 's-5', expense_id: 'exp-002', user_id: DEMO_USERS.alex.id, amount_cents: 2000, profile: DEMO_USERS.alex },
      { id: 's-6', expense_id: 'exp-002', user_id: DEMO_USERS.jordan.id, amount_cents: 2000, profile: DEMO_USERS.jordan },
      { id: 's-7', expense_id: 'exp-002', user_id: DEMO_USERS.sam.id, amount_cents: 2000, profile: DEMO_USERS.sam },
      { id: 's-8', expense_id: 'exp-002', user_id: DEMO_USERS.taylor.id, amount_cents: 2000, profile: DEMO_USERS.taylor },
    ],
  },
  {
    id: 'exp-003',
    crew_id: DEMO_CREW.id,
    created_by: DEMO_USERS.sam.id,
    title: 'Whole Foods Fresh Groceries Restock',
    merchant: 'Whole Foods Market',
    description: 'Produce, dairy, and breakfast supplies',
    amount_cents: 12840, // $128.40
    category: 'groceries',
    expense_date: '2026-10-02',
    status: 'approved',
    approval_required: false,
    created_at: '2026-10-02T15:30:00Z',
    updated_at: '2026-10-02T15:30:00Z',
    creator: DEMO_USERS.sam,
    splits: [
      { id: 's-9', expense_id: 'exp-003', user_id: DEMO_USERS.alex.id, amount_cents: 3210, profile: DEMO_USERS.alex },
      { id: 's-10', expense_id: 'exp-003', user_id: DEMO_USERS.jordan.id, amount_cents: 3210, profile: DEMO_USERS.jordan },
      { id: 's-11', expense_id: 'exp-003', user_id: DEMO_USERS.sam.id, amount_cents: 3210, profile: DEMO_USERS.sam },
      { id: 's-12', expense_id: 'exp-003', user_id: DEMO_USERS.taylor.id, amount_cents: 3210, profile: DEMO_USERS.taylor },
    ],
  },
  {
    id: 'exp-004',
    crew_id: DEMO_CREW.id,
    created_by: DEMO_USERS.taylor.id,
    title: 'Sprint Planning Pizza & Wings',
    merchant: "Via 313 Pizzeria",
    description: 'Team dinner during RowdyHacks prep',
    amount_cents: 4560, // $45.60
    category: 'dining',
    expense_date: '2026-10-03',
    status: 'approved',
    approval_required: false,
    created_at: '2026-10-03T11:00:00Z',
    updated_at: '2026-10-03T11:00:00Z',
    creator: DEMO_USERS.taylor,
    splits: [
      { id: 's-13', expense_id: 'exp-004', user_id: DEMO_USERS.alex.id, amount_cents: 1140, profile: DEMO_USERS.alex },
      { id: 's-14', expense_id: 'exp-004', user_id: DEMO_USERS.jordan.id, amount_cents: 1140, profile: DEMO_USERS.jordan },
      { id: 's-15', expense_id: 'exp-004', user_id: DEMO_USERS.sam.id, amount_cents: 1140, profile: DEMO_USERS.sam },
      { id: 's-16', expense_id: 'exp-004', user_id: DEMO_USERS.taylor.id, amount_cents: 1140, profile: DEMO_USERS.taylor },
    ],
  },
  {
    id: 'exp-005',
    crew_id: DEMO_CREW.id,
    created_by: DEMO_USERS.taylor.id,
    title: 'Costco Bulk Pantry & Kitchen Restock',
    merchant: 'Costco Wholesale',
    description: 'Bulk paper towels, energy drinks, snacks, and dish pods for apartment',
    amount_cents: 24850, // $248.50 >= threshold $150.00
    category: 'groceries',
    expense_date: '2026-10-03',
    status: 'pending',
    approval_required: true,
    created_at: '2026-10-03T14:15:00Z',
    updated_at: '2026-10-03T14:20:00Z',
    creator: DEMO_USERS.taylor,
    splits: [
      { id: 's-17', expense_id: 'exp-005', user_id: DEMO_USERS.alex.id, amount_cents: 6213, profile: DEMO_USERS.alex },
      { id: 's-18', expense_id: 'exp-005', user_id: DEMO_USERS.jordan.id, amount_cents: 6213, profile: DEMO_USERS.jordan },
      { id: 's-19', expense_id: 'exp-005', user_id: DEMO_USERS.sam.id, amount_cents: 6212, profile: DEMO_USERS.sam },
      { id: 's-20', expense_id: 'exp-005', user_id: DEMO_USERS.taylor.id, amount_cents: 6212, profile: DEMO_USERS.taylor },
    ],
    approvals: [
      {
        id: 'a-3',
        expense_id: 'exp-005',
        user_id: DEMO_USERS.jordan.id,
        decision: 'approved',
        decided_at: '2026-10-03T14:20:00Z',
        profile: DEMO_USERS.jordan,
      },
    ],
  },
  {
    id: 'exp-006',
    crew_id: DEMO_CREW.id,
    created_by: DEMO_USERS.sam.id,
    title: 'Shared Living Room 4K Monitor',
    merchant: 'Best Buy',
    description: 'Secondary display for group code reviews & gaming',
    amount_cents: 18999, // $189.99 >= threshold $150.00
    category: 'entertainment',
    expense_date: '2026-10-03',
    status: 'pending',
    approval_required: true,
    created_at: '2026-10-03T15:00:00Z',
    updated_at: '2026-10-03T15:00:00Z',
    creator: DEMO_USERS.sam,
    splits: [
      { id: 's-21', expense_id: 'exp-006', user_id: DEMO_USERS.alex.id, amount_cents: 4750, profile: DEMO_USERS.alex },
      { id: 's-22', expense_id: 'exp-006', user_id: DEMO_USERS.jordan.id, amount_cents: 4750, profile: DEMO_USERS.jordan },
      { id: 's-23', expense_id: 'exp-006', user_id: DEMO_USERS.sam.id, amount_cents: 4750, profile: DEMO_USERS.sam },
      { id: 's-24', expense_id: 'exp-006', user_id: DEMO_USERS.taylor.id, amount_cents: 4749, profile: DEMO_USERS.taylor },
    ],
    approvals: [],
  },
];

export const DEMO_GOALS: SavingsGoal[] = [
  {
    id: 'goal-001',
    crew_id: DEMO_CREW.id,
    title: 'RowdyHacks Project Hardware & Travel',
    target_cents: 60000, // $600.00
    current_cents: 45000, // $450.00 (75%)
    due_date: '2026-11-15',
    created_at: '2026-09-15T00:00:00Z',
  },
  {
    id: 'goal-002',
    crew_id: DEMO_CREW.id,
    title: 'Espresso Machine Upgrade',
    target_cents: 35000, // $350.00
    current_cents: 14000, // $140.00 (40%)
    due_date: '2026-12-01',
    created_at: '2026-10-01T00:00:00Z',
  },
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    crew_id: DEMO_CREW.id,
    actor_user_id: DEMO_USERS.alex.id,
    action: 'CREW_CREATED',
    entity_type: 'crew',
    entity_id: DEMO_CREW.id,
    metadata: { name: DEMO_CREW.name, invite_code: DEMO_CREW.invite_code },
    created_at: '2026-09-01T12:00:00Z',
    actor: DEMO_USERS.alex,
  },
  {
    id: 'log-002',
    crew_id: DEMO_CREW.id,
    actor_user_id: DEMO_USERS.alex.id,
    action: 'BUDGET_CONFIGURED',
    entity_type: 'budget',
    entity_id: DEMO_BUDGET.id,
    metadata: { amount_cents: 240000, threshold_cents: 15000 },
    created_at: '2026-10-01T00:00:00Z',
    actor: DEMO_USERS.alex,
  },
  {
    id: 'log-003',
    crew_id: DEMO_CREW.id,
    actor_user_id: DEMO_USERS.taylor.id,
    action: 'EXPENSE_REQUESTED',
    entity_type: 'expense',
    entity_id: 'exp-005',
    metadata: { title: 'Costco Bulk Pantry Restock', amount_cents: 24850, status: 'pending' },
    created_at: '2026-10-03T14:15:00Z',
    actor: DEMO_USERS.taylor,
  },
  {
    id: 'log-004',
    crew_id: DEMO_CREW.id,
    actor_user_id: DEMO_USERS.jordan.id,
    action: 'EXPENSE_APPROVED',
    entity_type: 'expense',
    entity_id: 'exp-005',
    metadata: { approvals_count: 1, required: 2 },
    created_at: '2026-10-03T14:20:00Z',
    actor: DEMO_USERS.jordan,
  },
];

export const DEMO_SOLANA_ANCHORS: SolanaAnchor[] = [
  {
    expenseId: 'exp-001',
    digest: '4cb2f0e6e00d50dd94020d7fa946cb533668548dadbfcba87bdb140782649339',
    signature: '518cgczV5izWSuuRx4T9MJ5YjsyPyBEZEueJUxc4j5t7QoWnXZUaFnUyWz1hjA9KjT2BX5iH6S7Q8NLVnhNNe4XJ',
    network: 'devnet',
    anchoredAt: '2026-10-04T13:13:54.906Z',
  },
];
