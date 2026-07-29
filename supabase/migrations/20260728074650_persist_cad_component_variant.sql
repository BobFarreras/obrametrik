alter function public.save_cad_plan(jsonb, uuid)
  rename to save_cad_plan_without_component_variant;

alter function public.save_cad_plan_without_component_variant(jsonb, uuid)
  set schema private;

revoke all on function private.save_cad_plan_without_component_variant(jsonb, uuid)
  from public, anon, authenticated;
grant execute on function private.save_cad_plan_without_component_variant(jsonb, uuid)
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
  from private.save_cad_plan_without_component_variant(p_plan, p_space_id) saved;

  update public.building_elements element
  set specification = element.specification || jsonb_build_object(
    'componentVariant',
    case component.value->>'kind'
      when 'door' then case
        when component.value->>'variant' in ('hinged', 'sliding', 'pocket', 'folding', 'double_hinged')
          then component.value->>'variant' else 'hinged' end
      when 'window' then case
        when component.value->>'variant' in ('casement', 'sliding', 'tilt_turn', 'fixed', 'awning')
          then component.value->>'variant' else 'casement' end
      when 'light' then case
        when component.value->>'variant' in ('ceiling', 'wall', 'recessed', 'pendant')
          then component.value->>'variant' else 'ceiling' end
      when 'switch' then case
        when component.value->>'variant' in ('single', 'double', 'dimmer', 'two_way')
          then component.value->>'variant' else 'single' end
      when 'socket' then case
        when component.value->>'variant' in ('single', 'double', 'usb')
          then component.value->>'variant' else 'single' end
      when 'cold_water' then case
        when component.value->>'variant' in ('wall_outlet', 'floor_outlet', 'manifold')
          then component.value->>'variant' else 'wall_outlet' end
      when 'hot_water' then case
        when component.value->>'variant' in ('wall_outlet', 'floor_outlet', 'manifold')
          then component.value->>'variant' else 'wall_outlet' end
      when 'drain' then case
        when component.value->>'variant' in ('floor', 'wall', 'linear')
          then component.value->>'variant' else 'floor' end
    end
  )
  from jsonb_array_elements(coalesce(p_plan->'components', '[]'::jsonb)) component
  where element.space_id = v_space_id
    and element.position_x_mm = (component.value->'point'->>'x')::integer
    and element.position_y_mm = (component.value->'point'->>'y')::integer
    and (
      element.kind::text = component.value->>'kind'
      or element.specification->>'terminalKind' = component.value->>'kind'
    );

  return query select v_space_id, v_updated_at;
end;
$$;

revoke all on function public.save_cad_plan(jsonb, uuid) from public, anon;
grant execute on function public.save_cad_plan(jsonb, uuid) to authenticated;

comment on function public.save_cad_plan(jsonb, uuid) is
  'Atomically saves a CAD space with validated component variant metadata.';
