-- Create separate offset account tracking table (independent of mortgage)
create table offset_account_periods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  period_no integer not null unique,
  period_month text not null, -- YYYY-MM format
  opening_balance numeric(12, 2) not null default 0,
  closing_balance numeric(12, 2) not null default 0,
  transaction_amount numeric(12, 2) not null default 0, -- cumulative deposits/withdrawals
  transaction_note text
);

-- Enable RLS (shared household — all authenticated users can read/write)
alter table offset_account_periods enable row level security;

create policy "offset_account_periods_all"
  on offset_account_periods
  for all
  to authenticated
  using (true)
  with check (true);

-- Index for queries
create index offset_account_periods_period_no on offset_account_periods(period_no desc);
create index offset_account_periods_period_month on offset_account_periods(period_month);
