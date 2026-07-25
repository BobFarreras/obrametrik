/*
 * File: supabase/migrations/202607250001_initial_identity_and_projects.sql
 * Purpose: Creates profiles, organizations, memberships and projects.
 * Security: RLS scopes all access to the authenticated user and memberships.
 */
create type public.app_locale as enum ('ca', 'es', 'en');
create type public.organization_role as enum ('owner', 'admin', 'member');
create type public.project_status as enum ('draft', 'active', 'completed', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_url text,
  preferred_locale public.app_locale not null default 'ca',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 2 and 120),
  status public.project_status not null default 'draft',
  description text check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organization_members_user_id_idx on public.organization_members(user_id);
create index projects_organization_id_created_at_idx on public.projects(organization_id, created_at desc);

create schema private;
revoke all on schema private from public, anon, authenticated;

create function private.is_organization_member(target_organization_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.organization_members
  where organization_id = target_organization_id and user_id = target_user_id
) $$;

create function private.has_organization_role(target_organization_id uuid, target_user_id uuid, accepted_roles public.organization_role[])
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.organization_members
  where organization_id = target_organization_id and user_id = target_user_id and role = any(accepted_roles)
) $$;

create function private.add_organization_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;
create trigger organizations_add_owner
after insert on public.organizations for each row execute function private.add_organization_owner();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_self" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "organizations_select_members" on public.organizations for select to authenticated using (
  (select private.is_organization_member(id, (select auth.uid())))
);
create policy "organizations_insert_owner" on public.organizations for insert to authenticated with check (created_by = (select auth.uid()));
create policy "members_select_same_org" on public.organization_members for select to authenticated using (
  (select private.is_organization_member(organization_id, (select auth.uid())))
);
create policy "projects_select_members" on public.projects for select to authenticated using (
  (select private.is_organization_member(projects.organization_id, (select auth.uid())))
);
create policy "projects_insert_members" on public.projects for insert to authenticated with check (
  created_by = (select auth.uid()) and (select private.is_organization_member(projects.organization_id, (select auth.uid())))
);
create policy "projects_update_admins" on public.projects for update to authenticated using (
  (select private.has_organization_role(projects.organization_id, (select auth.uid()), array['owner', 'admin']::public.organization_role[]))
) with check (
  (select private.has_organization_role(projects.organization_id, (select auth.uid()), array['owner', 'admin']::public.organization_role[]))
);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select, insert, update on public.projects to authenticated;
