begin;
select plan(9);

select has_function(
  'public',
  'save_cad_plan',
  array['jsonb', 'uuid'],
  'atomic CAD save function exists'
);

select function_lang_is(
  'public',
  'save_cad_plan',
  array['jsonb', 'uuid'],
  'plpgsql',
  'atomic CAD save uses PostgreSQL transaction semantics'
);

select ok(
  has_function_privilege('authenticated', 'public.save_cad_plan(jsonb, uuid)', 'execute'),
  'authenticated users can save CAD plans'
);

select ok(
  not has_function_privilege('anon', 'public.save_cad_plan(jsonb, uuid)', 'execute'),
  'anonymous users cannot save CAD plans'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '12121212-1212-4121-8121-121212121212',
  'cad-save@example.com',
  '{"display_name":"CAD Save"}'::jsonb
);

insert into public.projects (id, organization_id, created_by, name)
select
  '34343434-3434-4343-8343-343434343434',
  id,
  '12121212-1212-4121-8121-121212121212',
  'Atomic CAD'
from public.organizations
where created_by = '12121212-1212-4121-8121-121212121212';

set local role authenticated;
select set_config('request.jwt.claim.sub', '12121212-1212-4121-8121-121212121212', true);

select lives_ok(
  $$
    select * from public.save_cad_plan(
      '{"projectId":"34343434-3434-4343-8343-343434343434","name":"Bany","kind":"bathroom","vertices":[{"x":0,"y":0},{"x":3000,"y":0},{"x":3000,"y":2000},{"x":0,"y":2000}],"clearHeightMm":2500,"components":[{"kind":"door","point":{"x":1500,"y":0},"wallIndex":0,"swing":"right_out","variant":"sliding"}]}'::jsonb,
      null
    )
  $$,
  'a project owner can create a complete CAD plan'
);

select is(
  (
    select specification->>'doorSwing'
    from public.building_elements
    where project_id = '34343434-3434-4343-8343-343434343434'
      and kind = 'door'
  ),
  'right_out',
  'door swing is validated and persisted with the shared CAD model'
);

select is(
  (
    select specification->>'componentVariant'
    from public.building_elements
    where project_id = '34343434-3434-4343-8343-343434343434'
      and kind = 'door'
  ),
  'sliding',
  'component variant is validated and persisted with the shared CAD model'
);

select lives_ok(
  $$
    select * from public.save_cad_plan(
      '{"projectId":"34343434-3434-4343-8343-343434343434","name":"Bany actualitzat","kind":"bathroom","vertices":[{"x":0,"y":0},{"x":4000,"y":0},{"x":4000,"y":2000},{"x":0,"y":2000}],"clearHeightMm":2600,"components":[]}'::jsonb,
      (select id from public.building_spaces where project_id = '34343434-3434-4343-8343-343434343434')
    )
  $$,
  'saving an existing CAD plan replaces it atomically'
);

select is(
  (select count(*)::integer from public.building_spaces where project_id = '34343434-3434-4343-8343-343434343434'),
  1,
  'updating preserves one stable space instead of creating a duplicate'
);

select * from finish();
rollback;
