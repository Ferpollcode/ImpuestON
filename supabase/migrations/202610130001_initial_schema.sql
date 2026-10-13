create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  active boolean not null default true,
  notifications boolean not null default true,
  is_custom boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  obligation_id uuid references public.obligations(id) on delete set null,
  obligation_name text not null,
  category text not null default '',
  period text not null,
  issued_on date,
  due_on date not null,
  paid_on date,
  amount numeric(14,2),
  total_amount numeric(14,2),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  status text not null default 'pending' check (status in ('paid', 'overdue', 'soon', 'pending', 'review', 'due-today')),
  installment text not null default '',
  invoice text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_id uuid references public.records(id) on delete set null,
  name text not null,
  mime_type text not null default '',
  storage_path text,
  status text not null default 'Pendiente de revisar',
  confidence text not null default 'medium',
  qr_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  notification_time time not null default '09:00',
  reminder_days integer[] not null default array[7,3,1,0],
  alerts_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.obligations enable row level security;
alter table public.records enable row level security;
alter table public.documents enable row level security;
alter table public.user_settings enable row level security;

revoke all on public.profiles, public.obligations, public.records, public.documents, public.user_settings from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.obligations, public.records, public.documents, public.user_settings to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "obligations_select_own" on public.obligations for select to authenticated using ((select auth.uid()) = user_id);
create policy "obligations_insert_own" on public.obligations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "obligations_update_own" on public.obligations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "obligations_delete_own" on public.obligations for delete to authenticated using ((select auth.uid()) = user_id);

create policy "records_select_own" on public.records for select to authenticated using ((select auth.uid()) = user_id);
create policy "records_insert_own" on public.records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "records_update_own" on public.records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "records_delete_own" on public.records for delete to authenticated using ((select auth.uid()) = user_id);

create policy "documents_select_own" on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "documents_insert_own" on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "documents_update_own" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "documents_delete_own" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

create policy "settings_select_own" on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings_insert_own" on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings_update_own" on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index obligations_user_id_idx on public.obligations(user_id);
create index records_user_id_idx on public.records(user_id);
create index records_due_on_idx on public.records(user_id, due_on);
create index documents_user_id_idx on public.documents(user_id);
