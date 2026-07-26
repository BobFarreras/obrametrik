begin;
select plan(3);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '22222222-2222-4222-8222-222222222222',
  'measurements@example.com',
  '{"display_name":"Mesures Test"}'::jsonb
);

insert into public.projects (id, organization_id, created_by, name)
select
  '33333333-3333-4333-8333-333333333333',
  id,
  '22222222-2222-4222-8222-222222222222',
  'Bany'
from public.organizations
where created_by = '22222222-2222-4222-8222-222222222222';

insert into public.rooms (id, project_id, created_by, name)
values (
  '44444444-4444-4444-8444-444444444444',
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  'Bany principal'
);

insert into public.surfaces (id, room_id, created_by, name, kind, width_m, height_m)
values (
  '55555555-5555-4555-8555-555555555555',
  '44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',
  'Paret nord',
  'wall',
  4,
  2.5
);

insert into public.measurements (surface_id, created_by, label, operation, width_m, height_m)
values (
  '55555555-5555-4555-8555-555555555555',
  '22222222-2222-4222-8222-222222222222',
  'Porta',
  'subtract',
  0.8,
  2
);

select is(
  (select gross_area_m2 from public.surfaces where id = '55555555-5555-4555-8555-555555555555'),
  10.0000::numeric,
  'surface gross area is generated deterministically'
);
select is(
  (select area_m2 from public.measurements where surface_id = '55555555-5555-4555-8555-555555555555'),
  1.6000::numeric,
  'measurement area is generated deterministically'
);
select is(
  (
    select s.gross_area_m2 - sum(m.area_m2)
    from public.surfaces s
    join public.measurements m on m.surface_id = s.id
    where s.id = '55555555-5555-4555-8555-555555555555'
    group by s.gross_area_m2
  ),
  8.4000::numeric,
  'opening is auditable as a separate deduction'
);

select * from finish();
rollback;
