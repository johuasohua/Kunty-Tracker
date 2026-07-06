-- Add payment_date column to cc_payments table to track when payment was actually made
alter table cc_payments add column payment_date date not null default now();
