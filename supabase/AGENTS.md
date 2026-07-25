# Supabase

No modifiquis migracions aplicades. Cada taula exposada requereix RLS,
constraints, índexs revisats i tests de permisos. Funcions privilegiades han
d'estar en esquema privat amb `search_path` segur. Cap política `USING (true)`.
