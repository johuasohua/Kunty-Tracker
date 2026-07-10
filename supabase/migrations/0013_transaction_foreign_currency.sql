-- Foreign-currency transactions: amount stays AED-denominated everywhere
-- (no change to any existing aggregate/calculation logic). These three
-- columns are purely supplementary — they record what was actually paid,
-- in what currency, and at what rate, so the AED figure can be explained
-- and edited later without losing the original entry.

alter table transactions
  add column original_amount numeric(12, 2),
  add column original_currency text,
  add column exchange_rate numeric(14, 6);

comment on column transactions.original_amount is
  'Amount in the original (foreign) currency before AED conversion. Null when the transaction was entered directly in AED.';
comment on column transactions.original_currency is
  'ISO 4217 currency code of original_amount (e.g. USD, EUR). Null when entered directly in AED.';
comment on column transactions.exchange_rate is
  'Rate used to convert original_amount to AED at entry time: amount = original_amount * exchange_rate.';
