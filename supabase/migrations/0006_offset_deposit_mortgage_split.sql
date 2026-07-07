-- Split offset_account_periods.transaction_amount (net change) into its two
-- real components so the history table can show deposits and mortgage
-- deductions separately instead of a single net figure.
alter table offset_account_periods
  add column deposit_amount numeric(12, 2) not null default 0,
  add column mortgage_deduction numeric(12, 2) not null default 0;

comment on column offset_account_periods.transaction_amount is
  'Net change for the period (deposit_amount - mortgage_deduction). Kept for reference.';
comment on column offset_account_periods.deposit_amount is
  'Money added into the offset account during this period.';
comment on column offset_account_periods.mortgage_deduction is
  'Amount deducted from the offset account for the mortgage payment during this period.';
