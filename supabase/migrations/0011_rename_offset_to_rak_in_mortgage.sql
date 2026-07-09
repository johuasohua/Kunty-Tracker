-- Rename offset columns to rak in mortgage_payments table

alter table mortgage_payments rename column offset_opening_balance to rak_opening_balance;
alter table mortgage_payments rename column offset_closing_balance to rak_closing_balance;
alter table mortgage_payments rename column offset_transaction_amount to rak_transaction_amount;
alter table mortgage_payments rename column offset_note to rak_note;
