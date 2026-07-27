/*
 * Purpose: persist the unified building, technical-system and work models
 * without removing the legacy room/surface flow.
 * Security: all exposed tables inherit project access through RLS.
 */
create type public.geometry_confirmation as enum ('estimated', 'confirmed');
create type public.geometry_source as enum ('manual', 'plan', 'scan', 'import');
create type public.space_footprint_kind as enum ('rectangle', 'polygon');
create type public.building_space_kind as enum (
  'bathroom',
  'kitchen',
  'bedroom',
  'living_room',
  'hallway',
  'utility',
  'exterior',
  'other'
);
create type public.building_element_kind as enum (
  'wall',
  'floor',
  'ceiling',
  'roof',
  'door',
  'window',
  'opening',
  'column',
  'beam',
  'lining',
  'fixture',
  'equipment',
  'terminal',
  'other'
);
create type public.element_host_face as enum ('interior', 'exterior', 'top', 'bottom', 'axis');
create type public.element_lifecycle as enum ('existing', 'to_remove', 'new', 'modified');
create type public.technical_system_kind as enum (
  'electrical',
  'lighting_control',
  'cold_water',
  'hot_water',
  'drainage',
  'ventilation',
  'heating',
  'cooling',
  'data',
  'other'
);
create type public.technical_system_status as enum (
  'draft',
  'confirmed',
  'installed',
  'tested',
  'commissioned'
);
create type public.system_element_role as enum ('source', 'terminal', 'intermediate');
create type public.work_trade as enum (
  'demolition',
  'masonry',
  'waterproofing',
  'electrical',
  'lighting',
  'plumbing',
  'drainage',
  'ventilation',
  'climate',
  'joinery',
  'finishes',
  'painting',
  'coordination'
);
create type public.work_status as enum (
  'draft',
  'confirmed',
  'ready',
  'in_progress',
  'installed',
  'tested',
  'accepted',
  'blocked',
  'cancelled'
);

create function private.is_valid_polygon_vertices(vertices jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    jsonb_typeof(vertices) = 'array'
    and jsonb_array_length(vertices) between 3 and 1000
    and not exists (
      select 1
      from jsonb_array_elements(vertices) as vertex
      where jsonb_typeof(vertex) <> 'object'
        or jsonb_typeof(vertex -> 'x') <> 'number'
        or jsonb_typeof(vertex -> 'y') <> 'number'
        or (vertex ->> 'x') !~ '^-?[0-9]+$'
        or (vertex ->> 'y') !~ '^-?[0-9]+$'
    )
$$;

revoke all on function private.is_valid_polygon_vertices(jsonb) from public, anon, authenticated;

create table public.building_levels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  elevation_mm integer not null check (elevation_mm between -100000 and 1000000),
  display_order integer not null check (display_order between -1000 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  unique (project_id, display_order)
);

create table public.building_spaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  level_id uuid not null,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  kind public.building_space_kind not null,
  footprint_kind public.space_footprint_kind not null,
  rectangle_width_mm integer,
  rectangle_depth_mm integer,
  polygon_vertices jsonb,
  clear_height_mm integer not null check (clear_height_mm between 100 and 20000),
  origin_x_mm integer not null default 0,
  origin_y_mm integer not null default 0,
  origin_z_mm integer not null default 0,
  rotation_z_millidegrees integer not null default 0,
  geometry_source public.geometry_source not null,
  confirmation public.geometry_confirmation not null default 'estimated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (level_id, project_id)
    references public.building_levels(id, project_id) on delete cascade,
  constraint building_spaces_rectangle_shape check (
    footprint_kind <> 'rectangle'
    or (
      rectangle_width_mm between 100 and 100000
      and rectangle_depth_mm between 100 and 100000
      and polygon_vertices is null
    )
  ),
  constraint building_spaces_polygon_shape check (
    footprint_kind <> 'polygon'
    or (
      rectangle_width_mm is null
      and rectangle_depth_mm is null
      and private.is_valid_polygon_vertices(polygon_vertices)
    )
  )
);

create table public.building_elements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  space_id uuid not null,
  host_element_id uuid,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  kind public.building_element_kind not null,
  host_face public.element_host_face,
  position_x_mm integer not null default 0,
  position_y_mm integer not null default 0,
  position_z_mm integer not null default 0,
  rotation_x_millidegrees integer not null default 0,
  rotation_y_millidegrees integer not null default 0,
  rotation_z_millidegrees integer not null default 0,
  width_mm integer not null check (width_mm between 1 and 100000),
  height_mm integer not null check (height_mm between 1 and 100000),
  depth_mm integer not null check (depth_mm between 0 and 100000),
  specification jsonb not null default '{}'::jsonb
    check (jsonb_typeof(specification) = 'object'),
  lifecycle public.element_lifecycle not null,
  confirmation public.geometry_confirmation not null default 'estimated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (space_id, project_id)
    references public.building_spaces(id, project_id) on delete cascade,
  foreign key (host_element_id, project_id)
    references public.building_elements(id, project_id) on delete restrict,
  constraint building_elements_host_metadata check (
    (host_element_id is null and host_face is null)
    or (host_element_id is not null and host_face is not null)
  ),
  constraint building_elements_not_self_hosted check (host_element_id is null or host_element_id <> id)
);

