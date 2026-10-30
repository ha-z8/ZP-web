-- Archive links from site listings while retaining immutable payment records.
alter table public.booking_payment_requests add column if not exists archived_at timestamptz;
alter table public.booking_payment_requests add column if not exists archived_by uuid references auth.users(id);
alter table public.payment_admin_audit drop constraint if exists payment_admin_audit_action_check;
alter table public.payment_admin_audit add constraint payment_admin_audit_action_check check(action in ('hide_link','restore_link','archive_link','unarchive_link'));
drop policy if exists "Customers view own booking payments" on public.booking_payment_requests;
create policy "Customers view own booking payments" on public.booking_payment_requests for select to authenticated using (
(hidden_at is null and archived_at is null and exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())))
or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
);