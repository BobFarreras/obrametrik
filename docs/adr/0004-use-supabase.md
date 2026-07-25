# ADR 0004 — Supabase

- Estat: Acceptat
- Data: 2026-07-25
- Context: PostgreSQL, Auth, Storage i RLS.
- Decisió: Supabase amb adaptadors.
- Alternatives: backend propi.
- Conseqüències: MVP més curt i Postgres portable.
- Riscos: lock-in; mitigat amb ports i SQL versionat.
