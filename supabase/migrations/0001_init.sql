-- Kunty Tracker — initial schema
-- Two-person household finance tracker: mortgage, dashboard, transactions,
-- credit card tracking, budgets, recurring bills.
-- Shared dataset: both people see all rows. RLS restricts access to
-- authenticated household members only (no per-row ownership silos).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- people
-- ---------------------------------------------------------------------------
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                 -- 'Josh' | 'Kiki'
  color text not null default '#007AFF',      -- accent color used in charts/avatars
  auth_user_id uuid unique references auth.users (id) on delete set null,
  last_used_payment_method text check (last_used_payment_method in ('credit', 'debit')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories (configurable, not hardcoded)
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  treat_as text not null check (treat_as in ('expense', 'income', 'offset')),
  -- 'expense': normal spend category, counts toward total expense
  -- 'income': counts toward total income
  -- 'offset': reduces total expense for the period (e.g. Refunds) without
  --           being tied to one specific expense category
  color text not null default '#8E8E93',
  icon text,                                  -- SF Symbols-style name, rendered client-side
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid not null references categories (id) on delete restrict,
  person_id uuid not null references people (id) on delete restrict,
  payment_method text not null check (payment_method in ('credit', 'debit')),
  type text not null check (type in ('income', 'expense')),
  note text,
  source text not null default 'manual' check (source in ('manual', 'voice', 'shortcut', 'import')),
  raw_capture_text text,                      -- original dictated/typed text for voice & shortcut entries
  created_by_person_id uuid references people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_occurred_on_idx on transactions (occurred_on desc);
create index if not exists transactions_category_idx on transactions (category_id);
create index if not exists transactions_person_idx on transactions (person_id);

-- ---------------------------------------------------------------------------
-- mortgage_payments  (mirrors the "LIV" sheet, one row per payment period)
-- ---------------------------------------------------------------------------
create table if not exists mortgage_payments (
  id uuid primary key default gen_random_uuid(),
  period_no integer not null unique,
  payment_date date not null,
  opening_principal numeric(14, 2) not null,
  principal_amount numeric(12, 2) not null,
  interest_amount numeric(12, 2) not null,
  insurance_amount numeric(12, 2) not null,    -- Life + Property insurance
  hoi_charge numeric(12, 2) not null,
  closing_principal numeric(14, 2) not null,
  offset_opening_balance numeric(14, 2),
  offset_closing_balance numeric(14, 2),
  interest_saved numeric(12, 2),               -- first-class stat, not just derived
  offset_transaction_amount numeric(14, 2),    -- ad-hoc deposit/withdrawal into offset this period
  offset_note text,
  created_at timestamptz not null default now()
);

create index if not exists mortgage_payments_date_idx on mortgage_payments (payment_date);

-- ---------------------------------------------------------------------------
-- cc_payments  (amount actually paid off each person's credit card, per month)
-- Current-month CC spend and carry-over balance are derived, not stored:
--   current_month_spend(person, month) = sum(transactions where payment_method='credit'
--                                             and person_id=person and month(occurred_on)=month)
--   carry_over_balance(person, month)  = closing_balance(person, previous month)
--   closing_balance(person, month)     = carry_over + current_month_spend - cc_paid_off
-- opening_cc_balances seeds the very first month for each person.
-- ---------------------------------------------------------------------------
create table if not exists opening_cc_balances (
  person_id uuid primary key references people (id) on delete cascade,
  as_of_month date not null,                  -- first-of-month the balance applies to
  balance numeric(14, 2) not null default 0
);

create table if not exists cc_payments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete restrict,
  month date not null,                        -- always first-of-month
  amount_paid numeric(12, 2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique (person_id, month)
);

-- ---------------------------------------------------------------------------
-- budgets  (monthly amount per category, optional per-person sub-budget)
-- ---------------------------------------------------------------------------
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  person_id uuid references people (id) on delete cascade,   -- null = shared/whole-category budget
  monthly_amount numeric(12, 2) not null,
  effective_from date not null default date_trunc('month', now())::date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, person_id, effective_from)
);

