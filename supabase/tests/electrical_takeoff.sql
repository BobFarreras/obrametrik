begin;
select plan(11);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.takeoff_runs'::regclass),
  'takeoff runs have RLS'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.takeoff_lines'::regclass),
  'takeoff lines have RLS'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.shopping_list_items'::regclass),
  'shopping list items have RLS'
);
select ok(
  exists(
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'takeoff_runs_project_created_idx'
  ),
  'takeoff runs are indexed by project and creation time'
);
select throws_ok(
  $$
    insert into public.takeoff_lines (
      run_id, project_id, category_id, quantity_base, waste_factor,
      quantity_with_waste, purchase_quantity, unit, formula,
      calculation_rule_id, confidence, price_source
    )
    values (
      gen_random_uuid(), gen_random_uuid(), 'electrical.conductor',
      10, 1, 10, 10, 'm', 'formula', 'rule', 'confirmed', 'none'
    )
  $$,
  '23503',
  null,
  'a takeoff line must belong to an existing run and project'
);
select ok(
  exists(
    select 1
    from pg_constraint
    where conrelid = 'public.shopping_list_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%quantity >%'
  ),
  'shopping quantities have a positive database constraint'
);
select ok(
  exists(
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'takeoff_runs'
      and policyname = 'takeoff_runs_select_members'
  ),
  'takeoff reads require project membership'
);
select ok(
  exists(
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_items'
      and policyname = 'shopping_list_items_update_admins'
  ),
  'shopping list updates require project management permission'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10101010-1010-4010-8010-101010101010', 'takeoff-owner@example.com', '{}'),
  ('20202020-2020-4020-8020-202020202020', 'takeoff-outsider@example.com', '{}');

insert into public.projects (id, organization_id, created_by, name)
select
  '30303030-3030-4030-8030-303030303030',
  id,
  '10101010-1010-4010-8010-101010101010',
  'Electrical takeoff RLS'
from public.organizations
where created_by = '10101010-1010-4010-8010-101010101010';

insert into public.takeoff_runs (
  id, project_id, created_by, trade, status, rule_version, input_snapshot
)
values (
  '40404040-4040-4040-8040-404040404040',
  '30303030-3030-4030-8030-303030303030',
  '10101010-1010-4010-8010-101010101010',
  'electrical',
  'professional_review',
  'electrical-takeoff@1',
  '{}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20202020-2020-4020-8020-202020202020', true);

select is(
  (select count(*)::integer from public.takeoff_runs),
  0,
  'a user outside the project cannot read takeoff snapshots'
);
select throws_ok(
  $$
    insert into public.takeoff_runs (
      project_id, created_by, trade, status, rule_version, input_snapshot
    )
    values (
      '30303030-3030-4030-8030-303030303030',
      '20202020-2020-4020-8020-202020202020',
      'electrical',
      'professional_review',
      'electrical-takeoff@1',
      '{}'::jsonb
    )
  $$,
  '42501',
  null,
  'a user outside the project cannot create takeoff snapshots'
);

select set_config('request.jwt.claim.sub', '10101010-1010-4010-8010-101010101010', true);
select is(
  (select count(*)::integer from public.takeoff_runs),
  1,
  'the project owner can read the takeoff snapshot'
);
reset role;

select * from finish();
rollback;
