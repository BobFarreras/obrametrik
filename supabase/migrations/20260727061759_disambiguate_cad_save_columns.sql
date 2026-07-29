-- PostgreSQL preserves the PL/pgSQL body in pg_proc. Recreate the function with
-- qualified DELETE targets so its TABLE output name cannot shadow the column.
do $migration$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.save_cad_plan(jsonb, uuid)'::regprocedure)
  into v_definition;

  v_definition := replace(
    v_definition,
    'delete from public.building_elements
    where project_id = v_project_id and space_id = v_space_id and host_element_id is not null;',
    'delete from public.building_elements as element
    where element.project_id = v_project_id and element.space_id = v_space_id
      and element.host_element_id is not null;'
  );
  v_definition := replace(
    v_definition,
    'delete from public.building_elements
    where project_id = v_project_id and space_id = v_space_id;',
    'delete from public.building_elements as element
    where element.project_id = v_project_id and element.space_id = v_space_id;'
  );

  execute v_definition;
end;
$migration$;
