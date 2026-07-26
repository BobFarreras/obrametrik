begin;
select plan(9);
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass), 'organizations has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.organization_members'::regclass), 'memberships has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), 'projects has RLS');
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_delete_admins'),
  'project deletion is protected by an explicit RLS policy'
);
select ok((select relrowsecurity from pg_class where oid = 'public.rooms'::regclass), 'rooms has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.surfaces'::regclass), 'surfaces has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.measurements'::regclass), 'measurements has RLS');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.surface_work_scopes'::regclass),
  'surface work scopes have RLS'
);
select * from finish();
rollback;
