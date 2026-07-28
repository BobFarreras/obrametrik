alter function public.save_cad_plan(jsonb, uuid)
  rename to save_cad_plan_without_door_swing;

alter function public.save_cad_plan_without_door_swing(jsonb, uuid)
  set schema private;

revoke all on function private.save_cad_plan_without_door_swing(jsonb, uuid)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.save_cad_plan_without_door_swing(jsonb, uuid)
  to authenticated;

create function public.save_cad_plan(
  p_plan jsonb,
  p_space_id uuid default null
)
returns table (space_id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_space_id uuid;
  v_updated_at timestamptz;
begin
  select saved.space_id, saved.updated_at
  into v_space_id, v_updated_at
  from private.save_cad_plan_without_door_swing(p_plan, p_space_id) saved;

  update public.building_elements element
  set specification = element.specification || jsonb_build_object(
    'doorSwing',
    case component.value->>'swing'
      when 'left_in' then 'left_in'
      when 'right_in' then 'right_in'
      when 'left_out' then 'left_out'
      when 'right_out' then 'right_out'
      else 'left_in'
    end
  )
  from jsonb_array_elements(coalesce(p_plan->'components', '[]'::jsonb)) component
  where element.space_id = v_space_id
    and element.kind = 'door'
    and component.value->>'kind' = 'door'
    and element.position_x_mm = (component.value->'point'->>'x')::integer
    and element.position_y_mm = (component.value->'point'->>'y')::integer;

  return query select v_space_id, v_updated_at;
end;
$$;

revoke all on function public.save_cad_plan(jsonb, uuid) from public, anon;
grant execute on function public.save_cad_plan(jsonb, uuid) to authenticated;

comment on function public.save_cad_plan(jsonb, uuid) is
  'Atomically saves a CAD space and persists validated door swing metadata.';
