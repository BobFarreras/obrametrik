# Especificació — Model unificat d'edifici

**Estat:** en implementació

**Mètode:** SDD + TDD

**ADR:** [0009](../../adr/0009-unified-building-domain-model.md)

## Problema

Web i mòbil necessiten crear i consultar el mateix espai professional sense
conèixer taules, noms de columnes o detalls de Supabase.

## Contracte del primer recorregut

### Crear espai

Entrades:

- Projecte i planta.
- Autor autenticat.
- Nom i tipus d'espai.
- Rectangle o polígon en mil·límetres enters.
- Altura lliure.
- Origen i rotació.
- Procedència i confirmació de la geometria.

Sortida:

- Espai persistent amb identificador estable.
- Mateixa geometria canònica que ha estat acceptada.

### Errors de domini

- Dimensions no positives o fora de l'interval admès.
- Coordenades decimals.
- Polígon amb menys de tres vèrtexs.
- Vèrtexs consecutius repetits.
- Àrea nul·la.
- Autointersecció.
- Altura no vàlida.

### Autorització

- El cas d'ús no decideix permisos.
- L'adaptador executa la petició amb la sessió de l'usuari.
- RLS limita lectura i escriptura al projecte.
- Un `projectId` aportat pel client no concedeix accés.

## Arquitectura

```text
UI / API
→ CreateBuildingSpaceUseCase
→ BuildingModelRepository (port)
→ SupabaseBuildingModelRepository (adapter)
→ PostgreSQL + RLS
```

Dependències:

- `domain`: entitats i invariants geomètriques.
- `application`: casos d'ús i ports.
- `database`: mapatge i adaptador Supabase.
- `apps`: composició i presentació.

## Criteris d'acceptació

1. El domini no importa Supabase, React, Next.js ni Expo.
2. El cas d'ús depèn d'una interfície, no d'un client concret.
3. El polígon en L del cas daurat és acceptat.
4. Un polígon autointersectat és rebutjat abans d'arribar a la base de dades.
5. El repositori rep només una ordre validada.
6. Els errors de persistència no es converteixen en resultats correctes.
7. Typecheck, tests, build, pgTAP, linter i advisors queden en verd.

## Fora d'abast d'aquest increment

- Editor visual.
- Operacions booleanes CAD.
- Importació IFC/DXF.
- Sincronització offline.
- Migració de les taules antigues.
