# ADR 0009 — Model de domini unificat per a l'edifici i l'obra

- Estat: Acceptat
- Data: 2026-07-26

## Context

El primer recorregut vertical representa una estança rectangular amb sis
superfícies i ajustos rectangulars. Aquest model és útil per validar el flux,
però no pot representar amb rigor:

- Espais en L, U o polígons lliures.
- Forats allotjats en una paret.
- Xarxes elèctriques, d'aigua, sanejament o climatització.
- Components en 2D, alçat i 3D.
- Capes constructives i treballs sobre el mateix element.
- Dependències, inspeccions, proves i evidències.

Afegir una taula independent per cada pantalla o ofici duplicaria geometria,
autorització i estat.

## Decisió

El domini utilitza cinc blocs relacionats:

1. **Model espacial:** edifici, planta, espai i geometria en mil·límetres.
2. **Elements:** objectes físics allotjats o connectats.
3. **Sistemes:** xarxes i connexions entre elements.
4. **Treball:** abast, tasques, dependències i estat d'execució.
5. **Control:** punts d'inspecció, proves, evidències i no-conformitats.

Totes les entitats tenen identificador estable i pertanyen a un projecte. Les
relacions entre blocs fan referència a aquests identificadors, no a noms de
pantalla ni a JSON opac.

La unitat geomètrica canònica és el mil·límetre enter. Àrees i volums derivats
es calculen de manera determinista i indiquen versió de fórmula.

PostgreSQL és la persistència, però `@obrametrik/domain` defineix el contracte
sense dependre de Supabase, React, Next.js o Expo.

## Geometria

La primera ampliació admet:

- Rectangle.
- Polígon simple.
- Perfil extruït.
- Transformació 3D.
- Obertura o buit allotjat en un element.

El model no intenta ser un nucli CAD/BIM complet. Les operacions geomètriques
avançades quedaran darrere d'un port i conservaran tolerància, versió i
procedència.

## Persistència

Les migracions existents no es modifiquen. La transició serà incremental:

1. Afegir entitats noves amb RLS.
2. Adaptar el flux actual mitjançant ports.
3. Migrar o relacionar `rooms`, `surfaces` i `measurements`.
4. Eliminar el model antic només en una migració posterior, amb dades
   verificades i compatibilitat retirada.

Les taules exposades utilitzaran RLS per projecte. Les funcions privilegiades
continuaran en l'esquema `private` amb `search_path` fix.

## Conseqüències

- Web i mòbil comparteixen el mateix vocabulari.
- Una finestra pot afectar geometria, pintura, tancaments i pressupost sense
  duplicar-se.
- Una prova pot apuntar exactament als elements executats.
- El 2D i el 3D són vistes del mateix model.
- Caldrà implementar validació geomètrica i migració gradual.
- No es promet interoperabilitat IFC/BIM fins a definir un ADR específic.

## Alternatives descartades

- Una taula per ofici: fragmenta el model i duplica relacions.
- Guardar tota l'obra en un únic JSON: dificulta RLS, integritat, consultes i
  migracions.
- Adoptar directament un esquema BIM complet: complexitat prematura per al
  recorregut actual.