create table public.technical_systems (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  kind public.technical_system_kind not null,
  status public.technical_system_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);

create table public.technical_system_elements (
  project_id uuid not null references public.projects(id) on delete cascade,
  system_id uuid not null,
  element_id uuid not null,
  role public.system_element_role not null,
  created_at timestamptz not null default now(),
  primary key (system_id, element_id),
  foreign key (system_id, project_id)
    references public.technical_systems(id, project_id) on delete cascade,
  foreign key (element_id, project_id)
    references public.building_elements(id, project_id) on delete cascade
);

create table public.system_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  system_id uuid not null,
  from_element_id uuid not null,
  to_element_id uuid not null,
  created_by uuid not null references auth.users(id),
  specification jsonb not null default '{}'::jsonb
    check (jsonb_typeof(specification) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (system_id, project_id)
    references public.technical_systems(id, project_id) on delete cascade,
  foreign key (from_element_id, project_id)
    references public.building_elements(id, project_id) on delete restrict,
  foreign key (to_element_id, project_id)
    references public.building_elements(id, project_id) on delete restrict,
  constraint system_connections_distinct_ends check (from_element_id <> to_element_id)
);

create table public.system_connection_points (
  connection_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  point_order integer not null check (point_order between 0 and 100000),
  x_mm integer not null,
  y_mm integer not null,
  z_mm integer not null,
  primary key (connection_id, point_order),
  foreign key (connection_id, project_id)
    references public.system_connections(id, project_id) on delete cascade
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  trade public.work_trade not null,
  title text not null check (char_length(title) between 2 and 160),
  status public.work_status not null default 'draft',
  rule_version_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  constraint work_items_rule_versions_clean check (
    array_position(rule_version_ids, null) is null
    and cardinality(rule_version_ids) <= 100
  )
);

create table public.work_item_targets (
  work_item_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  level_id uuid,
  space_id uuid,
  element_id uuid,
  created_at timestamptz not null default now(),
  foreign key (work_item_id, project_id)
    references public.work_items(id, project_id) on delete cascade,
  foreign key (level_id, project_id)
    references public.building_levels(id, project_id) on delete cascade,
  foreign key (space_id, project_id)
    references public.building_spaces(id, project_id) on delete cascade,
  foreign key (element_id, project_id)
    references public.building_elements(id, project_id) on delete cascade,
  constraint work_item_targets_exactly_one_target check (
    num_nonnulls(level_id, space_id, element_id) = 1
  )
);

create unique index work_item_targets_level_unique
  on public.work_item_targets(work_item_id, level_id)
  where level_id is not null;
create unique index work_item_targets_space_unique
  on public.work_item_targets(work_item_id, space_id)
  where space_id is not null;
create unique index work_item_targets_element_unique
  on public.work_item_targets(work_item_id, element_id)
  where element_id is not null;

create table public.work_dependencies (
  project_id uuid not null references public.projects(id) on delete cascade,
  predecessor_id uuid not null,
  successor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (predecessor_id, successor_id),
  foreign key (predecessor_id, project_id)
    references public.work_items(id, project_id) on delete cascade,
  foreign key (successor_id, project_id)
    references public.work_items(id, project_id) on delete cascade,
  constraint work_dependencies_not_self check (predecessor_id <> successor_id)
);

create function private.enforce_work_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (case old.status
    when 'draft' then new.status in ('confirmed', 'cancelled')
    when 'confirmed' then new.status in ('ready', 'blocked', 'cancelled')
    when 'ready' then new.status in ('in_progress', 'blocked', 'cancelled')
    when 'in_progress' then new.status in ('installed', 'blocked', 'cancelled')
    when 'installed' then new.status in ('tested', 'blocked')
    when 'tested' then new.status in ('accepted', 'blocked')
    when 'accepted' then false
    when 'blocked' then new.status in (
      'confirmed', 'ready', 'in_progress', 'installed', 'cancelled'
    )
    when 'cancelled' then false
  end) then
    raise exception using
      errcode = '23514',
      message = format('invalid work status transition: %s -> %s', old.status, new.status);
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_work_status_transition() from public, anon, authenticated;

create index building_levels_project_order_idx
  on public.building_levels(project_id, display_order);
create index building_spaces_level_idx on public.building_spaces(level_id);
create index building_elements_space_kind_idx on public.building_elements(space_id, kind);
create index building_elements_host_idx
  on public.building_elements(host_element_id) where host_element_id is not null;
