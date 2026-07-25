# Obrametrik

Obrametrik és una plataforma multilingüe per planificar reformes amb càlculs
deterministes, traçables i separats de la capa d'IA.

## Requisits

- Node.js 22 LTS
- pnpm 10
- Docker
- Supabase CLI

## Inici ràpid

```bash
pnpm install
cp .env.example .env.local
supabase start
pnpm dev
```

La web queda disponible a `http://localhost:3000/ca` i la comprovació de salut
a `http://localhost:3000/api/health`.

## Comprovacions

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:audit
```

Consulta [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) i
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) abans de contribuir.
