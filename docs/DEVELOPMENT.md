# Desenvolupament local

Node 22, pnpm 10, Docker Desktop i Supabase CLI són obligatoris. Web i mòbil
utilitzen el mateix Supabase Docker durant el desenvolupament.

## Preparació inicial

```powershell
pnpm install
supabase start
supabase migration up --local
```

Configura `apps/web/.env.local`:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable local>
```

Configura `apps/mobile/.env.local`:

```text
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable local>
```

Les claus locals es consulten amb `supabase status`. Les claus
`EXPO_PUBLIC_*` i `NEXT_PUBLIC_*` són públiques; cap secret o `service_role`
pot entrar en una aplicació client. Els fitxers `.env.local` no es versionen.

## Desenvolupament web

```powershell
supabase start
pnpm --filter @obrametrik/web dev
```

- Web: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:55323`
- Mailpit: `http://127.0.0.1:55324`
- API Supabase: `http://127.0.0.1:55321`

## Desenvolupament mòbil amb Android físic

Activa la depuració USB, connecta i autoritza el dispositiu. Des de l’arrel:

```powershell
pnpm --filter @obrametrik/mobile dev:usb
```

`dev:usb` executa `adb reverse` per als ports `8081`, `55321` i `3000`, i
inicia Metro sense dependre de ngrok. Això
permet que `127.0.0.1` dins del telèfon arribi al Supabase i a la web del PC.
Cal repetir-lo després de reconnectar el cable, reiniciar el dispositiu o
reiniciar el servidor ADB.

Si Expo conserva variables antigues:

```powershell
pnpm --filter @obrametrik/mobile dev:usb -- --clear
```

No substitueixis la URL de Supabase per la de Studio: `55323` és la interfície
administrativa; els clients utilitzen l’API `55321`.

El visor CAD 3D utilitza `expo-gl`, Three.js i React Three Fiber Native. Cal
validar-lo en un Android físic i en un iPhone/iPad físic; el simulador iOS pot
tenir suport OpenGL ES incomplet. El 2D continua disponible si el context 3D no
es pot crear.

## Android Emulator

En emulador Android, `10.0.2.2` representa el PC. Es pot utilitzar
`http://10.0.2.2:55321` si no s’aplica `adb reverse`.

## Verificació

```powershell
supabase db lint --local
supabase test db
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Entorns: local, test, preview, staging i production. Les migracions es creen i
proven localment abans d’un desplegament autoritzat. No reutilitzis dades reals
de producció sense anonimitzar.
