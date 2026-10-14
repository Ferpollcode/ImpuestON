alter table public.obligations
  add column if not exists recurring boolean not null default false;
