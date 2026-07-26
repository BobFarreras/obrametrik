/*
 * Purpose: store confirmed existing conditions and desired work per surface.
 * Security: every row inherits project membership through its surface and RLS.
 */
create type public.existing_surface_finish as enum (
  'paint', 'tile', 'plaster', 'drywall', 'concrete', 'wood', 'unknown', 'other'
);
create type public.surface_condition as enum (
  'good', 'minor_damage', 'damaged', 'damp', 'unknown'
);
create type public.water_exposure as enum ('dry', 'occasional', 'wet');
create type public.surface_work_type as enum (
  'paint', 'tile', 'plaster', 'wallpaper', 'repair',
  'waterproof', 'replace', 'leave_as_is', 'other'
);

create table public.surface_work_scopes (
  id uuid primary key default gen_random_uuid(),
  surface_id uuid not null unique references public.surfaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  existing_finish public.existing_surface_finish not null,
  condition public.surface_condition not null,
  water_exposure public.water_exposure not null default 'dry',
  remove_existing boolean not null default false,
  desired_works public.surface_work_type[] not null,
  notes text check (char_length(notes) <= 1000),
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint surface_work_scopes_desired_works_not_empty
    check (cardinality(desired_works) between 1 and 9),
  constraint surface_work_scopes_leave_as_is_exclusive
    check (
      not ('leave_as_is' = any(desired_works))
      or cardinality(desired_works) = 1
    )
);

alter table public.surface_work_scopes enable row level security;

create policy "surface_work_scopes_select_members"
on public.surface_work_scopes for select to authenticated
using ((select private.can_access_surface(surface_id, (select auth.uid()))));

create policy "surface_work_scopes_insert_admins"
on public.surface_work_scopes for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_surface(surface_id, (select auth.uid())))
);

create policy "surface_work_scopes_update_admins"
on public.surface_work_scopes for update to authenticated
using ((select private.can_manage_surface(surface_id, (select auth.uid()))))
with check (
  (select private.can_manage_surface(surface_id, (select auth.uid())))
);

create policy "surface_work_scopes_delete_admins"
on public.surface_work_scopes for delete to authenticated
using ((select private.can_manage_surface(surface_id, (select auth.uid()))));

create trigger surface_work_scopes_set_updated_at
before update on public.surface_work_scopes
for each row execute function private.set_updated_at();

grant select, insert, update, delete on public.surface_work_scopes to authenticated;
