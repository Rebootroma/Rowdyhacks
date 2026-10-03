-- CrewCash V2 — Tiger Data / PostgreSQL Starter Schema
--
-- IMPORTANT:
-- Tiger Data evolves. Current Tiger Cloud services support declarative
-- hypertable creation through tsdb table options. If your service uses an
-- older TimescaleDB-compatible API, adapt the hypertable statements rather
-- than mixing both approaches blindly.
--
-- This schema is a starter for the hackathon, not a production banking schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- RELATIONAL CORE
-- =========================================================

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_profiles (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  monthly_income_cents BIGINT NOT NULL DEFAULT 0 CHECK (monthly_income_cents >= 0),
  cash_balance_cents BIGINT NOT NULL DEFAULT 0,
  emergency_savings_cents BIGINT NOT NULL DEFAULT 0 CHECK (emergency_savings_cents >= 0),
  revolving_balance_cents BIGINT CHECK (revolving_balance_cents >= 0),
  revolving_limit_cents BIGINT CHECK (revolving_limit_cents > 0),
  on_time_payment_percent NUMERIC(5,2)
    CHECK (on_time_payment_percent >= 0 AND on_time_payment_percent <= 100),
  average_account_age_months INTEGER CHECK (average_account_age_months >= 0),
  hard_inquiries INTEGER CHECK (hard_inquiries >= 0),
  user_entered_credit_score INTEGER
    CHECK (user_entered_credit_score BETWEEN 300 AND 850),
  risk_tolerance TEXT
    CHECK (risk_tolerance IN ('low','moderate','high')),
  investment_horizon_months INTEGER CHECK (investment_horizon_months >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crew_members (
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','treasurer','member','viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS crew_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, month)
);

CREATE TABLE IF NOT EXISTS approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  min_cents BIGINT NOT NULL CHECK (min_cents >= 0),
  max_cents BIGINT CHECK (max_cents IS NULL OR max_cents >= min_cents),
  required_approvals INTEGER NOT NULL DEFAULT 0 CHECK (required_approvals >= 0),
  required_roles TEXT[] NOT NULL DEFAULT '{}',
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES app_users(id),
  title TEXT NOT NULL,
  merchant TEXT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  category TEXT NOT NULL,
  expense_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','pending','approved','rejected','cancelled')),
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  anomaly_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  receipt_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  PRIMARY KEY (expense_id, user_id)
);

CREATE TABLE IF NOT EXISTS expense_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  role_at_decision TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (expense_id, user_id)
);

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES app_users(id),
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  extraction JSONB,
  integrity_checks JSONB,
  extraction_confidence NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_allocations (
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_key TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  weight_bps INTEGER NOT NULL CHECK (weight_bps BETWEEN 0 AND 10000),
  PRIMARY KEY (portfolio_id, asset_key)
);

CREATE TABLE IF NOT EXISTS solana_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL UNIQUE REFERENCES expenses(id) ON DELETE CASCADE,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'devnet',
  anchored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- TIME-SERIES
-- =========================================================

-- Current Tiger Cloud-style declarative hypertable.
CREATE TABLE IF NOT EXISTS financial_events (
  time TIMESTAMPTZ NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('personal','crew')),
  scope_id UUID NOT NULL,
  actor_user_id UUID,
  event_type TEXT NOT NULL,
  amount_cents BIGINT,
  category TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (time, id)
) WITH (
  tsdb.hypertable,
  tsdb.partition_column='time'
);

CREATE INDEX IF NOT EXISTS idx_financial_events_scope_time
  ON financial_events (scope_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_financial_events_type_time
  ON financial_events (event_type, time DESC);

CREATE TABLE IF NOT EXISTS personal_metric_snapshots (
  time TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL,
  financial_health INTEGER,
  credit_health INTEGER,
  investment_readiness INTEGER,
  monthly_spend_cents BIGINT,
  monthly_income_cents BIGINT,
  cash_balance_cents BIGINT,
  credit_utilization_percent NUMERIC(8,4),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (time, user_id)
) WITH (
  tsdb.hypertable,
  tsdb.partition_column='time'
);

CREATE TABLE IF NOT EXISTS crew_metric_snapshots (
  time TIMESTAMPTZ NOT NULL,
  crew_id UUID NOT NULL,
  approved_spend_cents BIGINT,
  pending_spend_cents BIGINT,
  remaining_budget_cents BIGINT,
  daily_burn_cents BIGINT,
  projected_month_end_cents BIGINT,
  health_score INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (time, crew_id)
) WITH (
  tsdb.hypertable,
  tsdb.partition_column='time'
);

CREATE TABLE IF NOT EXISTS market_prices (
  time TIMESTAMPTZ NOT NULL,
  symbol TEXT NOT NULL,
  price NUMERIC(20,8) NOT NULL CHECK (price > 0),
  volume NUMERIC(30,8),
  source TEXT NOT NULL,
  PRIMARY KEY (time, symbol, source)
) WITH (
  tsdb.hypertable,
  tsdb.partition_column='time'
);

CREATE INDEX IF NOT EXISTS idx_market_symbol_time
  ON market_prices (symbol, time DESC);

-- =========================================================
-- CONTINUOUS AGGREGATES
-- =========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_scope_spend
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  scope_type,
  scope_id,
  COALESCE(category, 'uncategorized') AS category,
  SUM(COALESCE(amount_cents, 0)) AS amount_cents,
  COUNT(*) AS event_count
FROM financial_events
WHERE event_type IN ('expense.approved', 'personal.expense_recorded')
GROUP BY bucket, scope_type, scope_id, COALESCE(category, 'uncategorized');

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_market_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  symbol,
  first(price, time) AS open,
  max(price) AS high,
  min(price) AS low,
  last(price, time) AS close,
  SUM(COALESCE(volume, 0)) AS volume
FROM market_prices
GROUP BY bucket, symbol;

-- =========================================================
-- USEFUL RELATIONAL INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_members_user
  ON crew_members(user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_crew_date
  ON expenses(crew_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_crew_status
  ON expenses(crew_id, status);

CREATE INDEX IF NOT EXISTS idx_approval_policies_crew_priority
  ON approval_policies(crew_id, priority DESC);

-- =========================================================
-- NOTE ON AUTHORIZATION
-- =========================================================
--
-- If using direct browser access to PostgreSQL, implement robust row-level
-- security tied to your auth provider.
--
-- For the hackathon, the recommended architecture is:
--
-- Browser -> authenticated Next.js server -> Tiger Data
--
-- and every server query/mutation explicitly checks ownership or crew
-- membership before touching scoped records.
--
-- Never rely on hiding IDs in the UI as authorization.
