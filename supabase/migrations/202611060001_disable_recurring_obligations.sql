update public.obligations
set recurring = false
where recurring = true;

alter table public.obligations
  alter column recurring set default false;
