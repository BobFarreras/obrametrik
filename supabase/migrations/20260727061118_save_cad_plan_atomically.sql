create or replace function public.save_cad_plan(
  p_plan jsonb,
  p_space_id uuid default null
)
returns table (space_id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_level_id uuid;
  v_space_id uuid;
  v_updated_at timestamptz;
  v_user_id uuid := (select auth.uid());
  v_vertices jsonb;
  v_vertex_count integer;
  v_wall_ids uuid[] := '{}';
  v_wall_id uuid;
  v_index integer;
  v_start jsonb;
  v_end jsonb;
  v_component jsonb;
  v_kind text;
  v_host_wall uuid;
  v_default_width integer;
  v_default_height integer;
  v_default_elevation integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  v_project_id := (p_plan->>'projectId')::uuid;
  v_vertices := p_plan->'vertices';
  v_vertex_count := jsonb_array_length(v_vertices);
  if v_vertex_count < 3 or v_vertex_count > 64 then
    raise exception using errcode = '22023', message = 'CAD polygon must contain 3 to 64 vertices';
  end if;
  if jsonb_array_length(coalesce(p_plan->'components', '[]'::jsonb)) > 500 then
    raise exception using errcode = '22023', message = 'CAD plan contains too many components';
  end if;

  select id into v_level_id
  from public.building_levels
  where project_id = v_project_id
  order by display_order
  limit 1;

  if v_level_id is null then
    insert into public.building_levels (
      project_id, created_by, name, elevation_mm, display_order
    ) values (
      v_project_id, v_user_id, 'default', 0, 0
    )
    on conflict (project_id, display_order) do nothing
    returning id into v_level_id;

    if v_level_id is null then
      select id into v_level_id
      from public.building_levels
      where project_id = v_project_id and display_order = 0;
    end if;
  end if;

  if p_space_id is null then
    insert into public.building_spaces (
      project_id, level_id, created_by, name, kind, footprint_kind,
      polygon_vertices, clear_height_mm, geometry_source, confirmation
    ) values (
      v_project_id,
      v_level_id,
      v_user_id,
      p_plan->>'name',
      (p_plan->>'kind')::public.building_space_kind,
      'polygon',
      v_vertices,
      (p_plan->>'clearHeightMm')::integer,
      'manual',
      'confirmed'
    )
    returning id, building_spaces.updated_at into v_space_id, v_updated_at;
  else
    update public.building_spaces
    set
      name = p_plan->>'name',
      kind = (p_plan->>'kind')::public.building_space_kind,
      footprint_kind = 'polygon',
      rectangle_width_mm = null,
      rectangle_depth_mm = null,
      polygon_vertices = v_vertices,
      clear_height_mm = (p_plan->>'clearHeightMm')::integer,
      geometry_source = 'manual',
      confirmation = 'confirmed'
    where id = p_space_id and project_id = v_project_id
    returning id, building_spaces.updated_at into v_space_id, v_updated_at;

    if v_space_id is null then
      raise exception using errcode = 'P0002', message = 'CAD space not found';
    end if;

    delete from public.building_elements
    where project_id = v_project_id and space_id = v_space_id and host_element_id is not null;
    delete from public.building_elements
    where project_id = v_project_id and space_id = v_space_id;
  end if;

  for v_index in 0..v_vertex_count - 1 loop
    v_start := v_vertices->v_index;
    v_end := v_vertices->((v_index + 1) % v_vertex_count);
    insert into public.building_elements (
      project_id, space_id, created_by, name, kind,
      position_x_mm, position_y_mm, position_z_mm,
      rotation_z_millidegrees, width_mm, height_mm, depth_mm,
      specification, lifecycle, confirmation
    ) values (
      v_project_id,
      v_space_id,
      v_user_id,
      'wall_' || (v_index + 1),
      'wall',
      (v_start->>'x')::integer,
      (v_start->>'y')::integer,
      0,
      round(degrees(atan2(
        (v_end->>'y')::numeric - (v_start->>'y')::numeric,
        (v_end->>'x')::numeric - (v_start->>'x')::numeric
      )) * 1000)::integer,
      round(sqrt(
        power((v_end->>'x')::numeric - (v_start->>'x')::numeric, 2) +
        power((v_end->>'y')::numeric - (v_start->>'y')::numeric, 2)
      ))::integer,
      (p_plan->>'clearHeightMm')::integer,
      100,
      jsonb_build_object('source', 'cad', 'wallIndex', v_index),
      'new',
      'confirmed'
    )
    returning id into v_wall_id;
    v_wall_ids := array_append(v_wall_ids, v_wall_id);
  end loop;

  for v_component in
    select value from jsonb_array_elements(coalesce(p_plan->'components', '[]'::jsonb))
  loop
    v_kind := v_component->>'kind';
    v_index := (v_component->>'wallIndex')::integer;
    if v_index < 0 or v_index >= v_vertex_count then
      raise exception using errcode = '22023', message = 'CAD component references an unknown wall';
    end if;
    v_host_wall := v_wall_ids[v_index + 1];
    v_default_width := case v_kind when 'door' then 900 when 'window' then 1200 else 100 end;
    v_default_height := case v_kind when 'door' then 2100 when 'window' then 1000 else 100 end;
    v_default_elevation := case
      when v_kind = 'light' then greatest(100, (p_plan->>'clearHeightMm')::integer - 200)
      when v_kind = 'socket' then 350
      when v_kind = 'switch' then 1100
      when v_kind in ('cold_water', 'hot_water') then 600
      when v_kind = 'drain' then 150
      else 0
    end;

    insert into public.building_elements (
      project_id, space_id, host_element_id, host_face, created_by,
      name, kind, position_x_mm, position_y_mm, position_z_mm,
      rotation_z_millidegrees, width_mm, height_mm, depth_mm,
      specification, lifecycle, confirmation
    )
    select
      v_project_id,
      v_space_id,
      v_host_wall,
      'interior',
      v_user_id,
      v_kind,
      case when v_kind in ('door', 'window') then v_kind::public.building_element_kind
        else 'terminal'::public.building_element_kind end,
      (v_component->'point'->>'x')::integer,
      (v_component->'point'->>'y')::integer,
      coalesce((v_component->>'elevationMm')::integer, v_default_elevation),
      rotation_z_millidegrees,
      coalesce((v_component->>'widthMm')::integer, v_default_width),
      coalesce((v_component->>'heightMm')::integer, v_default_height),
      case when v_kind in ('door', 'window') then 100 else 50 end,
      jsonb_build_object('source', 'cad', 'terminalKind', v_kind),
      'new',
      'confirmed'
    from public.building_elements
    where id = v_host_wall and project_id = v_project_id;
  end loop;

  return query select v_space_id, v_updated_at;
end;
$$;

revoke all on function public.save_cad_plan(jsonb, uuid) from public, anon;
grant execute on function public.save_cad_plan(jsonb, uuid) to authenticated;

comment on function public.save_cad_plan(jsonb, uuid) is
  'Atomically creates or replaces one validated CAD space while preserving RLS.';
