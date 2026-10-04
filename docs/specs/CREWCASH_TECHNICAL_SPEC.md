# CrewCash — Complete Technical Specification

## 1. Product Summary

**CrewCash** is a collaborative financial-management web app for students, roommates, student organizations, nonprofits, and other small groups that need a simple way to manage shared budgets.

The app does **not move real money** in the hackathon version. It tracks budgets, expenses, splits, approvals, receipts, goals, and financial insights.

### Primary hackathon goals

CrewCash should feel like a real product while remaining achievable in a 24-hour hackathon.

The core demo must allow a judge to:

1. Sign in.
2. Create or join a Crew.
3. Set a monthly budget.
4. Add an expense.
5. Split the expense among members.
6. Require approval for a large expense.
7. Approve/reject the expense.
8. See the dashboard update.
9. Upload a receipt and extract expense information.
10. See a financial-health score and smart warning.

### Recommended challenge positioning

The same project can naturally support:
- Beginner Track
- Swivel
- Investment Society
- Best Design
- Best Heist Theme
- Cybersecurity-related challenge if the security/audit features are substantial

---

# 2. Scope

## 2.1 Must-have MVP

These features must work before adding anything optional:

- Email/password authentication
- User profile
- Create Crew
- Invite/join Crew by code
- Crew roles
- Monthly budget
- Expense creation
- Expense categories
- Split expense equally
- Approval workflow
- Transaction/expense list
- Dashboard totals
- Spending chart
- Basic financial-health score
- Audit log
- Responsive UI
- Seed/demo data

## 2.2 Intermediate features

Add after MVP is stable:

- Custom expense splits
- Receipt image upload
- AI/vision receipt extraction
- Smart-spend warning
- Unusual transaction detection
- Savings goals
- AI explanation of spending
- Recurring expense detection
- Notifications inside the app
- CSV export

## 2.3 Stretch features

Only build these if the rest is finished:

- Google sign-in
- Push/email notifications
- Multi-currency support
- Budget templates
- OCR confidence review UI
- PWA installability
- Offline mode
- Gamification
- QR invite/join
- Transaction attachments
- Accessibility audit
- Demo analytics
- Admin demo panel

---

# 3. Recommended Technology Stack

## Frontend + Backend

Use one full-stack application to reduce integration risk.

- **Next.js** with App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** or another lightweight component library
- **Recharts** for graphs
- **Zod** for validation

## Database + Authentication + Storage

Use **Supabase**:

- Postgres database
- Supabase Auth
- Row-Level Security
- Supabase Storage for receipt images
- Optional realtime subscriptions

## AI

Use a provider adapter so the app does not depend on one model vendor.

Required AI jobs:
- Receipt extraction from image
- Spending explanation
- Budget-rescue suggestions

Recommended design:
- Server-only AI calls
- Strict JSON output
- Schema validation with Zod
- Deterministic fallback rules if AI fails

## Deployment

Recommended:
- Vercel for Next.js
- Supabase hosted project for DB/Auth/Storage

---

# 4. High-Level Architecture

```text
Browser
  |
  v
Next.js UI
  |
  +------------------------+
  |                        |
  v                        v
Server Actions / API     Supabase Auth
Routes
  |
  +------------------------+
  |                        |
  v                        v
Supabase Postgres       Supabase Storage
  |
  v
AI Provider Adapter
  |
  +--> Receipt extraction
  +--> Spending explanation
  +--> Budget suggestions
```

### Architecture rules

1. Never expose AI API keys in the browser.
2. Never trust `crew_id`, role, amount, or user ID sent by the browser.
3. Validate every write on the server.
4. Use database policies so users can access only Crews they belong to.
5. Keep demo-critical calculations available without AI.

---

# 5. Repository Structure

