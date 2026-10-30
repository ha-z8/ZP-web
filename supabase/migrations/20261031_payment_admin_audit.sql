-- Admin payment visibility and audit trail. Apply after booking_payment_requests.
alter table public.booking_payment_requests add column if not exists hidden_at timestamptz;
alter table public.booking_payment_requests add column if not exists hidden_by uuid references auth.users(id);
create table if not exists public.payment_admin_audit (
 id uuid primary key default gen_random_uuid(),
 payment_request_id uuid not null references public.booking_payment_requests(id) on delete restrict,
 actor_id uuid not null references auth.users(id),
 action text not null check(action in ('hide_link','restore_link')),
 reason text,
 created_at timestamptz not null default now()
);
alter table public.payment_admin_audit enable row level security;
drop policy if exists payment_admin_audit_read on public.payment_admin_audit;
create policy payment_admin_audit_read on public.payment_admin_audit for select to authenticated
using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create index if not exists payment_admin_audit_payment_idx on public.payment_admin_audit(payment_request_id,created_at desc);
drop policy if exists "Customers view own booking payments" on public.booking_payment_requests;
create policy "Customers view own booking payments" on public.booking_payment_requests
for select to authenticated using (
 (hidden_at is null and exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())))
 or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
);
