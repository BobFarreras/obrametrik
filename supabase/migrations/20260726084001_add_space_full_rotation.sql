/*
 * Purpose: persist the complete 3D rotation declared by the domain contract.
 * Existing spaces remain at zero rotation on the new axes.
 */
alter table public.building_spaces
  add column rotation_x_millidegrees integer not null default 0
    check (rotation_x_millidegrees between -360000 and 360000),
  add column rotation_y_millidegrees integer not null default 0
    check (rotation_y_millidegrees between -360000 and 360000);

alter table public.building_spaces
  add constraint building_spaces_rotation_z_range
  check (rotation_z_millidegrees between -360000 and 360000);
