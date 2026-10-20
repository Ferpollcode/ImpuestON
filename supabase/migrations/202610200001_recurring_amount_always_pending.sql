update public.obligations
set recurring_amount_mode = 'pending'
where recurring_amount_mode <> 'pending';

alter table public.obligations
  drop constraint if exists obligations_recurring_amount_mode_check;

alter table public.obligations
  add constraint obligations_recurring_amount_mode_check
  check (recurring_amount_mode = 'pending');
