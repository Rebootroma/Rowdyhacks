# CrewCash V2 — Hackathon Build Plan

## Goal

Build a technically impressive beginner-track project without collapsing under scope.

The winning strategy is not to finish every idea.

The winning strategy is to finish the **right visible chain**.

---

# 1. The Main Vertical Demo Chain

This chain is sacred:

```text
Crew budget
   ↓
Receipt / expense
   ↓
Tiger Data event
   ↓
Analytics / forecast
   ↓
Anomaly + policy evaluation
   ↓
Gemini explanation
   ↓
Approval
   ↓
Dashboard updates
```

If this works beautifully, the project already has a strong submission.

---

# 2. Second Demo Chain

```text
Personal profile
   ↓
Credit Health
   ↓
Credit simulator
   ↓
Investment Readiness
   ↓
Portfolio simulation
   ↓
Gemini explanation
```

---

# 3. Four-Person Team Split

## Engineer A — App / UI

Own:
- Next.js shell
- dashboard
- navigation
- components
- charts
- responsive design
- demo polish

## Engineer B — Tiger Data / Backend

Own:
- schema
- hypertables
- queries
- continuous aggregates
- events
- seed data

## Engineer C — Finance Algorithms

Own:
- policies
- splits
- forecast
- anomaly scoring
- credit health
- investment readiness
- portfolio simulations

## Engineer D — Gemini / Integration

Own:
- receipt extraction
- structured outputs
- tool calling
- Coach
- fallbacks
- pitch/demo

Pair frequently.

---

# 4. Three-Person Team Split

## A
Frontend + design

## B
Database + backend + Tiger Data

## C
Algorithms + Gemini

All three help integration/testing.

---

# 5. Build Stages

## Stage 1 — Skeleton

Deliver:
- repo
- deployment
- auth
- DB connection
- basic navigation

Do not spend hours on landing-page animation.

---

## Stage 2 — Crew Core

Deliver:
- create Crew
- members
- monthly budget
- expenses
- split
- approval rules

At this point app must already have a working end-to-end transaction.

---

## Stage 3 — Tiger Data

Deliver:
- event hypertable
- event insertion
- daily spend query
- category totals
- one chart

Now sponsor integration is real.

---

## Stage 4 — Intelligence

Deliver:
- burn rate
- month-end forecast
- anomaly engine
- warning cards

Now project stops feeling like CRUD.

---

## Stage 5 — Gemini

Deliver:
- receipt extraction
- Coach
- four tools

Suggested first tools:
- get_crew_budget_forecast
- simulate_purchase
- get_spending_trends
- get_personal_summary

---

## Stage 6 — Student Wealth

Deliver:
- Financial Health
- Credit Health
- credit simulator
- Investment Readiness

---

## Stage 7 — Portfolio

Deliver:
- allocation editor
- scenario projection
- one stress-test scenario
- educational ETF vs stock comparison

---

## Stage 8 — Polish

Deliver:
- seed data
- good empty states
- error fallbacks
- loading states
- mobile
- pitch

---

## Stage 9 — Stretch

Choose one:
- Solana
- ElevenLabs
- more Tiger aggregates

Do not choose all three.

---

# 6. Stop Rules

If Crew core isn't stable:
- no Solana

If Tiger dashboard isn't stable:
- no additional investing screens

If Gemini receipt isn't stable:
- keep manual fallback and move on

If deployment breaks:
- stop feature work and fix deployment

---

# 7. Demo Data Requirements

Create believable seeded data.

Crew:
- Roadrunner Robotics
- 4 members
- $3,000 budget
- 30–45 days of history
- 1 high anomaly
- 1 pending approval

Personal:
- monthly income
- expense history
- emergency savings
- credit utilization
- stable but imperfect readiness

Market:
- 4–6 demo instruments
- at least 60 daily points

---

# 8. Pitch Structure

## 0–15 seconds — Problem

"Students have budgeting apps, credit education, investing content, and group expense tools — but they are disconnected. CrewCash brings them together into one explainable financial intelligence system."

## 15–35 — Crew dashboard

Show Tiger Data:
- history
- burn rate
- forecast

## 35–55 — Receipt

Upload:
- Gemini extracts
- app validates

## 55–80 — Decision

Ask:
"Can our club afford a $650 event purchase?"

Gemini uses CrewCash tools.

## 80–100 — Governance

Show:
- approval policy
- anomaly
- final approval

## 100–125 — Personal

Show:
- credit utilization simulation
- investment readiness

## 125–145 — Portfolio

Show:
- diversification
- stress test

## 145–160 — Close

"Gemini explains. Tiger Data tracks and analyzes. CrewCash makes the calculations transparent so students can understand the decision."

---

# 9. Judge Questions to Prepare For

## "Why Tiger Data?"

Answer:
- financial behavior is temporal
- one database for relational users + time-series events
- rolling analytics
- continuous aggregation
- trend/forecast inputs

## "Why Gemini?"

Answer:
- receipt understanding
- natural-language interaction
- tool calling over deterministic finance functions
- explanations rather than hidden decision-making

## "Is this giving financial advice?"

Answer:
- educational insights
- transparent readiness and simulations
- no trade execution
- no buy/sell command
- assumptions shown

## "Why not let Gemini calculate everything?"

Answer:
- balances and scores must be deterministic and testable
- Gemini is used where language/vision reasoning is valuable

## "What is technically hardest?"

Answer:
- joining time-series event analytics with deterministic forecast/risk engines and an AI tool-calling layer while preserving permissions

---

# 10. Submission Checklist

- [ ] Git repo clean
- [ ] no secrets committed
- [ ] deployed link
- [ ] Tiger Data actually used
- [ ] Gemini actually used
- [ ] sponsor tech named in README
- [ ] architecture diagram
- [ ] screenshots
- [ ] demo account
- [ ] fallback receipt
- [ ] seeded histories
- [ ] pitch practiced
- [ ] known limitations documented
