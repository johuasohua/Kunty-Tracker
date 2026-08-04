-- Per-person account opening balance — the seed for the new master
-- per-person account-balance derivation (opening + income − debit spend −
-- CC payoffs − Offset deposits, all dated). Mirrors opening_cc_balances'
-- shape exactly, but for cash/account balance rather than card debt.
--
-- This is the "account" side of the money that also backs each person's
-- credit card and funds their Offset deposits — previously untracked
-- anywhere in the app (person_id + payment_method alone never summed to a
-- real balance; see CLAUDE.md's payment_accounts note).
create table account_opening_balances (
  person_id uuid primary key references people (id) on delete cascade,
  as_of_date date not null,
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table account_opening_balances enable row level security;

create policy "account_opening_balances_all"
  on account_opening_balances
  for all
  to authenticated
  using (true)
  with check (true);

drop trigger if exists account_opening_balances_set_updated_at on account_opening_balances;
create trigger account_opening_balances_set_updated_at
  before update on account_opening_balances
  for each row execute function set_updated_at();
