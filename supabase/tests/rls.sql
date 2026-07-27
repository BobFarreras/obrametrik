begin;
select plan(19);
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
select ok((select relrowsecurity from pg_class where oid = 'public.building_levels'::regclass), 'building levels have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.building_spaces'::regclass), 'building spaces have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.building_elements'::regclass), 'building elements have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.technical_systems'::regclass), 'technical systems have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.technical_system_elements'::regclass), 'technical system elements have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.system_connections'::regclass), 'system connections have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.system_connection_points'::regclass), 'connection points have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.work_items'::regclass), 'work items have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.work_item_targets'::regclass), 'work item targets have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.work_dependencies'::regclass), 'work dependencies have RLS');
select * from finish();
rollback;
