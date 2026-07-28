# Motor determinista d’amidaments i escandall elèctric — Fase 1

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
- Dimensionament complet del quadre, diferencials i proteccions.
- Catàleg, preus, mà d’obra i persistència.

## Criteris d’acceptació

- Cas mínim vàlid, límit exacte i superació de límit.
- Dada obligatòria absent i regla no aplicable.
- Secció o tub inferior al mínim.
- Arrodoniment comercial.
- Cap duplicació del tub per nombre de conductors.
- Traçabilitat de totes les línies fins a circuit, trams, regla i font.