```text
crewcash/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── crew/
│   │   │   ├── [crewId]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── expenses/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── approvals/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── members/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── goals/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   ├── receipts/
│   │   │   └── extract/
│   │   │       └── route.ts
│   │   ├── insights/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── dashboard/
│   ├── expenses/
│   ├── approvals/
│   ├── charts/
│   ├── crew/
│   ├── ui/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── receipt.ts
│   │   ├── insights.ts
│   │   └── prompts.ts
│   ├── finance/
│   │   ├── health-score.ts
│   │   ├── anomalies.ts
│   │   ├── splits.ts
│   │   └── budget.ts
│   ├── auth/
│   ├── permissions/
│   ├── validation/
│   └── utils.ts
│
├── actions/
│   ├── crews.ts
│   ├── expenses.ts
│   ├── approvals.ts
│   ├── members.ts
│   └── goals.ts
│
├── types/
│   ├── database.ts
│   └── domain.ts
│
├── supabase/
│   ├── schema.sql
│   └── seed.sql
│
├── public/
├── middleware.ts
├── .env.example
├── README.md
└── AI_BUILD_INSTRUCTIONS.md
```

---

# 6. Domain Model

## User

```ts
type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
};
```

## Crew

```ts
type Crew = {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
};
```

## Crew Member

Roles:

- owner
- treasurer
- member

Permissions:

| Capability | Owner | Treasurer | Member |
|---|---:|---:|---:|
| View crew | Yes | Yes | Yes |
| Add expense | Yes | Yes | Yes |
| Approve expense | Yes | Yes | Yes |
| Set budget | Yes | Yes | No |
| Invite member | Yes | Yes | No |
| Change roles | Yes | No | No |
| Delete crew | Yes | No | No |

## Budget

One budget per Crew per month.

```ts
type Budget = {
  id: string;
  crewId: string;
  month: string; // YYYY-MM-01
  amountCents: number;
  approvalThresholdCents: number;
  createdAt: string;
};
```

## Expense

```ts
type ExpenseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

type Expense = {
  id: string;
  crewId: string;
  createdBy: string;
  title: string;
  merchant?: string;
  description?: string;
  amountCents: number;
  category: ExpenseCategory;
  expenseDate: string;
  status: ExpenseStatus;
  receiptPath?: string;
  approvalRequired: boolean;
  createdAt: string;
};
```

## Expense Categories

Use a fixed list for the hackathon:

- housing
- groceries
- dining
- transportation
- utilities
- education
- healthcare
- entertainment
- shopping
- other

## Expense Split

```ts
type ExpenseSplit = {
  id: string;
  expenseId: string;
  userId: string;
  amountCents: number;
};
```

## Approval

```ts
type Approval = {
  id: string;
  expenseId: string;
  userId: string;
  decision: "approved" | "rejected";
  decidedAt: string;
};
```

## Goal

```ts
type SavingsGoal = {
  id: string;
  crewId: string;
  title: string;
  targetCents: number;
  currentCents: number;
  dueDate?: string;
};
```

## Audit Log

```ts
type AuditAction =
  | "crew.created"
  | "crew.member_joined"
  | "budget.created"
  | "budget.updated"
  | "expense.created"
  | "expense.updated"
  | "expense.approved"
  | "expense.rejected"
  | "receipt.extracted"
  | "role.updated";

type AuditLog = {
  id: string;
  crewId: string;
  actorUserId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
```

---

# 7. Database Tables

Recommended tables:

1. `profiles`
2. `crews`
3. `crew_members`
4. `budgets`
5. `expenses`
6. `expense_splits`
7. `expense_approvals`
8. `savings_goals`
9. `audit_logs`
10. `notifications`

Use UUID primary keys.

Store money as integer cents.

Never store money as floating point.

Example:

```text
$42.57 = 4257 cents
```

---

# 8. Database Constraints

Important constraints:

- A user can belong to a Crew only once.
- A Crew can have only one budget per month.
- Expense amount must be greater than 0.
- Split totals must equal expense total.
- One user may cast only one approval decision per expense.
- Only Crew members can read Crew data.
- Only owners/treasurers can edit budgets.
- Only owners can change roles.
- An approved/rejected expense cannot be silently changed back to pending without a logged action.

---

# 9. Authentication Flow

## Sign-up

1. User enters email/password.
2. Supabase creates auth user.
3. Database trigger or server action creates `profiles` record.
4. Redirect to onboarding.

## Onboarding

User chooses:

- Create a Crew
- Join with invite code

## Session handling

- Use secure HTTP-only authentication cookies.
- Protect dashboard routes through middleware.
- Server components should verify the active user.
- Never accept a client-provided user ID as authoritative.

---

# 10. Crew Invite Flow

## Create Crew

Input:
- Crew name
- Optional description

Server:
1. Validate user.
2. Create Crew.
3. Generate invite code.
4. Add creator as owner.
5. Add audit event.

