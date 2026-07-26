/*
 * Purpose: complete project lifecycle permissions and timestamp maintenance.
 * Security: only organization owners and admins can delete projects.
 */
create policy "projects_delete_admins"
on public.projects
for delete
to authenticated
using (
  (select private.has_organization_role(
    projects.organization_id,
    (select auth.uid()),
    array['owner', 'admin']::public.organization_role[]
  ))
);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();
