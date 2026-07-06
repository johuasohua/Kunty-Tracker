-- Recurring bills: support quarterly/annual billing cycles, not just monthly.
-- (e.g. TOD TV paid once a year, building maintenance paid once a quarter),
-- while still letting the app show an amortized "effective monthly cost".
--
-- Replaces the plain "due_day" (1-31) with a frequency + a single anchor
-- due date. The *current* unpaid cycle's due date is derived in application
-- code from that anchor (advance by the frequency interval past every
-- already-paid cycle) rather than stored/mutated here — this keeps the
-- schema simple and avoids drift between "next_due_date" and reality.

alter table recurring_bills
  add column if not exists frequency text not null default 'monthly'
    check (frequency in ('monthly', 'quarterly', 'annual')),
  add column if not exists next_due_date date;

-- Backfill next_due_date from the old due_day for any existing rows,
-- using this month's occurrence of that day-of-month (clamped to the
-- last day of the month, same as the old due_day semantics).
update recurring_bills
set next_due_date = make_date(
  extract(year from current_date)::int,
  extract(month from current_date)::int,
  least(
    due_day,
    extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::int
  )
)
where next_due_date is null;

alter table recurring_bills
  alter column next_due_date set not null,
  drop column if exists due_day;
