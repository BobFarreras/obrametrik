# Testing

- Vitest: domini, validació, càlculs, i18n, API client i health endpoint.
- pgTAP: RLS i aïllament d'organitzacions.
- Playwright: fluxos web crítics i accessibilitat bàsica.
- Expo: unitats ara; development build per E2E natiu.

Comanda principal: `pnpm test`. RLS requereix `supabase start` i
`supabase test db`.
