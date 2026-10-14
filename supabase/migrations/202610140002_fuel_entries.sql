create table if not exists public.fuel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle text not null,
  filled_on date not null,
  odometer_km numeric(12,1) not null check (odometer_km >= 0),
  liters numeric(10,2) not null check (liters > 0),
  price_per_liter numeric(14,2) not null check (price_per_liter > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fuel_entries enable row level security;
revoke all on public.fuel_entries from anon, authenticated;
grant select, insert, update, delete on public.fuel_entries to authenticated;
create policy "fuel_entries_select_own" on public.fuel_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "fuel_entries_insert_own" on public.fuel_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "fuel_entries_update_own" on public.fuel_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "fuel_entries_delete_own" on public.fuel_entries for delete to authenticated using ((select auth.uid()) = user_id);
create index fuel_entries_user_vehicle_idx on public.fuel_entries(user_id, vehicle, filled_on);
