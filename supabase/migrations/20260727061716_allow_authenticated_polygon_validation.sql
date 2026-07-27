-- PostgreSQL evaluates CHECK helpers with the caller's privileges. This pure,
-- immutable validator must therefore be executable by authenticated writers.
grant execute on function private.is_valid_polygon_vertices(jsonb) to authenticated;
