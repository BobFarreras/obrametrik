# Desplegament

La web està preparada per Vercel amb l'arrel del monorepo i `apps/web` com a
workspace. Supabase s'actualitza amb migracions revisades. Expo utilitza els
perfils development, preview i production d'`eas.json`.

Producció, migracions remotes i publicació en stores requereixen aprovació
explícita. Configura variables per entorn i executa smoke tests després.