create index if not exists budgets_category_idx on budgets (category_id);

-- ---------------------------------------------------------------------------
-- recurring_bills
-- ---------------------------------------------------------------------------
create table if not exists recurring_bills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null,
  due_day integer not null check (due_day between 1 and 31),
  category_id uuid references categories (id) on delete set null,
  owner_person_id uuid references people (id) on delete set null,  -- null = shared
  default_payment_method text check (default_payment_method in ('credit', 'debit')),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- Tracks which (bill, month) has already been marked paid, and the
-- transaction that was optionally auto-created for it.
create table if not exists recurring_bill_payments (
  id uuid primary key default gen_random_uuid(),
  recurring_bill_id uuid not null references recurring_bills (id) on delete cascade,
  month date not null,                        -- first-of-month
  paid_on date not null default now(),
  transaction_id uuid references transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (recurring_bill_id, month)
);

-- ---------------------------------------------------------------------------
-- opening_balances  (household cash opening balance per month, like Overview sheet)
-- Only the very first tracked month needs a seed row; every later month's
-- opening balance is the previous month's closing balance, computed in-app.
-- ---------------------------------------------------------------------------
create table if not exists opening_balance_seed (
  id boolean primary key default true check (id),  -- singleton row
  as_of_month date not null,
  balance numeric(14, 2) not null
);

-- ---------------------------------------------------------------------------
-- api_tokens  (per-person tokens for the iOS Shortcuts /api/quick-log endpoint)
-- ---------------------------------------------------------------------------
create table if not exists api_tokens (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  label text not null default 'iOS Shortcut',
  token_hash text not null unique,            -- sha-256 hex of the plaintext token
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger for transactions
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on transactions;
create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Shared household dataset: any authenticated household member (there are
-- only ever two auth.users rows) can read/write everything. This is not a
-- general-purpose multi-tenant policy — it's intentionally simple for a
-- 2-user private household app.
-- ---------------------------------------------------------------------------
alter table people enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table mortgage_payments enable row level security;
alter table opening_cc_balances enable row level security;
alter table cc_payments enable row level security;
alter table budgets enable row level security;
alter table recurring_bills enable row level security;
alter table recurring_bill_payments enable row level security;
alter table opening_balance_seed enable row level security;
alter table api_tokens enable row level security;

create policy "household read" on people for select using (auth.role() = 'authenticated');
create policy "household read" on categories for select using (auth.role() = 'authenticated');
create policy "household write" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on transactions for select using (auth.role() = 'authenticated');
create policy "household write" on transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on mortgage_payments for select using (auth.role() = 'authenticated');
create policy "household write" on mortgage_payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on opening_cc_balances for select using (auth.role() = 'authenticated');
create policy "household write" on opening_cc_balances for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on cc_payments for select using (auth.role() = 'authenticated');
create policy "household write" on cc_payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on budgets for select using (auth.role() = 'authenticated');
create policy "household write" on budgets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on recurring_bills for select using (auth.role() = 'authenticated');
create policy "household write" on recurring_bills for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on recurring_bill_payments for select using (auth.role() = 'authenticated');
create policy "household write" on recurring_bill_payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "household read" on opening_balance_seed for select using (auth.role() = 'authenticated');
create policy "household write" on opening_balance_seed for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- people: allow a signed-in user to link their own auth_user_id once, but
-- keep person rows themselves managed by the household (both can edit names/colors).
create policy "household write" on people for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- api_tokens: no client-side access at all — only the service-role key
-- (used by the /api/quick-log route handler) can read/write these.
create policy "service role only" on api_tokens for all using (false) with check (false);

-- ---------------------------------------------------------------------------
-- Seed the two household members. Categories/budgets/recurring bills are
-- seeded by the historical-data import script, not hardcoded here.
-- ---------------------------------------------------------------------------
insert into people (name, color)
values ('Josh', '#007AFF'), ('Kiki', '#FF2D55')
on conflict (name) do nothing;
