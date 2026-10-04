-- CrewCash Supabase/Postgres starter schema
-- Review and adapt before production use.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','treasurer','member')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  month date not null,
  amount_cents bigint not null check (amount_cents > 0),
  approval_threshold_cents bigint not null default 20000
    check (approval_threshold_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (crew_id, month)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 120),
  merchant text,
  description text,
  amount_cents bigint not null check (amount_cents > 0),
  category text not null check (
    category in (
      'housing','groceries','dining','transportation','utilities',
      'education','healthcare','entertainment','shopping','other'
    )
  ),
  expense_date date not null,
  status text not null check (
    status in ('draft','pending','approved','rejected')
  ),
  approval_required boolean not null default false,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount_cents bigint not null check (amount_cents >= 0),
  unique (expense_id, user_id)
);

create table if not exists public.expense_approvals (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved','rejected')),
  decided_at timestamptz not null default now(),
  unique (expense_id, user_id)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  title text not null,
  target_cents bigint not null check (target_cents > 0),
  current_cents bigint not null default 0 check (current_cents >= 0),
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  actor_user_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  crew_id uuid references public.crews(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_crew_members_user_id
  on public.crew_members(user_id);

create index if not exists idx_expenses_crew_date
  on public.expenses(crew_id, expense_date desc);

create index if not exists idx_expenses_crew_status
  on public.expenses(crew_id, status);

create index if not exists idx_audit_logs_crew_created
  on public.audit_logs(crew_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.budgets enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.expense_approvals enable row level security;
alter table public.savings_goals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Helper function used by policies.
create or replace function public.is_crew_member(target_crew_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crew_members cm
    where cm.crew_id = target_crew_id
      and cm.user_id = auth.uid()
  );
$$;

-- Profiles: user can read/update own profile.
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Crews: members can read.
create policy "crews_select_members"
on public.crews for select
using (public.is_crew_member(id));

-- Crew members: members can read same Crew.
create policy "crew_members_select_members"
on public.crew_members for select
using (public.is_crew_member(crew_id));

-- Budgets: members can read.
create policy "budgets_select_members"
on public.budgets for select
using (public.is_crew_member(crew_id));

-- Expenses: members can read.
create policy "expenses_select_members"
on public.expenses for select
using (public.is_crew_member(crew_id));

-- Splits: members of expense Crew can read.
create policy "expense_splits_select_members"
on public.expense_splits for select
using (
  exists (
    select 1
    from public.expenses e
    where e.id = expense_splits.expense_id
      and public.is_crew_member(e.crew_id)
  )
);

-- Approvals: members of expense Crew can read.
create policy "expense_approvals_select_members"
on public.expense_approvals for select
using (
  exists (
    select 1
    from public.expenses e
    where e.id = expense_approvals.expense_id
      and public.is_crew_member(e.crew_id)
  )
);

create policy "goals_select_members"
on public.savings_goals for select
using (public.is_crew_member(crew_id));

create policy "audit_select_members"
on public.audit_logs for select
using (public.is_crew_member(crew_id));

create policy "notifications_select_own"
on public.notifications for select
using (user_id = auth.uid());

-- IMPORTANT:
-- For a hackathon, perform writes through authenticated server actions
-- with explicit role checks. Add granular insert/update/delete RLS policies
-- before relying on direct client writes.
