/*
 * Purpose: keep every surface net area non-negative under concurrent writes.
 * Security: the function is private, has a fixed search_path and is callable
 * only by its trigger.
 */
create function private.enforce_nonnegative_surface_net_area()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_surface_id uuid;
  surface_gross_area numeric;
  existing_adjustment numeric;
  candidate_adjustment numeric := 0;
begin
  target_surface_id := case when tg_op = 'DELETE' then old.surface_id else new.surface_id end;

  select gross_area_m2
  into surface_gross_area
  from public.surfaces
  where id = target_surface_id
  for update;

  select coalesce(sum(
    case when operation = 'add' then area_m2 else -area_m2 end
  ), 0)
  into existing_adjustment
  from public.measurements
  where surface_id = target_surface_id
    and (tg_op = 'INSERT' or id <> coalesce(new.id, old.id));

  if tg_op <> 'DELETE' then
    candidate_adjustment := case
      when new.operation = 'add' then new.width_m * new.height_m
      else -(new.width_m * new.height_m)
    end;
  end if;

  if surface_gross_area + existing_adjustment + candidate_adjustment < 0 then
    raise exception using
      errcode = '23514',
      message = 'measurement deductions cannot exceed surface gross area';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.enforce_nonnegative_surface_net_area() from public, anon, authenticated;

create trigger measurements_enforce_nonnegative_net_area
before insert or update or delete on public.measurements
for each row execute function private.enforce_nonnegative_surface_net_area();
