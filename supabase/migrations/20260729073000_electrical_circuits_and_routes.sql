/*
 * Purpose: persist explicit electrical circuits, terminal assignments and
 * measured physical routes. Quantities remain derived by the calculation engine.
 */

create table public.electrical_circuits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  code text not null check (code in ('C1', 'C2', 'C3', 'C4', 'C5', 'C10', 'C11')),
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id)
);

create table public.electrical_circuit_terminals (
  project_id uuid not null references public.projects(id) on delete cascade,
  circuit_id uuid not null,
  terminal_element_id uuid not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (project_id, terminal_element_id),
  foreign key (project_id, circuit_id)
    references public.electrical_circuits(project_id, id) on delete cascade,
  foreign key (terminal_element_id, project_id)
    references public.building_elements(id, project_id) on delete cascade
);

create table public.electrical_route_segments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  circuit_id uuid not null,
  space_id uuid not null,
  name text not null check (length(name) between 1 and 100),
  route_role text not null check (
    route_role in (
      'distribution', 'light_feed', 'switch_feed',
      'switch_return', 'travellers', 'control'
    )
  ),
  path jsonb not null check (
    jsonb_typeof(path) = 'array'
    and jsonb_array_length(path) >= 2
  ),
  length_mm integer not null check (length_mm > 0 and length_mm <= 1000000),
  conductor_configuration jsonb not null check (
    jsonb_typeof(conductor_configuration) = 'array'
    and jsonb_array_length(conductor_configuration) > 0
  ),
  conduit_system text not null check (
    conduit_system in ('embedded-tube', 'surface-tube', 'trunking')
  ),
  conduit_diameter_mm numeric(6, 2) not null check (conduit_diameter_mm > 0),
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, circuit_id)
    references public.electrical_circuits(project_id, id) on delete cascade,
  foreign key (space_id, project_id)
    references public.building_spaces(id, project_id) on delete cascade
);

create table public.electrical_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  circuit_id uuid not null,
  load_terminal_id uuid not null,
  topology text not null check (
    topology in ('continuous', 'simple', 'two_way', 'intermediate', 'push_button')
  ),
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id),
  unique (project_id, load_terminal_id),
  foreign key (project_id, circuit_id)
    references public.electrical_circuits(project_id, id) on delete cascade,
  foreign key (load_terminal_id, project_id)
    references public.building_elements(id, project_id) on delete cascade
);

create table public.electrical_connection_controls (
  project_id uuid not null references public.projects(id) on delete cascade,
  connection_id uuid not null,
  control_terminal_id uuid not null,
  sequence integer not null check (sequence >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (project_id, connection_id, control_terminal_id),
  unique (project_id, connection_id, sequence),
  foreign key (project_id, connection_id)
    references public.electrical_connections(project_id, id) on delete cascade,
  foreign key (control_terminal_id, project_id)
    references public.building_elements(id, project_id) on delete cascade
);

create index electrical_circuits_project_idx
on public.electrical_circuits(project_id, created_at);
create index electrical_circuit_terminals_circuit_idx
on public.electrical_circuit_terminals(project_id, circuit_id);
create index electrical_route_segments_circuit_idx
on public.electrical_route_segments(project_id, circuit_id, created_at);
create index electrical_connections_circuit_idx
on public.electrical_connections(project_id, circuit_id);
create index electrical_connection_controls_connection_idx
on public.electrical_connection_controls(project_id, connection_id, sequence);

alter table public.electrical_circuits enable row level security;
alter table public.electrical_circuit_terminals enable row level security;
alter table public.electrical_route_segments enable row level security;
alter table public.electrical_connections enable row level security;
alter table public.electrical_connection_controls enable row level security;

create policy "electrical_circuits_select_members" on public.electrical_circuits
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "electrical_circuits_insert_admins" on public.electrical_circuits
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "electrical_circuits_update_admins" on public.electrical_circuits
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "electrical_circuits_delete_admins" on public.electrical_circuits
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "electrical_circuit_terminals_select_members"
on public.electrical_circuit_terminals
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "electrical_circuit_terminals_insert_admins"
on public.electrical_circuit_terminals
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "electrical_circuit_terminals_delete_admins"
on public.electrical_circuit_terminals
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "electrical_route_segments_select_members"
on public.electrical_route_segments
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "electrical_route_segments_insert_admins"
on public.electrical_route_segments
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "electrical_route_segments_update_admins"
on public.electrical_route_segments
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "electrical_route_segments_delete_admins"
on public.electrical_route_segments
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "electrical_connections_select_members" on public.electrical_connections
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "electrical_connections_insert_admins" on public.electrical_connections
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "electrical_connections_update_admins" on public.electrical_connections
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "electrical_connections_delete_admins" on public.electrical_connections
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "electrical_connection_controls_select_members"
on public.electrical_connection_controls
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "electrical_connection_controls_insert_admins"
on public.electrical_connection_controls
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "electrical_connection_controls_delete_admins"
on public.electrical_connection_controls
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create trigger electrical_circuits_set_updated_at
before update on public.electrical_circuits
for each row execute function private.set_updated_at();
create trigger electrical_route_segments_set_updated_at
before update on public.electrical_route_segments
for each row execute function private.set_updated_at();
create trigger electrical_connections_set_updated_at
before update on public.electrical_connections
for each row execute function private.set_updated_at();

grant select, insert, update, delete on public.electrical_circuits to authenticated;
grant select, insert, delete on public.electrical_circuit_terminals to authenticated;
grant select, insert, update, delete on public.electrical_route_segments to authenticated;
grant select, insert, update, delete on public.electrical_connections to authenticated;
grant select, insert, delete on public.electrical_connection_controls to authenticated;
