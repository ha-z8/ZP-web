alter table public.booking_payment_requests add column if not exists transaction_id text;
alter table public.booking_payment_requests add column if not exists updated_at timestamptz default now();
create unique index if not exists payment_transaction_unique on public.booking_payment_requests(transaction_id) where transaction_id is not null;
create unique index if not exists only_one_open_payment_per_booking on public.booking_payment_requests(booking_id) where status in ('pending','link_created');
-- Protect data integrity: no CASCADE deletion of financial audit trail in production.
-- Before launch, replace booking FK ON DELETE CASCADE with RESTRICT or use soft deletes.
