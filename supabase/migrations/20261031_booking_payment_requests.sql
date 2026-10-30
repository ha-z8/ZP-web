-- Apply in Supabase SQL editor before enabling payment links.
create table if not exists public.booking_payment_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  order_id text not null unique,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'SAR' check (currency = 'SAR'),
  payment_url text,
  status text not null default 'pending' check (status in ('pending','link_created','paid','failed','expired','cancelled')),
  created_by uuid not null references auth.users(id),
  provider_response jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists booking_payment_requests_booking_idx on public.booking_payment_requests(booking_id,created_at desc);
alter table public.booking_payment_requests enable row level security;
revoke all on public.booking_payment_requests from anon;
grant select on public.booking_payment_requests to authenticated;
create policy "Customers view own booking payments" on public.booking_payment_requests for select to authenticated
using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);
-- Never grant INSERT/UPDATE/DELETE to regular clients. Server-only writes use service-role.