Invite code format:

```text
VAULT-7K4P2A
```

## Join Crew

1. User enters invite code.
2. Server finds active Crew.
3. Server checks if already a member.
4. Add member role.
5. Log action.
6. Redirect to Crew dashboard.

---

# 11. Expense Workflow

## Add Expense Form

Fields:

- Title
- Amount
- Date
- Category
- Merchant
- Description
- Split method
- Receipt
- Optional custom split

## Approval logic

A simple, visible rule:

```text
If expense.amount >= crew.approvalThreshold
    approvalRequired = true
Else
    approvalRequired = false
```

If no approval is required:

```text
status = approved
```

If approval is required:

```text
status = pending
```

## Approval rule

Recommended hackathon rule:

- Any expense above threshold requires **2 approvals**
- Creator cannot provide both approvals
- One rejection keeps it pending until owner resolves, OR use rejection = rejected for simpler behavior

For the hackathon, use:

```text
2 approvals => approved
1 rejection => rejected
```

This makes the demo easy to explain.

---

# 12. Expense Splitting

## Equal split

Use integer cents.

Example:

```text
Expense = 1001 cents
Members = 3

Base = floor(1001 / 3) = 333
Remainder = 2

Splits:
334
334
333
```

Never lose cents.

## Custom split

Validate:

```text
sum(split.amountCents) === expense.amountCents
```

Reject invalid totals.

---

# 13. Dashboard Calculations

Show:

- Monthly budget
- Approved spending
- Remaining budget
- Pending spending
- Budget percentage used
- Spending by category
- Recent expenses
- Pending approvals
- Financial-health score
- Savings goals
- Unusual spending alert

## Monthly spending

Only count **approved** expenses in actual spending.

```ts
approvedSpending =
  sum(expenses where status === "approved")
```

## Remaining budget

```ts
remaining = budget - approvedSpending
```

## Budget utilization

```ts
utilization =
  approvedSpending / budget
```

Handle zero budget safely.

---

# 14. Financial Health Score

Do not use AI for the numeric score.

Use deterministic rules so the score remains stable during judging.

Start from 100.

## Suggested deductions

### Budget utilization

```text
0–70% used    => 0 deduction
70–85%        => -5
85–100%       => -15
>100%         => -30
```

### Large discretionary spending

If dining + entertainment + shopping > 35% of total:

```text
-10
```

### Unusual transactions

```text
Each active anomaly:
-5
Maximum:
-15
```

### Savings goal progress

If there is an active goal:

```text
on track       => +5
significantly behind => -5
```

Clamp:

```text
0 <= score <= 100
```

Labels:

```text
90–100 Excellent
75–89  Healthy
60–74  Watch
40–59  At Risk
0–39   Critical
```

For the actual product UI, avoid shaming language. Suggested labels:

```text
90–100 Strong
75–89  Healthy
60–74  Needs Attention
0–59   Action Recommended
```

---

# 15. Smart Spend Warning

This feature should work without AI.

Given a proposed expense:

Calculate:

```text
remainingBefore =
    monthlyBudget - currentApprovedSpending

remainingAfter =
    remainingBefore - proposedExpense

shareOfRemaining =
    proposedExpense / remainingBefore
```

Rules:

```text
If remainingAfter < 0:
    severity = critical

Else if shareOfRemaining >= 0.50:
    severity = high

Else if shareOfRemaining >= 0.25:
    severity = medium

Else:
    severity = low
```

Example:

```text
Remaining budget: $800
Proposed purchase: $400

Share of remaining budget: 50%

Warning:
"This purchase would use 50% of your remaining monthly budget."
```

---

# 16. Anomaly Detection

Do not claim that the hackathon version detects fraud.

Call it:

- unusual spending
- spending anomaly
- unusual transaction

## Simple category-based anomaly algorithm

For the same Crew and category:

1. Fetch up to 30 previous approved expenses.
2. Require at least 4 historical expenses.
3. Calculate average and standard deviation.
4. Flag if:

```text
newAmount > mean + 2 * standardDeviation
```

Fallback rule if the history is too small:

```text
newAmount >= 3 * categoryAverage
```

Also flag:

```text
newAmount >= 40% of remaining monthly budget
```

Show the reason.

Example:

```text
Unusual Spending

This dining expense is $147.
Your recent dining average is $31.
```

