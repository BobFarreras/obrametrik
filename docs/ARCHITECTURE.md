# Arquitectura

Obrametrik és un monòlit modular en monorepo. `packages/domain`,
`calculations`, `validation` i `security` són independents de plataforma.
`database` defineix ports; Supabase i els Route Handlers són adaptadors.
`apps/web` i `apps/mobile` només orquestren presentació.

Les dependències apunten de presentació cap a aplicació i domini. No hi ha
imports profunds entre paquets. La IA és un port no privilegiat i tota sortida
es valida abans d'entrar al domini.
