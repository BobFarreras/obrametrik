# Motor determinista d’amidaments i escandall elèctric — Fase 1

La descripció de l'arquitectura implementada, el mapa de fitxers, el flux de
dades i les limitacions vigents es troben a
`docs/features/electrical-takeoff-engine/IMPLEMENTATION.md`.

## Objectiu

Produir un escandall preliminar, reproduïble i auditable per a circuits
interiors d’habitatges a Espanya. Aquesta fase no substitueix la comprovació de
caiguda de tensió, ocupació de canalització, agrupament, temperatura ni
condicions particulars.

## Entrades observables

- Jurisdicció, ús de l’edifici i data normativa.
- Circuit funcional i identificador estable.
- Punts alimentats.
- Trams físics amb longitud entera en mil·límetres.
- Conductors explícits de cada tram, amb funció i secció confirmada.
- Canalització confirmada de cada tram.
- Reserves fixes, marge de compra i increment comercial.
- Identificadors de les entitats d’origen.

## Resultats observables

- `not_applicable` si no és un habitatge a Espanya.
- `insufficient_data` si falta una entrada obligatòria o una dada tècnica
  necessària no està confirmada.
- `professional_review` quan el càlcul és possible però requereix les
  comprovacions reglamentàries que aquesta fase encara no implementa.
- Necessitat explícita de circuits addicionals quan se supera el màxim de punts.
- Línies de conductor agrupades per funció i secció.
- Línies de tub agrupades per sistema i diàmetre, comptant cada recorregut físic
  una sola vegada.
- Quantitat base, reserva, marge, quantitat de compra, fórmula, regla, fonts,
  supòsits i entitats d’origen per cada línia.

## Fórmules

```text
conductor_base_m =
  Σ(longitud_tram_mm / 1000 × nombre_conductors_equivalents)
  + reserva_fixa_m

tub_base_m = Σ(longitud_tram_mm / 1000) + reserva_fixa_m

quantitat_amb_marge = quantitat_base_m × (1 + marge_percent / 100)

quantitat_compra =
  ceil(quantitat_amb_marge / increment_comercial_m)
  × increment_comercial_m
```

## Regles inicials

- Taula operativa inicial de circuits C1, C2, C3, C4, C5, C10 i C11 segons
  `docs/coneixement/ELECTRICITAT_HABITATGES.md`.
- El límit de C11 queda pendent perquè depèn del projecte.
- La secció i el diàmetre mínims es validen, però no s’infereixen.
- Una superació del límit crea una necessitat de circuit addicional; no amplia
  silenciosament el circuit existent.

## Fora d’abast

- Caiguda de tensió.
- Ocupació i mantenibilitat de tubs.
- Agrupament, temperatura i sistema d’instal·lació.
- Volums de bany i dutxa.
- Coordinació, corbes, poder de tall i selecció final de proteccions.
- Catàleg, preus, mà d’obra i persistència.

## Increment 2 — Composició preliminar del quadre

El motor rep els circuits instal·lats i els dispositius explícitament
confirmats. Calcula:

- Un magnetotèrmic per cada circuit físic.
- El mínim base d’un diferencial per cada cinc circuits.
- El nombre de mòduls ocupats, la reserva explícita i la capacitat mínima.
- Una línia d’escandall per tipus de dispositiu.

El motor bloqueja:

- Diferencials amb sensibilitat superior a 30 mA.
- Menys diferencials que el mínim base.
- Una envolvent confirmada amb menys mòduls que els necessaris.

El resultat continua sent `professional_review`: les regles especials,
coordinació, IGA, sobretensions, pols, corbes i poder de tall necessiten dades
addicionals i revisió.

## Increment 3 — Recorregut vertical de projecte

La pàgina del projecte exposa un calaix «Materials i compra» que permet:

1. Confirmar manualment circuit, punts, recorregut, conductors, secció, tub,
   reserves, marge i increment comercial.
2. Executar el cas d’ús d’aplicació i el motor `electrical-takeoff@1`.
3. Desar atòmicament un snapshot immutable i les seves línies auditables.
4. Consultar quantitat calculada, quantitat de compra, fórmula i regla.
5. Afegir línies confirmades a una llista de compra editable.
6. Introduir opcionalment un rang de preu orientatiu per unitat i obtenir un
   rang de pressupost; no es mostra cap preu sense origen explícit.

### Persistència i autorització

- `takeoff_runs`: snapshot versionat de les entrades i estat del motor.
- `takeoff_lines`: resultat immutable, fórmula, fonts, confiança i preu.
- `shopping_list_items`: decisió editable de compra separada del càlcul.
- La funció `save_electrical_takeoff` desa run i línies en una transacció.
- Lectura per membres del projecte; mutacions només per owner/admin mitjançant
  RLS. No s’utilitza `service_role`.
- Totes les consultes de UI filtren també per `project_id`.

### Preus

Els preus manuals es marquen `orientation`, conserven data i rang mínim/màxim.
`none` no permet imports; `catalog` i `offer` queden reservats per integracions
futures. El pressupost és la suma dels rangs de les línies amb preu i no es
presenta com una oferta comercial.

## Criteris d’acceptació

- Cas mínim vàlid, límit exacte i superació de límit.
- Dada obligatòria absent i regla no aplicable.
- Secció o tub inferior al mínim.
- Arrodoniment comercial.
- Cap duplicació del tub per nombre de conductors.
- Traçabilitat de totes les línies fins a circuit, trams, regla i font.

