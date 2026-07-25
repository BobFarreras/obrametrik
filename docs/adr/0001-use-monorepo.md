# ADR 0001 — Monorepo

- Estat: Acceptat
- Data: 2026-07-25
- Context: web, mòbil i regles han de compartir contractes.
- Decisió: pnpm workspaces i Turborepo.
- Alternatives: repositoris separats.
- Conseqüències: canvis atòmics i CI centralitzada.
- Riscos: acoblaments; mitigats amb APIs públiques.
