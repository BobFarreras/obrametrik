begin;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '66666666-6666-4666-8666-666666666666',
  'building-model@example.com',
  '{"display_name":"Building Model"}'::jsonb
);

insert into public.projects (id, organization_id, created_by, name)
select
  '77777777-7777-4777-8777-777777777777',
  id,
  '66666666-6666-4666-8666-666666666666',
  'Bany model unificat'
from public.organizations
where created_by = '66666666-6666-4666-8666-666666666666';

insert into public.building_levels (
  id, project_id, created_by, name, elevation_mm, display_order
)
values (
  '88888888-8888-4888-8888-888888888888',
  '77777777-7777-4777-8777-777777777777',
  '66666666-6666-4666-8666-666666666666',
  'Planta baixa',
  0,
  0
);

insert into public.building_spaces (
  id,
  project_id,
  level_id,
  created_by,
  name,
  kind,
  footprint_kind,
  polygon_vertices,
  clear_height_mm,
  geometry_source,
  confirmation
)
values (
  '99999999-9999-4999-8999-999999999999',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
  '66666666-6666-4666-8666-666666666666',
  'Bany en L',
  'bathroom',
  'polygon',
  '[{"x":0,"y":0},{"x":3000,"y":0},{"x":3000,"y":1800},{"x":1800,"y":1800},{"x":1800,"y":3000},{"x":0,"y":3000}]',
  2500,
  'manual',
  'confirmed'
);

select is(
  (
    select jsonb_array_length(polygon_vertices)
    from public.building_spaces
    where id = '99999999-9999-4999-8999-999999999999'
  ),
  6,
  'an L-shaped space preserves its six integer millimetre vertices'
);

select throws_ok(
  $$
    insert into public.building_spaces (
      project_id, level_id, created_by, name, kind, footprint_kind,
      polygon_vertices, clear_height_mm, geometry_source
    )
    values (
      '77777777-7777-4777-8777-777777777777',
      '88888888-8888-4888-8888-888888888888',
      '66666666-6666-4666-8666-666666666666',
      'Polígon invàlid',
      'other',
      'polygon',
      '[{"x":0,"y":0},{"x":1000,"y":0.5},{"x":0,"y":1000}]',
      2500,
      'manual'
    )
  $$,
  '23514',
  null,
  'polygon coordinates must be integer millimetres'
);

insert into public.building_elements (
  id,
  project_id,
  space_id,
  created_by,
  name,
  kind,
  width_mm,
  height_mm,
  depth_mm,
  lifecycle,
  confirmation
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '77777777-7777-4777-8777-777777777777',
  '99999999-9999-4999-8999-999999999999',
  '66666666-6666-4666-8666-666666666666',
  'Paret nord',
  'wall',
  3000,
  2500,
  100,
  'existing',
  'confirmed'
);

insert into public.building_elements (
  id,
  project_id,
  space_id,
  host_element_id,
  host_face,
  created_by,
  name,
  kind,
  position_x_mm,
  width_mm,
  height_mm,
  depth_mm,
  lifecycle,
  confirmation
)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '77777777-7777-4777-8777-777777777777',
  '99999999-9999-4999-8999-999999999999',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'interior',
  '66666666-6666-4666-8666-666666666666',
  'Finestra',
  'window',
  900,
  800,
  1000,
  100,
  'existing',
  'confirmed'
);

select is(
  (
    select host_element_id
    from public.building_elements
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'a window is hosted by one explicit wall'
);

select throws_ok(
  $$
    insert into public.building_elements (
      project_id, space_id, host_face, created_by, name, kind,
      width_mm, height_mm, depth_mm, lifecycle
    )
    values (
      '77777777-7777-4777-8777-777777777777',
      '99999999-9999-4999-8999-999999999999',
      'interior',
      '66666666-6666-4666-8666-666666666666',
      'Element sense host',
      'opening',
      800,
      2000,
      100,
      'new'
    )
  $$,
  '23514',
  null,
  'host face cannot exist without a host element'
);

insert into public.work_items (
  id, project_id, created_by, trade, title, status
)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '77777777-7777-4777-8777-777777777777',
  '66666666-6666-4666-8666-666666666666',
  'joinery',
  'Instal·lar finestra',
  'draft'
);

select throws_ok(
  $$
    update public.work_items
    set status = 'accepted'
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  $$,
  '23514',
  'invalid work status transition: draft -> accepted',
  'work cannot jump from draft to accepted'
);

update public.work_items set status = 'confirmed'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.work_items set status = 'ready'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.work_items set status = 'in_progress'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.work_items set status = 'installed'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.work_items set status = 'tested'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.work_items set status = 'accepted'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select is(
  (
    select status::text
    from public.work_items
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  'accepted',
  'work reaches acceptance through the complete lifecycle'
);

insert into public.work_item_targets (
  work_item_id, project_id, element_id
)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '77777777-7777-4777-8777-777777777777',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

select is(
  (
    select element_id
    from public.work_item_targets
    where work_item_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  'work targets the installed physical element'
);

select throws_ok(
  $$
    insert into public.work_item_targets (
      work_item_id, project_id, level_id, element_id
    )
    values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      '77777777-7777-4777-8777-777777777777',
      '88888888-8888-4888-8888-888888888888',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
  $$,
  '23514',
  null,
  'a work target references exactly one spatial entity'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'outside-building-model@example.com',
  '{"display_name":"Outside User"}'::jsonb
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  true
);

select is(
  (select count(*)::integer from public.building_levels),
  0,
  'a user outside the organization cannot read building levels'
);

select set_config(
  'request.jwt.claim.sub',
  '66666666-6666-4666-8666-666666666666',
  true
);

select is(
  (select count(*)::integer from public.building_levels),
  1,
  'the project owner can read the building levels'
);

reset role;

select * from finish();
rollback;
