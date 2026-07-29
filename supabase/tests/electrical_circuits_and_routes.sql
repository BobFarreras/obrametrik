begin;
select plan(10);

select has_table('public', 'electrical_circuits');
select has_table('public', 'electrical_circuit_terminals');
select has_table('public', 'electrical_route_segments');
select has_table('public', 'electrical_connections');
select has_table('public', 'electrical_connection_controls');
select row_security_active('public.electrical_circuits');
select row_security_active('public.electrical_circuit_terminals');
select row_security_active('public.electrical_route_segments');
select row_security_active('public.electrical_connections');
select row_security_active('public.electrical_connection_controls');

select * from finish();
rollback;
