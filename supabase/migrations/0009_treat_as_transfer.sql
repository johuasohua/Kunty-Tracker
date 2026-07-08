-- ---------------------------------------------------------------------------
-- treat_as = 'transfer'  (money moved out to an own account)
--
-- 'offset' was doing double duty: contra-expense (Refunds — money coming
-- BACK, shown as "+") and offset-account deposits (money going OUT). The
-- transaction list showed both as "+", so a mortgage-offset deposit looked
-- like income. 'transfer' behaves identically to 'offset' in every aggregate
-- (excluded from CC spend, counts as settlement cash-out) but is displayed
-- as "−" because the cash genuinely leaves.
-- ---------------------------------------------------------------------------
alter table categories drop constraint categories_treat_as_check;
alter table categories add constraint categories_treat_as_check
  check (treat_as in ('expense', 'income', 'offset', 'transfer'));

-- The Offset category is a transfer out, not a contra-expense.
update categories set treat_as = 'transfer' where name = 'Offset';
