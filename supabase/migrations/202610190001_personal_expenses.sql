create table if not exists public.personal_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  category text not null,
  spent_on date not null,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personal_expenses enable row level security;
revoke all on public.personal_expenses from anon, authenticated;
grant select, insert, update, delete on public.personal_expenses to authenticated;

create policy "personal_expenses_select_own" on public.personal_expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "personal_expenses_insert_own" on public.personal_expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "personal_expenses_update_own" on public.personal_expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "personal_expenses_delete_own" on public.personal_expenses for delete to authenticated using ((select auth.uid()) = user_id);

create index personal_expenses_user_month_idx on public.personal_expenses(user_id, spent_on desc);
