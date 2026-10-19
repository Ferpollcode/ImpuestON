alter table public.obligations
add column if not exists recurring_amount_mode text not null default 'pending'
check (recurring_amount_mode in ('pending', 'repeat'));
