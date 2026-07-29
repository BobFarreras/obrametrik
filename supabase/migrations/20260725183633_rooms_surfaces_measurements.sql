/*
 * Purpose: model the first auditable measurement flow: room, surface and adjustment.
 * Security: reads follow project membership; mutations require owner/admin membership.
 */
create type public.surface_kind as enum ('wall', 'floor', 'ceiling', 'other');
create type public.measurement_operation as enum ('add', 'subtract');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.surfaces (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 2 and 120),
  kind public.surface_kind not null,
  width_m numeric(10,3) not null check (width_m > 0 and width_m <= 10000),
  height_m numeric(10,3) not null check (height_m > 0 and height_m <= 10000),
  gross_area_m2 numeric(16,4) generated always as (width_m * height_m) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  surface_id uuid not null references public.surfaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  label text not null check (char_length(label) between 2 and 120),
  operation public.measurement_operation not null default 'subtract',
  width_m numeric(10,3) not null check (width_m > 0 and width_m <= 10000),
  height_m numeric(10,3) not null check (height_m > 0 and height_m <= 10000),
  area_m2 numeric(16,4) generated always as (width_m * height_m) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_project_id_created_at_idx on public.rooms(project_id, created_at);
create index surfaces_room_id_created_at_idx on public.surfaces(room_id, created_at);
create index measurements_surface_id_created_at_idx on public.measurements(surface_id, created_at);

create function private.can_access_project(target_project_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and (select private.is_organization_member(organization_id, target_user_id))
  )
$$;

create function private.can_manage_project(target_project_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and (select private.has_organization_role(
        organization_id,
        target_user_id,
        array['owner', 'admin']::public.organization_role[]
      ))
  )
$$;

create function private.can_access_room(target_room_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.rooms
    where id = target_room_id
      and (select private.can_access_project(project_id, target_user_id))
  )
$$;

create function private.can_manage_room(target_room_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.rooms
    where id = target_room_id
      and (select private.can_manage_project(project_id, target_user_id))
  )
$$;

create function private.can_access_surface(target_surface_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.surfaces
    where id = target_surface_id
      and (select private.can_access_room(room_id, target_user_id))
  )
$$;

create function private.can_manage_surface(target_surface_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.surfaces
    where id = target_surface_id
      and (select private.can_manage_room(room_id, target_user_id))
  )
$$;

alter table public.rooms enable row level security;
alter table public.surfaces enable row level security;
alter table public.measurements enable row level security;

create policy "rooms_select_members" on public.rooms for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "rooms_insert_admins" on public.rooms for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.can_manage_project(project_id, (select auth.uid()))));
create policy "rooms_update_admins" on public.rooms for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "rooms_delete_admins" on public.rooms for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "surfaces_select_members" on public.surfaces for select to authenticated
using ((select private.can_access_room(room_id, (select auth.uid()))));
create policy "surfaces_insert_admins" on public.surfaces for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.can_manage_room(room_id, (select auth.uid()))));
create policy "surfaces_update_admins" on public.surfaces for update to authenticated
using ((select private.can_manage_room(room_id, (select auth.uid()))))
with check ((select private.can_manage_room(room_id, (select auth.uid()))));
create policy "surfaces_delete_admins" on public.surfaces for delete to authenticated
using ((select private.can_manage_room(room_id, (select auth.uid()))));

create policy "measurements_select_members" on public.measurements for select to authenticated
using ((select private.can_access_surface(surface_id, (select auth.uid()))));
create policy "measurements_insert_admins" on public.measurements for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.can_manage_surface(surface_id, (select auth.uid()))));
create policy "measurements_update_admins" on public.measurements for update to authenticated
using ((select private.can_manage_surface(surface_id, (select auth.uid()))))
with check ((select private.can_manage_surface(surface_id, (select auth.uid()))));
create policy "measurements_delete_admins" on public.measurements for delete to authenticated
using ((select private.can_manage_surface(surface_id, (select auth.uid()))));

create trigger rooms_set_updated_at before update on public.rooms
for each row execute function private.set_updated_at();
create trigger surfaces_set_updated_at before update on public.surfaces
for each row execute function private.set_updated_at();
create trigger measurements_set_updated_at before update on public.measurements
for each row execute function private.set_updated_at();

grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.surfaces to authenticated;
grant select, insert, update, delete on public.measurements to authenticated;
