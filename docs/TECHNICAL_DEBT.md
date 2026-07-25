# Deute tècnic

## OBRA-001 — Autenticació UI provisional

Els formularis i pantalles existeixen, però encara no executen Supabase Auth.
Risc: no hi ha flux d'usuari complet. Retirada: implementar SSR web, SecureStore
mòbil, recuperació i tests d'expiració en la següent funcionalitat vertical.

## OBRA-002 — Rate limiting no connectat

No hi ha endpoints mutables públics en aquesta fase. Abans d'afegir autenticació
o creació de projectes, cal un adaptador distribuït amb tests d'abús.

## OBRA-003 — SDK Expo conservador

El manifest usa SDK 54 perquè és compatible amb Expo Go durant la transició
documentada a SDK 57. Retirada: migrar amb `expo install --fix` quan l'equip
adopti development builds.