---

# 17. Receipt Upload

## Upload flow

1. User selects photo.
2. Client validates file type and rough size.
3. Upload to private Supabase Storage bucket.
4. Call server endpoint with storage path.
5. Server obtains image securely.
6. Send image to AI vision provider.
7. Validate returned JSON.
8. Show editable preview.
9. User confirms.
10. Create expense.
11. Log receipt extraction.

## Allowed types

- JPEG
- PNG
- WebP

Recommended maximum:
- 5 MB

## Storage policy

Receipts should be private.

Users may read receipt images only if they are members of the associated Crew.

---

# 18. Receipt AI Output Schema

The AI must return only structured data.

Expected object:

```json
{
  "merchant": "H-E-B",
  "date": "2026-10-03",
  "subtotal_cents": 2850,
  "tax_cents": 235,
  "total_cents": 3085,
  "currency": "USD",
  "category": "groceries",
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "amount_cents": 429
    }
  ],
  "confidence": 0.92
}
```

Never automatically create a final expense from AI output.

The user must review and confirm.

---

# 19. In-App AI Insights

AI should explain data that CrewCash already calculated.

AI must not:
- invent transactions
- claim guaranteed savings
- provide investment advice
- provide tax advice
- make legal claims
- imply fraud detection
- move money
- make decisions for the user

AI can:
- summarize spending
- explain budget pressure
- suggest categories to review
- explain a financial-health score
- offer simple budgeting alternatives

---

# 20. Budget Rescue

## Input

- Remaining funds
- Days until next refill/payday
- Expected recurring expenses
- Recent category spending

## Deterministic calculation

```text
projectedShortage =
    expectedExpenses - remainingFunds
```

If positive:

```text
shortage exists
```

Create reduction candidates from discretionary categories:

- dining
- entertainment
- shopping

Then AI may turn those numbers into a friendly explanation.

Example:

```text
Remaining: $220
Expected expenses: $230
Shortage: $10

Suggested adjustment:
Entertainment: reduce planned spending by at least $10.
```

---

# 21. API / Server Actions

Prefer server actions for ordinary application writes.

Use API routes for:
- AI
- receipt extraction
- export

## Required actions

### `createCrew`

Input:

```ts
{
  name: string;
  description?: string;
}
```

### `joinCrew`

```ts
{
  inviteCode: string;
}
```

### `setBudget`

```ts
{
  crewId: string;
  month: string;
  amountCents: number;
  approvalThresholdCents: number;
}
```

### `createExpense`

```ts
{
  crewId: string;
  title: string;
  merchant?: string;
  amountCents: number;
  category: ExpenseCategory;
  expenseDate: string;
  splits: Array<{
    userId: string;
    amountCents: number;
  }>;
  receiptPath?: string;
}
```

### `decideExpense`

```ts
{
  expenseId: string;
  decision: "approved" | "rejected";
}
```

### `createSavingsGoal`

```ts
{
  crewId: string;
  title: string;
  targetCents: number;
  dueDate?: string;
}
```

---

# 22. Validation

Use Zod on every server write.

Examples:

```ts
const MoneySchema = z
  .number()
  .int()
  .positive()
  .max(100_000_000);
```

Validate:

- IDs are UUIDs
- amounts are positive
- category is allowed
- date is valid
- user is authenticated
- user belongs to Crew
- user has permission
- split total matches expense total
- uploaded file type is allowed
- uploaded file size is allowed

---

# 23. Authorization

Create central permission helpers.

Example:

```ts
canManageBudget(role)
canInviteMembers(role)
canChangeRoles(role)
canViewCrew(role)
canApproveExpense(role)
```

Do not scatter role checks across random UI components.

UI permissions are for convenience.

Database/server permissions are the real security boundary.

---

# 24. Supabase Row-Level Security

Enable RLS on all user/crew tables.

Principle:

```text
A user may view Crew data only if a crew_members row exists:
crew_members.user_id = auth.uid()
AND crew_members.crew_id = target.crew_id
```

Do not rely solely on front-end filtering.

---

# 25. Audit Logging

Every important mutation should create an audit entry.

Examples:

```text
Sujeeth created expense "$83 groceries"
Alex approved expense
Jordan rejected expense
Owner changed monthly budget from $1,500 to $1,700
Receipt extraction completed
```

