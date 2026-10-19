alter table public.personal_expenses
  add column if not exists spent_by text not null default '';