## Increment 4 — Escandall originat exclusivament al plànol

La UI deixa de demanar un nombre manual de punts. L’acció «Materials i compra»
viu a la capçalera de l’editor web en escriptori, a l’acció mòbil del web i a
la capçalera de l’editor natiu. L’app nativa també ofereix un accés destacat des
de la fitxa del projecte i una pantalla pròpia de consulta. Desar o autodesar el
CAD regenera l’escandall; obrir-ne la vista només consulta el resultat i no
requereix una segona acció manual.

### Invariants

- Només participen terminals CAD confirmats, actius i pertanyents al projecte.
- Si no existeix cap endoll al plànol, no es genera cap mecanisme d’endoll.
  S’aplica el mateix invariant a llums i interruptors.
- Els elements no elèctrics i els marcats `to_remove` no creen partides.
- Cada tipus i variant comercial conserva una línia separada.
- L’inspector permet definir variants de llums, interruptors i endolls; un
  commutador només es genera si el punt del plànol té la variant `two_way`.
- Les caixes, marcs i connectors provenen de receptes versionades i mantenen
  els identificadors dels objectes CAD d’origen.
- Les eines reutilitzables es compten una vegada per execució, no una vegada
  per objecte.
- Sense rutes elèctriques explícites no es calculen metres de cable ni tub.
  El resultat mostra aquesta mancança; mai estima distàncies ocultes.

### Receptari inicial `electrical-plan-components@1`

- Llum: punt de llum i connector.
- Interruptor: mecanisme, caixa d’encastar i marc.
- Endoll: mecanisme segons variant, caixa d’encastar i marc.
- Qualsevol implementació elèctrica: joc de tornavisos aïllats, pelacables i
  comprovador de tensió, comptats com a eines reutilitzables.

### Criteris d’acceptació

- El botó del header obre el drawer en desktop i l’acció inferior persistent
  fa el mateix al web mòbil.
- A l’app nativa, el header de l’editor i la fitxa del projecte obren la
  pantalla «Materials i compra».
- Desar el plànol recalcula i refresca la vista sense botó «Generar».
- Materials i eines es mostren en seccions separades amb representació visual.
- L’explicació principal usa llenguatge humà i relega la regla interna al detall
  tècnic.
- Un plànol buit produeix zero materials i zero eines.
- Els objectes absents produeixen zero línies de la seva categoria.
- Auxiliars compartits s’agrupen conservant la traçabilitat.
- Variants diferents no es barregen en una mateixa línia comercial.
- La generació rellegeix el projecte al servidor i no confia en un recompte
  enviat pel client.

## Increment 5 — Circuits, connexions i recorreguts confirmats

El projecte incorpora un model elèctric explícit, independent de la geometria
arquitectònica però referenciat als seus objectes. Un circuit assigna terminals
confirmats i conté trams físics confirmats. Cada tram registra inici, final,
longitud mesurada, conductors i canalització.

### Contracte observable

- Un terminal pot pertànyer com a màxim a un circuit actiu.
- Un tram sempre pertany a un circuit del mateix projecte.
- La longitud prové de la polilínia confirmada; no s'infereix d'una distància
  invisible ni d'una imatge.
- El tub es compta una vegada per tram físic; els conductors multipliquen la
  longitud pel seu nombre.
- Materials de mecanismes, cables i tubs es publiquen en una mateixa execució
  immutable, conservant les entitats d'origen.
- Un circuit incomplet conserva els mecanismes calculables i mostra exactament
  quines dades falten; no genera metres parcials com si fossin definitius.
- El quadre i les proteccions només es generen a partir de circuits confirmats.

### Persistència i autorització

- `electrical_circuits` desa la identitat, codi i terminals assignats.
- `electrical_route_segments` desa cada recorregut físic i la seva configuració.
- Membres del projecte poden llegir; només owner/admin poden modificar.
- Les referències creuades es validen a la base de dades i les consultes de UI
  filtren sempre per `project_id`.

### Criteris d'acceptació

- Crear, editar i eliminar un circuit sense perdre el plànol arquitectònic.
- Assignar només terminals elèctrics confirmats del mateix projecte.
- Dibuixar una polilínia amb dos punts com a mínim i veure'n la longitud en
  metres abans de confirmar-la.
- Un tram de 10 m amb tres conductors produeix 30 m de conductor i 10 m de tub
  abans de reserves, marge i arrodoniment.
- Dos trams que comparteixen especificació s'agrupen sense perdre traçabilitat.
- Sense trams confirmats, cable i tub continuen pendents.
- Web i app nativa poden consultar i editar els mateixos circuits.

## Increment 6 — Xarxa espacial i alçats sincronitzats

- Els punts de llum de sostre conserven coordenades lliures en planta i no
  necessiten una paret host.
- Planta, alçat frontal i alçat lateral són projeccions del mateix punt 3D.
- La proposta crea una caixa de derivació per cada circuit poblat i enllaça
  cada terminal amb una polilínia tridimensional editable.
- Cada tram exposa tots els conductors per separat amb funció, color i secció;
  la canalització continua comptant-se una sola vegada.
- Els recorreguts verticals es veuen als alçats i acaben a l'alçada real del
  terminal.
- La proposta és determinista i editable. No confirma passos constructius,
  regates ni perforacions ocultes.
