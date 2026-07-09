-- Rename offset account table and columns to Rak

-- Rename the table
alter table offset_account_periods rename to rak_account_periods;

-- Rename indexes
alter index offset_account_periods_period_no rename to rak_account_periods_period_no;
alter index offset_account_periods_period_month rename to rak_account_periods_period_month;

-- Rename policy
alter policy offset_account_periods_all on rak_account_periods rename to rak_account_periods_all;

-- Update column comments to reflect new name
comment on table rak_account_periods is 'Rak (offset) account history with locked periods and derived months.';
comment on column rak_account_periods.deposit_amount is
  'Money added into the Rak account during this period.';
comment on column rak_account_periods.mortgage_deduction is
  'Amount deducted from the Rak account for the mortgage payment during this period.';
