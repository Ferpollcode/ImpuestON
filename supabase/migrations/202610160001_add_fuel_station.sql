alter table public.fuel_entries
add column if not exists station text not null default '';
