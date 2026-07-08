-- ---------------------------------------------------------------------------
-- cc_statements  (actual billing-statement total for a CLOSED cycle)
--
-- CC billing cycles don't align to calendar months (e.g. 15th-to-15th), so the
-- calendar-month sum of credit transactions won't match the real statement.
-- For a closed month where the true statement total is known, record it here;
-- buildCcSeries uses this figure as that month's credit spend instead of the
-- derived calendar sum, so the running balance reconciles exactly.
--
-- Open/current months (no row here) keep deriving spend from transactions.
-- ---------------------------------------------------------------------------
create table if not exists cc_statements (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete restrict,
  month date not null,                          -- always first-of-month
  statement_amount numeric(12, 2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique (person_id, month)
);

alter table cc_statements enable row level security;
create policy "household read" on cc_statements for select using (auth.role() = 'authenticated');
create policy "household write" on cc_statements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