create index technical_systems_project_kind_idx
  on public.technical_systems(project_id, kind);
create index technical_system_elements_element_idx
  on public.technical_system_elements(element_id);
create index system_connections_system_idx on public.system_connections(system_id);
create index work_items_project_status_idx on public.work_items(project_id, status);
create index work_item_targets_space_idx
  on public.work_item_targets(space_id) where space_id is not null;
create index work_item_targets_element_idx
  on public.work_item_targets(element_id) where element_id is not null;
create index work_dependencies_successor_idx on public.work_dependencies(successor_id);

alter table public.building_levels enable row level security;
alter table public.building_spaces enable row level security;
alter table public.building_elements enable row level security;
alter table public.technical_systems enable row level security;
alter table public.technical_system_elements enable row level security;
alter table public.system_connections enable row level security;
alter table public.system_connection_points enable row level security;
alter table public.work_items enable row level security;
alter table public.work_item_targets enable row level security;
alter table public.work_dependencies enable row level security;

create policy "building_levels_select_members" on public.building_levels
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "building_levels_insert_admins" on public.building_levels
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "building_levels_update_admins" on public.building_levels
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "building_levels_delete_admins" on public.building_levels
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "building_spaces_select_members" on public.building_spaces
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "building_spaces_insert_admins" on public.building_spaces
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "building_spaces_update_admins" on public.building_spaces
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "building_spaces_delete_admins" on public.building_spaces
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "building_elements_select_members" on public.building_elements
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "building_elements_insert_admins" on public.building_elements
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "building_elements_update_admins" on public.building_elements
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "building_elements_delete_admins" on public.building_elements
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "technical_systems_select_members" on public.technical_systems
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "technical_systems_insert_admins" on public.technical_systems
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "technical_systems_update_admins" on public.technical_systems
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "technical_systems_delete_admins" on public.technical_systems
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "technical_system_elements_select_members" on public.technical_system_elements
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "technical_system_elements_insert_admins" on public.technical_system_elements
for insert to authenticated
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "technical_system_elements_update_admins" on public.technical_system_elements
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "technical_system_elements_delete_admins" on public.technical_system_elements
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "system_connections_select_members" on public.system_connections
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "system_connections_insert_admins" on public.system_connections
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "system_connections_update_admins" on public.system_connections
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "system_connections_delete_admins" on public.system_connections
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "system_connection_points_select_members" on public.system_connection_points
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "system_connection_points_insert_admins" on public.system_connection_points
for insert to authenticated
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "system_connection_points_update_admins" on public.system_connection_points
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "system_connection_points_delete_admins" on public.system_connection_points
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "work_items_select_members" on public.work_items
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "work_items_insert_admins" on public.work_items
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "work_items_update_admins" on public.work_items
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "work_items_delete_admins" on public.work_items
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "work_item_targets_select_members" on public.work_item_targets
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "work_item_targets_insert_admins" on public.work_item_targets
for insert to authenticated
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "work_item_targets_update_admins" on public.work_item_targets
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "work_item_targets_delete_admins" on public.work_item_targets
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "work_dependencies_select_members" on public.work_dependencies
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "work_dependencies_insert_admins" on public.work_dependencies
for insert to authenticated
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "work_dependencies_update_admins" on public.work_dependencies
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "work_dependencies_delete_admins" on public.work_dependencies
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create trigger building_levels_set_updated_at
before update on public.building_levels
for each row execute function private.set_updated_at();
create trigger building_spaces_set_updated_at
before update on public.building_spaces
for each row execute function private.set_updated_at();
create trigger building_elements_set_updated_at
before update on public.building_elements
for each row execute function private.set_updated_at();
create trigger technical_systems_set_updated_at
before update on public.technical_systems
for each row execute function private.set_updated_at();
create trigger system_connections_set_updated_at
before update on public.system_connections
for each row execute function private.set_updated_at();
create trigger work_items_set_updated_at
before update on public.work_items
for each row execute function private.set_updated_at();
create trigger work_items_enforce_status_transition
before update of status on public.work_items
for each row execute function private.enforce_work_status_transition();

grant select, insert, update, delete on public.building_levels to authenticated;
grant select, insert, update, delete on public.building_spaces to authenticated;
grant select, insert, update, delete on public.building_elements to authenticated;
grant select, insert, update, delete on public.technical_systems to authenticated;
grant select, insert, update, delete on public.technical_system_elements to authenticated;
grant select, insert, update, delete on public.system_connections to authenticated;
grant select, insert, update, delete on public.system_connection_points to authenticated;
grant select, insert, update, delete on public.work_items to authenticated;
grant select, insert, update, delete on public.work_item_targets to authenticated;
grant select, insert, update, delete on public.work_dependencies to authenticated;
