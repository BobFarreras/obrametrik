create type public.room_kind as enum ('bathroom', 'kitchen', 'bedroom', 'living_room', 'hallway', 'other');

alter table public.rooms
  add column kind public.room_kind,
  add column length_m numeric(10,3),
  add column width_m numeric(10,3),
  add column height_m numeric(10,3);

alter table public.rooms
  add constraint rooms_length_realistic check (length_m between 0.1 and 100) not valid,
  add constraint rooms_width_realistic check (width_m between 0.1 and 100) not valid,
  add constraint rooms_height_realistic check (height_m between 0.1 and 20) not valid;
alter table public.surfaces
  add constraint surfaces_width_realistic check (width_m <= 100) not valid,
  add constraint surfaces_height_realistic check (height_m <= 20) not valid;
alter table public.measurements
  add constraint measurements_width_realistic check (width_m <= 100) not valid,
  add constraint measurements_height_realistic check (height_m <= 20) not valid;

create function private.generate_room_surfaces()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.length_m is null or new.width_m is null or new.height_m is null then
    return new;
  end if;
  insert into public.surfaces (room_id, created_by, name, kind, width_m, height_m)
  values
    (new.id, new.created_by, 'floor', 'floor', new.length_m, new.width_m),
    (new.id, new.created_by, 'ceiling', 'ceiling', new.length_m, new.width_m),
    (new.id, new.created_by, 'wall_north', 'wall', new.width_m, new.height_m),
    (new.id, new.created_by, 'wall_south', 'wall', new.width_m, new.height_m),
    (new.id, new.created_by, 'wall_east', 'wall', new.length_m, new.height_m),
    (new.id, new.created_by, 'wall_west', 'wall', new.length_m, new.height_m);
  return new;
end;
$$;

create trigger rooms_generate_surfaces
after insert on public.rooms
for each row execute function private.generate_room_surfaces();
