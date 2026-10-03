# CrewCash V2 — API & Service Contracts

This file defines the intended server-side interfaces.

---

# 1. General Response Shape

Successful:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};
```

Failure:

```ts
type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};
```

Never return stack traces to browser clients.

---

# 2. Authentication Context

```ts
type AuthContext = {
  userId: string;
};
```

User ID is resolved server-side.

Never accept an authoritative actor ID in mutation input.

---

# 3. Create Crew

```ts
createCrew(input: {
  name: string;
  description?: string;
}): Promise<{
  crewId: string;
  inviteCode: string;
}>
```

Side effects:
- Crew row
- owner membership
- event `crew.created`

---

# 4. Join Crew

```ts
joinCrew(input: {
  inviteCode: string;
}): Promise<{
  crewId: string;
}>
```

---

# 5. Set Budget

```ts
setCrewBudget(input: {
  crewId: string;
  month: string;
  amountCents: number;
}): Promise<void>
```

Authorization:
- owner / treasurer

---

# 6. Set Approval Policy

```ts
setApprovalPolicies(input: {
  crewId: string;
  policies: Array<{
    minCents: number;
    maxCents: number | null;
    requiredApprovals: number;
    requiredRoles: Array<"owner" | "treasurer" | "member">;
    autoApprove: boolean;
  }>;
}): Promise<void>
```

Validate:
- no overlapping ranges
- increasing ranges
- valid roles
- nonnegative values

---

# 7. Create Expense

```ts
createExpense(input: {
  crewId: string;
  title: string;
  merchant?: string;
  amountCents: number;
  category: string;
  expenseDate: string;
  splits: Array<{
    userId: string;
    amountCents: number;
  }>;
  receiptId?: string;
}): Promise<{
  expenseId: string;
  status: "approved" | "pending";
  policyEvaluation: PolicyEvaluation;
  anomaly: AnomalyResult;
}>
```

Transaction:
- expense
- splits
- policy evaluation
- event(s)

---

# 8. Decide Expense

```ts
decideExpense(input: {
  expenseId: string;
  decision: "approved" | "rejected";
}): Promise<{
  status: "pending" | "approved" | "rejected";
}>
```

Server:
- checks role requirements
- prevents duplicate vote
- transitions state
- appends event

---

# 9. Personal Finance Snapshot

```ts
savePersonalSnapshot(input: {
  monthIncomeCents: number;
  cashBalanceCents: number;
  emergencySavingsCents: number;
  revolvingBalanceCents?: number;
  revolvingLimitCents?: number;
  onTimePaymentPercent?: number;
  averageAccountAgeMonths?: number;
  hardInquiries?: number;
}): Promise<{
  financialHealth: ScoreResult;
  creditHealth?: ScoreResult;
  investmentReadiness: ScoreResult;
}>
```

---

# 10. Credit Simulation

```ts
simulateCredit(input: {
  simulatedBalanceCents: number;
}): Promise<{
  currentUtilization: number;
  simulatedUtilization: number;
  currentScore: ScoreResult;
  simulatedScore: ScoreResult;
}>
```

No persistence unless user explicitly saves scenario.

---

# 11. Portfolio Simulation

```ts
simulatePortfolio(input: {
  initialCents: number;
  monthlyContributionCents: number;
  horizonMonths: number;
  allocationsBps: Array<{
    assetClass: string;
    weightBps: number;
  }>;
  assumptions: {
    conservativeAnnualRate: number;
    baselineAnnualRate: number;
    highAnnualRate: number;
  };
}): Promise<{
  conservativeCents: number;
  baselineCents: number;
  highCents: number;
  totalContributionsCents: number;
}>
```

Validate:
- weights total 10000
- rates within safe demo bounds
- horizon reasonable

---

# 12. Portfolio Stress Test

```ts
runStressTest(input: {
  allocationsBps: Array<{
    assetClass: string;
    weightBps: number;
  }>;
  scenarioId: string;
}): Promise<{
  scenarioId: string;
  modeledChangePercent: number;
  contributions: Array<{
    assetClass: string;
    shockPercent: number;
    contributionPercent: number;
  }>;
}>
```

---

# 13. Receipt Extraction Route

```text
POST /api/ai/receipt
```

Input:
- multipart image or private receipt object ID

Server:
- auth
- file checks
- Gemini request
- schema validation
- arithmetic verification

Return:

```ts
{
  extraction: ReceiptExtraction;
  checks: ReceiptIntegrityChecks;
}
```

Does not create expense.

---

# 14. Coach Route

```text
POST /api/ai/coach
```

Input:

```json
{
  "mode": "personal",
  "message": "Why did my spending increase?",
  "crew_id": null
}
```

or:

```json
{
  "mode": "crew",
  "message": "Can we afford $650 for an event?",
  "crew_id": "..."
}
```

Server:
- auth
- mode access
- Gemini tool loop
- max rounds 4
- final answer

---

# 15. Tiger Data Query Services

Do not expose generic SQL.

Create functions:

```text
getDailySpend(scope)
getCategorySpend(scope, range)
getSpendingAcceleration(scope)
getBudgetForecast(crew)
getPersonalMonthlyTrend(user)
getMarketHistory(symbol, range)
```

---

# 16. Event Append Service

```ts
appendFinancialEvent(input: {
  scopeType: "personal" | "crew";
  scopeId: string;
  eventType: string;
  actorUserId?: string;
  amountCents?: number;
  category?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

Service sets event time server-side.

---

# 17. Solana Anchor Service

Optional:

```ts
anchorApproval(input: {
  approvalId: string;
}): Promise<{
  digest: string;
  signature: string;
  network: "devnet";
}>
```

Server loads approval data itself.

Never accept raw canonical approval body from browser.

---

# 18. Common Error Codes

```text
AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_FAILED
POLICY_VIOLATION
INVALID_STATE_TRANSITION
AI_UNAVAILABLE
AI_OUTPUT_INVALID
MARKET_DATA_UNAVAILABLE
DATABASE_ERROR
RATE_LIMITED
```
