# Database migration

## Objectiu i ús

Crear o revisar canvis SQL. No modifiquis una migració ja aplicada.

## Procediment

Defineix compatibilitat i rollback, crea migració via Supabase CLI, revisa pèrdua
de dades, constraints, índexs, RLS, polítiques, rendiment i grants; executa
reset/test/advisors quan estiguin disponibles.

## Resultat

Documenta forward, rollback, locks, tests i riscos. Funcions privilegiades van
en esquema privat amb `search_path` segur.
