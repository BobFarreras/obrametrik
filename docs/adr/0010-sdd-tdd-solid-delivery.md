# ADR 0010 — SDD, TDD i SOLID com a mètode de lliurament

- Estat: Acceptat
- Data: 2026-07-26

## Context

Obrametrik combina geometria, normativa, càlculs, permisos i múltiples
plataformes. Implementar pantalles directament contra la base de dades faria
difícil demostrar les regles, substituir adaptadors o evitar regressions.

## Decisió

Cada increment funcional segueix:

```text
especificació observable
→ tests que fallen per la raó esperada
→ implementació mínima
→ refactorització
→ validació integral
```

### SDD

La carpeta `docs/features/<feature>/` defineix:

- Problema i abast.
- Contractes d'entrada i sortida.
- Invariants i errors.
- Autorització.
- Criteris d'acceptació.
- Fora d'abast.

Si una decisió afecta diversos mòduls, també necessita ADR.

### TDD

- Domini: invariants i transicions.
- Aplicació: casos d'ús amb ports simulats.
- Adaptadors: mapatge, errors i contractes d'integració.
- PostgreSQL: constraints, triggers, RLS i aïllament amb pgTAP.
- UI: comportament, accessibilitat i recorreguts crítics.

Un test no es modifica només perquè contradigui la implementació. Primer es
revisa l'especificació.

### SOLID

- **Responsabilitat única:** domini, aplicació, infraestructura i UI separats.
- **Obert/tancat:** nous oficis i adaptadors amplien ports estables.
- **Substitució:** dobles de test i adaptadors respecten el mateix contracte.
- **Segregació d'interfícies:** ports petits per cas d'ús, sense repositoris
  genèrics omnipotents.
- **Inversió de dependències:** els casos d'ús depenen d'interfícies; Supabase
  depèn de l'aplicació, mai a l'inrevés.

## Regles de dependència

```text
domain
↑
application
↑
database / api adapters
↑
web / mobile composition
```

Cap capa inferior importa una capa superior.

## Definició d'acabat

Un increment no està acabat fins que supera:

- Criteris de la seva especificació.
- Lint i typecheck.
- Tests unitaris i d'integració aplicables.
- Build.
- Tests RLS si modifica dades.
- Linter i advisors de Supabase si modifica l'esquema.
- Documentació i catàlegs d'idioma si hi ha UI.

## Conseqüències

- Més treball explícit abans de la UI.
- Menys regressions i acoblament.
- Regles tècniques auditables.
- Substitució possible de Supabase o de la presentació sense reescriure el
  domini.
