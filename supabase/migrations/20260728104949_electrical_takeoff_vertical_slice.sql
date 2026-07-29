/*
 * Purpose: persist versioned electrical takeoff snapshots and user-controlled
 * shopping items without coupling calculations to retailer offers.
 * Security: project members can read; only project admins can mutate.
 */

create type public.takeoff_run_status as enum (
  'insufficient_data',
  'blocking',
  'professional_review',
  'confirmed'
);

create type public.price_source_kind as enum (
  'none',
  'orientation',
  'catalog',
  'offer'
);

create type public.takeoff_confidence as enum ('confirmed', 'estimated', 'pending');

create table public.takeoff_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  trade public.work_trade not null,
  status public.takeoff_run_status not null,
  rule_version text not null check (length(rule_version) between 1 and 100),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  created_at timestamptz not null default now()
);

create table public.takeoff_lines (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.takeoff_runs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id text not null check (length(category_id) between 1 and 120),
  specification jsonb not null default '{}'::jsonb
    check (jsonb_typeof(specification) = 'object'),
  source_entity_ids uuid[] not null default '{}',
  quantity_base numeric(14, 4) not null check (quantity_base >= 0),
  reserve_quantity numeric(14, 4) not null default 0 check (reserve_quantity >= 0),
  waste_factor numeric(8, 4) not null check (waste_factor >= 1),
  quantity_with_waste numeric(14, 4) not null check (quantity_with_waste >= 0),
  purchase_quantity numeric(14, 4) not null check (purchase_quantity >= 0),
  unit text not null check (unit in ('m', 'unit')),
  formula text not null check (length(formula) between 1 and 1000),
  calculation_rule_id text not null check (length(calculation_rule_id) between 1 and 120),
  source_ids text[] not null default '{}',
  assumptions jsonb not null default '[]'::jsonb check (jsonb_typeof(assumptions) = 'array'),
  confidence public.takeoff_confidence not null,
  price_source public.price_source_kind not null default 'none',
  price_low_cents numeric(14, 2) check (price_low_cents is null or price_low_cents >= 0),
  price_high_cents numeric(14, 2) check (price_high_cents is null or price_high_cents >= 0),
  price_checked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint takeoff_lines_price_range_valid check (
    (price_source = 'none' and price_low_cents is null and price_high_cents is null)
    or (
      price_source <> 'none'
      and price_low_cents is not null
      and price_high_cents is not null
      and price_high_cents >= price_low_cents
      and price_checked_at is not null
    )
  )
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  takeoff_line_id uuid references public.takeoff_lines(id) on delete set null,
  created_by uuid not null references auth.users(id),
  category_id text not null check (length(category_id) between 1 and 120),
  specification jsonb not null default '{}'::jsonb
    check (jsonb_typeof(specification) = 'object'),
  quantity numeric(14, 4) not null check (quantity > 0),
  unit text not null check (unit in ('m', 'unit')),
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index takeoff_runs_project_created_idx
on public.takeoff_runs(project_id, created_at desc);
create index takeoff_lines_project_run_idx
on public.takeoff_lines(project_id, run_id);
create index shopping_list_items_project_created_idx
on public.shopping_list_items(project_id, created_at);
alter table public.shopping_list_items
add constraint shopping_list_items_source_line_unique
unique (project_id, takeoff_line_id);

alter table public.takeoff_runs enable row level security;
alter table public.takeoff_lines enable row level security;
alter table public.shopping_list_items enable row level security;

create policy "takeoff_runs_select_members" on public.takeoff_runs
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "takeoff_runs_insert_admins" on public.takeoff_runs
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "takeoff_runs_delete_admins" on public.takeoff_runs
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "takeoff_lines_select_members" on public.takeoff_lines
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "takeoff_lines_insert_admins" on public.takeoff_lines
for insert to authenticated
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "takeoff_lines_delete_admins" on public.takeoff_lines
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create policy "shopping_list_items_select_members" on public.shopping_list_items
for select to authenticated
using ((select private.can_access_project(project_id, (select auth.uid()))));
create policy "shopping_list_items_insert_admins" on public.shopping_list_items
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_project(project_id, (select auth.uid())))
);
create policy "shopping_list_items_update_admins" on public.shopping_list_items
for update to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))))
with check ((select private.can_manage_project(project_id, (select auth.uid()))));
create policy "shopping_list_items_delete_admins" on public.shopping_list_items
for delete to authenticated
using ((select private.can_manage_project(project_id, (select auth.uid()))));

create trigger shopping_list_items_set_updated_at
before update on public.shopping_list_items
for each row execute function private.set_updated_at();

create function public.save_electrical_takeoff(
  p_project_id uuid,
  p_status public.takeoff_run_status,
  p_rule_version text,
  p_input_snapshot jsonb,
  p_warnings jsonb,
  p_lines jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_run_id uuid;
begin
  if jsonb_typeof(p_input_snapshot) <> 'object'
    or jsonb_typeof(p_warnings) <> 'array'
    or jsonb_typeof(p_lines) <> 'array'
  then
    raise exception 'invalid electrical takeoff payload' using errcode = '22023';
  end if;

  insert into public.takeoff_runs (
    project_id, created_by, trade, status, rule_version, input_snapshot, warnings
  )
  values (
    p_project_id,
    (select auth.uid()),
    'electrical',
    p_status,
    p_rule_version,
    p_input_snapshot,
    p_warnings
  )
  returning id into v_run_id;

  insert into public.takeoff_lines (
    run_id,
    project_id,
    category_id,
    specification,
    source_entity_ids,
    quantity_base,
    reserve_quantity,
    waste_factor,
    quantity_with_waste,
    purchase_quantity,
    unit,
    formula,
    calculation_rule_id,
    source_ids,
    assumptions,
    confidence,
    price_source,
    price_low_cents,
    price_high_cents,
    price_checked_at
  )
  select
    v_run_id,
    p_project_id,
    line.category_id,
    line.specification,
    line.source_entity_ids,
    line.quantity_base,
    line.reserve_quantity,
    line.waste_factor,
    line.quantity_with_waste,
    line.purchase_quantity,
    line.unit,
    line.formula,
    line.calculation_rule_id,
    line.source_ids,
    line.assumptions,
    line.confidence,
    line.price_source,
    line.price_low_cents,
    line.price_high_cents,
    line.price_checked_at
  from jsonb_to_recordset(p_lines) as line(
    category_id text,
    specification jsonb,
    source_entity_ids uuid[],
    quantity_base numeric,
    reserve_quantity numeric,
    waste_factor numeric,
    quantity_with_waste numeric,
    purchase_quantity numeric,
    unit text,
    formula text,
    calculation_rule_id text,
    source_ids text[],
    assumptions jsonb,
    confidence public.takeoff_confidence,
    price_source public.price_source_kind,
    price_low_cents numeric,
    price_high_cents numeric,
    price_checked_at timestamptz
  );

  return v_run_id;
end;
$$;

revoke all on function public.save_electrical_takeoff(
  uuid,
  public.takeoff_run_status,
  text,
  jsonb,
  jsonb,
  jsonb
) from public, anon;
grant execute on function public.save_electrical_takeoff(
  uuid,
  public.takeoff_run_status,
  text,
  jsonb,
  jsonb,
  jsonb
) to authenticated;

grant select, insert, delete on public.takeoff_runs to authenticated;
grant select, insert, delete on public.takeoff_lines to authenticated;
grant select, insert, update, delete on public.shopping_list_items to authenticated;