Never put secrets or full AI prompts in audit metadata.

---

# 26. Notifications

Hackathon version can use in-app notifications.

Examples:

- Expense needs approval
- Expense approved
- Expense rejected
- Budget over 80%
- New Crew member joined
- Savings goal reached
- Unusual spending detected

Database table:

```text
notifications
- id
- user_id
- crew_id
- type
- title
- body
- read_at
- created_at
```

---

# 27. UI Pages

## Landing Page

Sections:

1. Hero
2. Product value
3. Feature cards
4. Social-impact explanation
5. CTA

Suggested hero:

```text
Manage money together,
without the money drama.

Shared budgets, approvals,
receipts, and smart insights
for your Crew.
```

## Dashboard

Top cards:

- Vault Balance / Remaining Budget
- Budget Used
- Financial Health
- Pending Approvals

Below:

- Spending chart
- Category breakdown
- Recent expenses
- Unusual-spending warning
- Savings goal

## Expense Page

Table/list:

- Date
- Merchant
- Title
- Category
- Amount
- Creator
- Status

## Add Expense

Use a step or card flow:

1. Details
2. Split
3. Receipt
4. Review

## Approvals

Card:

```text
MacBook Accessories
$286.40

Submitted by Alex
Category: Shopping

This uses 37% of the Crew's
remaining monthly budget.

[Reject] [Approve]
```

## Members

Show:

- Name
- Role
- Amount owed / share
- Join date

## Analytics

Show:

- Monthly spending
- Category chart
- Trend
- Top categories
- Health explanation

---

# 28. UX / Design System

## Theme

Use "heist" flavor without making the product look unserious.

Vocabulary:

```text
Crew        = shared group
Vault       = monthly budget
Mission     = savings goal
Intel       = analytics
Security    = audit/security area
```

Avoid overusing gimmicks.

## Design principles

- Large readable numbers
- Strong hierarchy
- Minimal navigation
- Clear status chips
- Mobile friendly
- No horizontal scrolling
- Accessible form labels
- Good keyboard focus states
- Do not use color alone to convey status

---

# 29. Error States

Every asynchronous action needs:

- loading state
- success state
- failure state

Examples:

```text
Receipt extraction failed.
You can enter the values manually.
```

```text
AI insight is unavailable.
Your budget calculations are still available.
```

Critical rule:

**AI failure must never break the demo.**

---

# 30. AI Fallback Strategy

For every AI feature, implement a deterministic fallback.

## Receipt extraction

Fallback:
- manual form

## Spending explanation

Fallback:
- template generated from calculations

Example:

```text
Your Crew has used 78% of this month's budget.
Dining and entertainment are the largest discretionary categories.
```

## Budget rescue

Fallback:
- calculate shortage and suggest reducing largest discretionary category

---

# 31. Security Checklist

Minimum hackathon security:

- [ ] API keys server-only
- [ ] Supabase service key never exposed
- [ ] RLS enabled
- [ ] Server-side authorization
- [ ] Private receipt bucket
- [ ] Input validation
- [ ] File type validation
- [ ] File size validation
- [ ] Safe error messages
- [ ] No plaintext passwords
- [ ] No secrets in Git
- [ ] `.env.local` ignored
- [ ] Rate-limit AI endpoints if practical
- [ ] Do not render raw AI HTML
- [ ] Do not trust AI output
- [ ] Audit critical actions

---

# 32. Privacy

The project should collect as little information as possible.

Do not ask for:
- bank credentials
- Social Security numbers
- card numbers
- routing numbers
- financial-account passwords

Do not connect real bank accounts for the hackathon.

Suggested product note:

```text
CrewCash is a budgeting and coordination prototype.
It does not hold or transfer funds.
```

---

# 33. Testing Strategy

## Unit tests

Test:

- equal split
- remainder cents
- health score
- anomaly detection
- smart-spend severity
- permission helpers
- validation

Example:

```text
Expense:
$10.00

Members:
3

Expected:
$3.34
$3.33
$3.33
```

## Integration tests

Test:

1. User creates Crew.
2. Budget created.
3. Member joins.
4. Expense added.
5. Expense requires approval.
6. Two members approve.
7. Dashboard spending changes.

## Manual demo test

Run the exact demo from a fresh browser before judging.

---

# 34. Demo Seed Data

