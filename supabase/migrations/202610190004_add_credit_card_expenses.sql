alter table public.personal_expenses
  add column if not exists expense_type text not null default 'daily',
  add column if not exists merchant text not null default '',
  add column if not exists bank text not null default '',
  add column if not exists card_name text not null default '',
  add column if not exists installments integer not null default 1;

alter table public.personal_expenses
  drop constraint if exists personal_expenses_installments_check;

alter table public.personal_expenses
  add constraint personal_expenses_installments_check
  check (installments between 1 and 60);

create index if not exists personal_expenses_user_type_month_idx
  on public.personal_expenses(user_id, expense_type, spent_on desc);
