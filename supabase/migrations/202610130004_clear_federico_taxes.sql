do $$
declare
  target_user_id uuid;
  matching_users integer;
begin
  select count(*), (array_agg(id))[1]
  into matching_users, target_user_id
  from public.profiles
  where lower(trim(display_name)) = 'federico';

  if matching_users <> 1 then
    raise exception 'Expected exactly one Federico profile, found %; nothing was deleted', matching_users;
  end if;

  delete from public.records where user_id = target_user_id;
  delete from public.obligations where user_id = target_user_id;
end;
$$;
