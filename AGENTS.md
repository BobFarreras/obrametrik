# Obrametrik — Regles d'agents

## Missió

Obrametrik converteix informació d'una reforma en abast, amidaments, materials
i pressupostos auditables. La IA només extreu, classifica i explica: no decideix
quantitats finals, compatibilitats, normativa, seguretat, preus, estoc ni
decisions estructurals. Fotografies, plànols, dades personals, recomanacions
tècniques i normativa són àrees de risc.

## Ordre de lectura

1. Aquest fitxer.
2. `docs/GUIA_PRODUCTE_FINAL_REFORMES_IA.md` i
   `docs/GUIA_TECNICA_ARQUITECTURA_REFORMES_IA.md`.
3. L'ADR relacionat.
4. El README i l'`AGENTS.md` del paquet.
5. Tests i migracions relacionats.

## Modificació i definició d'acabat

Inspecciona abans de modificar. No eliminis tests, desactivis TypeScript/ESLint,
afegeixis `@ts-ignore`, exposis secrets, modifiquis migracions aplicades ni facis
commit, push o deploy sense autorització. Una funcionalitat requereix validació,
autorització, errors segurs, tests, traduccions, accessibilitat, documentació i
ha de superar lint, typecheck, tests i build.

## Comentaris

Comenta intenció, regles de negoci, decisions, riscos, limitacions i supòsits no
evidents; no narris el codi. Els TODO han de tenir identificador, risc i criteri
de retirada.

## Seguretat

RLS és obligatòria a esquemes exposats. Valida entrades i autorització per
recurs, protegeix contra IDOR i prompt injection, mantén secrets al servidor,
fitxers privats, rate limiting en endpoints sensibles, logs sense dades
sensibles i dependències revisades.

## I18N

Català és l'idioma inicial; castellà i anglès són obligatoris. Cap text visible
directe als components. Utilitza claus, pluralització i formatadors locals, evita
concatenació i mantén paritat entre catàlegs.

## Arquitectura

El domini és independent de frameworks. Infraestructura queda darrere
d'interfícies; UI no conté SQL, API no conté components, càlculs no utilitzen
LLM, mòbil no depèn de Server Actions i no hi ha imports profunds entre paquets
ni accés transversal entre organitzacions.

## Lliurament

Informa què i per què ha canviat, fitxers, tests, resultats, riscos, deute tècnic
i següents passos.
