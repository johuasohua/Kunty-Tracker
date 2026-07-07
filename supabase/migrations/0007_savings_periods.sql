-- Locked historical savings ledger. Like offset_account_periods and
-- mortgage_payments, these are reconciled monthly figures imported from the
-- source spreadsheet — stored as source-of-truth rows rather than re-derived
-- from transactions (whose full history isn't imported). Months after the
-- latest locked row are derived live from transactions.
create table savings_periods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  period_month text not null unique, -- YYYY-MM
  opening_balance numeric(12, 2) not null default 0,
  total_income numeric(12, 2) not null default 0,
  debit_expense numeric(12, 2) not null default 0,
  cc_paid_off numeric(12, 2) not null default 0,
  total_expense numeric(12, 2) not null default 0, -- debit_expense + cc_paid_off
  closing_balance numeric(12, 2) not null default 0,
  amount_saved numeric(12, 2) not null default 0 -- closing_balance - opening_balance
);

-- Shared household — all authenticated users can read/write.
alter table savings_periods enable row level security;

create policy "savings_periods_all"
  on savings_periods
  for all
  to authenticated
  using (true)
  with check (true);

create index savings_periods_period_month on savings_periods(period_month);

-- Investments are money deployed OUT of savings (like offset), not income.
update categories set treat_as = 'expense' where name = 'Investments';
