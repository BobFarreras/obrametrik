begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '11111111-1111-4111-8111-111111111111',
  'anna@example.com',
  '{"display_name":"Anna Obres","preferred_locale":"es"}'::jsonb
);

select is(
  (select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Anna Obres',
  'signup provisions the profile'
);
select is(
  (select preferred_locale::text from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'es',
  'signup preserves a supported locale'
);
select is(
  (select count(*)::integer from public.organizations where created_by = '11111111-1111-4111-8111-111111111111'),
  1,
  'signup provisions one personal organization'
);
select is(
  (
    select role::text
    from public.organization_members
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  'owner',
  'the new user owns the personal organization'
);
select matches(
  (
    select slug
    from public.organizations
    where created_by = '11111111-1111-4111-8111-111111111111'
  ),
  '^personal-[a-f0-9]{32}$',
  'personal organization slug is valid and collision resistant'
);

select * from finish();
rollback;
