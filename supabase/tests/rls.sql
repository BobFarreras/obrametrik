begin;
select plan(4);
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass), 'organizations has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.organization_members'::regclass), 'memberships has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), 'projects has RLS');
select * from finish();
rollback;
