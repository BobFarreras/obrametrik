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
supabase start
pnpm --filter @obrametrik/web dev
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

Per executar Expo en un Android físic via USB:

```bash
pnpm --filter @obrametrik/mobile android:usb
pnpm --filter @obrametrik/mobile dev:tunnel
```

Consulta [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) per configurar els entorns,
Android/ADB i Supabase local, i
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) abans de contribuir. Qualsevol
interfície ha de seguir [docs/DESIGN.md](docs/DESIGN.md).