Create a demo Crew:

```text
Crew:
Roadrunner House

Monthly Budget:
$2,500

Approval Threshold:
$200

Members:
Sujeeth — Owner
Alex — Treasurer
Jordan — Member
Maya — Member
```

Seed expenses:

```text
Rent       $1,200
Groceries    $184
Internet      $65
Dining        $72
Gas           $54
```

Pending:

```text
Electronics
$350
```

Savings goal:

```text
Emergency Fund
$500 / $1,000
```

This makes the application look active immediately.

---

# 35. Recommended Live Demo Script

Keep the live portion around 90 seconds.

## Step 1 — Problem

```text
"Roommates and student organizations often share expenses,
but budgeting, approvals, and accountability are scattered
across chats, spreadsheets, and payment apps."
```

## Step 2 — Dashboard

Show:
- budget
- spending
- health score

## Step 3 — Receipt

Upload a prepared receipt.

Show:
- merchant extracted
- total extracted
- category detected

Confirm it.

## Step 4 — Approval

Create a large expense.

Show smart warning:

```text
This purchase would consume 48%
of your remaining monthly budget.
```

Submit.

Switch demo user or use another session.

Approve.

## Step 5 — Updated dashboard

Return to dashboard.

Show:
- transaction
- updated balance
- audit history

## Step 6 — Impact

```text
"CrewCash helps students and small organizations
make shared financial decisions transparently,
without requiring access to their bank accounts."
```

---

# 36. Hackathon Build Order

## Phase 0 — Setup

- Create repo
- Create Supabase project
- Create Vercel project
- Add env vars
- Add UI library

## Phase 1 — Authentication

- Signup
- Login
- Logout
- Protected pages

## Phase 2 — Crew

- Create Crew
- Join Crew
- Member roles

## Phase 3 — Budget

- Set monthly budget
- Dashboard card

## Phase 4 — Expenses

- Add expense
- Expense list
- Equal split
- Categories

## Phase 5 — Approvals

- Approval threshold
- Pending state
- Approve/reject

## Phase 6 — Dashboard

- Remaining budget
- Chart
- Recent activity

## Phase 7 — Smart features

- Health score
- Smart spend warning
- Anomaly detection

## Phase 8 — AI

- Receipt extraction
- AI explanation

## Phase 9 — Polish

- Empty states
- Loading states
- Responsive design
- Demo seed data
- Pitch rehearsal

---

# 37. Team Split

For four people:

## Person 1 — Frontend / Design

Own:
- layout
- dashboard
- charts
- design system
- responsive UI

## Person 2 — Database / Auth

Own:
- Supabase schema
- RLS
- authentication
- Crew membership
- invite code

## Person 3 — Finance Logic

Own:
- expenses
- splits
- approvals
- health score
- anomaly rules

## Person 4 — AI / Integration / Demo

Own:
- receipt extraction
- AI summaries
- storage
- test data
- presentation/demo

Everyone helps integration.

---

# 38. Definition of Done

The project is submission-ready only if:

- [ ] Judge can create/login to account
- [ ] Crew can be created
- [ ] Member can join
- [ ] Budget can be set
- [ ] Expense can be entered
- [ ] Splits are correct
- [ ] Approval workflow works
- [ ] Dashboard updates correctly
- [ ] At least one chart renders
- [ ] Health score is deterministic
- [ ] Receipt can be uploaded OR manual fallback is obvious
- [ ] AI failure does not break the app
- [ ] App works on deployed URL
- [ ] Demo account/data exists
- [ ] Team has practiced the demo
- [ ] README explains project and architecture

---

# 39. Do Not Build During the Hackathon

Avoid these unless everything else is done:

- Real bank connections
- Real money movement
- Cryptocurrency
- Complex machine-learning training
- Custom neural networks
- Native mobile app
- Multiple backend services
- Microservices
- Kubernetes
- Complex event streaming
- Custom authentication system
- Fine-tuning a model
- Full accounting/bookkeeping
- Tax calculations

These increase risk without improving the judging demo enough.

---

# 40. Final Product Statement

**CrewCash is a collaborative budgeting and financial-coordination platform for students and small organizations. It combines shared budgets, expense splitting, approval workflows, receipt capture, spending analytics, unusual-spending detection, and AI-generated explanations while keeping users in control of every financial decision.**
