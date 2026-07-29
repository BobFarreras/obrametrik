# Electricitat en habitatges — Base de coneixement inicial

**Jurisdicció:** Espanya  
**Estat:** esborrany tècnic pendent de revisió per instal·lador habilitat  
**Font principal:** REBT, `BOE-A-2002-18099`  
**Apartats inicials:** ITC-BT-10, 19, 21, 23, 24, 25, 26 i 27  
**Verificat:** 26 de juliol de 2026

## 1. Objectiu de producte

Permetre que Obrametrik:

- Representi punts, circuits, canalitzacions, quadres i proteccions.
- Detecti informació absent i incompatibilitats evidents.
- Calculi un escandall preliminar de conductors, tubs, caixes, mecanismes i
  proteccions.
- Expliqui la regla aplicada.
- Separi el càlcul orientatiu de la validació i execució reglamentària.

## 2. Dades mínimes del projecte

- Ubicació i data normativa.
- Ús de l'immoble.
- Instal·lació existent, ampliació o nova.
- Subministrament i esquema coneguts.
- Superfície útil.
- Grau d'electrificació previst.
- Potències dels equips.
- Punts de llum, comandaments i preses.
- Equipament de cuina, ACS, climatització, calefacció i recàrrega.
- Longituds i sistemes d'instal·lació.
- Zones amb banyera, dutxa o condicions especials.
- Quadre i proteccions existents, si es conserven.

Les dades no visibles o no confirmades no es dedueixen d'una fotografia.

## 3. Circuits mínims d'electrificació bàsica

La ITC-BT-25 defineix, per a habitatges, circuits de distribució interna.
L'escandall ha de treballar per circuit, no només per tipus de component.

| Circuit | Ús resumit |
| --- | --- |
| C1 | Il·luminació |
| C2 | Preses d'ús general i frigorífic |
| C3 | Cuina i forn |
| C4 | Rentadora, rentavaixelles i termo elèctric |
| C5 | Preses de bany i preses auxiliars de cuina |

L'electrificació elevada incorpora circuits addicionals segons equipament,
superfície i previsió: calefacció, aire condicionat, secadora, automatització,
circuits addicionals i recàrrega de vehicle elèctric, entre altres condicions
definides pel REBT.

## 4. Taula inicial de dimensionament reglamentari

Resum operatiu de la taula 1 de la ITC-BT-25. Són mínims subjectes a les notes
de la taula i a comprovacions addicionals; no són una selecció universal.

| Circuit | Automàtic | Màxim de punts/tomes | Secció mínima Cu | Tub/conducte |
| --- | ---: | ---: | ---: | ---: |
| C1 il·luminació | 10 A | 30 | 1,5 mm² | 16 mm |
| C2 preses generals | 16 A | 20 | 2,5 mm² | 20 mm |
| C3 cuina i forn | 25 A | 2 | 6 mm² | 25 mm |
| C4 rentadora, rentavaixelles, termo | 20 A | 3 | 4 mm² | 20 mm |
| C5 bany i auxiliars de cuina | 16 A | 6 | 2,5 mm² | 20 mm |
| C10 secadora | 16 A | 1 | 2,5 mm² | 20 mm |
| C11 automatització | 10 A | Segons projecte | 1,5 mm² | 16 mm |

Notes essencials:

- Els conductors són de coure en aquesta taula.
- La secció també queda condicionada per la caiguda de tensió.
- La ITC-BT-25 fixa per als circuits interiors indicats una caiguda de tensió
  màxima del 3 % en les condicions de càlcul que defineix.
- Superar el màxim de punts obliga a circuits addicionals.
- C4 té notes específiques sobre derivacions i protecció dels aparells.
- Cal consultar sempre la versió completa de la taula i les seves notes.

## 5. Regles inicials del motor

### ELEC-C1-SECTION-001

- Tipus: normativa.
- Aplica quan: habitatge a Espanya, circuit C1.
- Resultat base: secció mínima 1,5 mm² Cu, automàtic 10 A, fins a 30 punts,
  tub/conducte de referència de taula 16 mm.
- Validacions addicionals: caiguda de tensió, sistema d'instal·lació,
  agrupament, temperatura i condicions particulars.
- Font: ITC-BT-25, taula 1 i notes.

### ELEC-C2-SECTION-001

- Tipus: normativa.
- Aplica quan: habitatge a Espanya, circuit C2.
- Resultat base: secció mínima 2,5 mm² Cu, automàtic 16 A, fins a 20 preses,
  tub/conducte de referència de taula 20 mm.
- Validacions addicionals: les mateixes comprovacions aplicables.
- Font: ITC-BT-25, taula 1 i notes.

### ELEC-EXTRA-CIRCUIT-001

- Tipus: normativa.
- Aplica quan: el recompte supera el màxim del circuit.
- Resultat: crear una necessitat de circuit addicional; no augmentar
  silenciosament el límit.
- Font: ITC-BT-25, apartat 3.

### ELEC-RCD-COUNT-001

- Tipus: normativa.
- Aplica quan: quadre d'habitatge.
- Resultat base: com a mínim un diferencial de les característiques exigides
  per cada cinc circuits instal·lats, considerant les regles especials.
- Font: ITC-BT-25, apartat 2.3.

### ELEC-RCD-SENSITIVITY-001

- Tipus: normativa.
- Resultat base: tots els circuits han de quedar protegits contra contactes
  indirectes amb diferencial residual màxim de 30 mA segons les condicions de
  la ITC-BT-25.
- Font: ITC-BT-25, apartat 2.1.

## 6. Quadre elèctric

El model del quadre ha de contenir:

- Alimentació.
- IGA i intensitat assignada.
- Protecció contra sobretensions quan correspongui.
- Diferencials.
- Magnetotèrmics per circuit.
- Circuit, pols, intensitat, corba i poder de tall com a propietats.
- Reserva modular configurada.
- Etiquetatge.
- Relació exacta entre protecció i circuits aigües avall.

No s'ha de seleccionar un quadre només comptant magnetotèrmics. L'escandall
necessita:

```text
mòduls ocupats per dispositius
+ mòduls de reserva definida
→ files i capacitat comercial
```

La selecció final de proteccions exigeix dades de la instal·lació i
coordinació. La UI pot proposar una composició preliminar, però marca les dades
pendents i la revisió necessària.

## 7. Model de punt i circuit

Cada punt registra:

- Tipus.
- Espai i posició 3D.
- Alçada.
- Mecanisme.
- Potència prevista.
- Circuit.
- Grau IP o classe quan sigui aplicable.
- Estat: existent, conservar, retirar o nou.

Cada circuit registra:

- Codi funcional.
- Origen.
- Protecció.
- Tensió i fases.
- Punts alimentats.
- Trams.
- Conductors de cada tram.
- Secció.
- Sistema d'instal·lació.
- Longitud al punt més allunyat.
- Caiguda de tensió calculada.

## 8. Escandall elèctric

Categories inicials:

- Conductors per tipus, color funcional, secció i longitud.
- Cable multipolar quan correspongui.
- Tub o canal per diàmetre i sistema.
- Caixes de mecanismes.
- Caixes de derivació.
- Mecanismes, marcs i embellidors.
- Lluminàries i equips.
- Quadre, envolvent i accessoris.
- IGA, diferencials, magnetotèrmics i proteccions aplicables.
- Bornes, barres, ponts i etiquetatge.
- Fixacions, connectors i consumibles.

### Càlcul de conductor

Per cada tram:

```text
metres_del_tipus =
longitud_tram
× nombre_conductors_del_tipus
```

Després:

```text
total =
Σ(metres_del_tipus)
+ reserves_explícites

compra =
arrodoniment_comercial(total × factor_marge)
```

El nombre de conductors depèn de la topologia real. Per exemple, un punt de
llum simple, una commutació i una derivació no tenen necessàriament la mateixa
composició.

### Càlcul de tub

El tub es calcula una vegada per recorregut físic, encara que contingui diversos
conductors. El diàmetre es valida contra:

- Nombre i secció de conductors.
- Sistema d'instal·lació.
- Taules reglamentàries.
- Ocupació i mantenibilitat.

### Caixes i mecanismes

- Una caixa física no equival sempre a un mecanisme.
- Els conjunts múltiples comparteixen marc quan el sistema ho permet.
- Les caixes de derivació provenen de nodes reals de la xarxa.
- Els accessoris depenen de marca/sèrie només en la fase de producte.

## 9. Banys i dutxes

La ITC-BT-27 defineix volums al voltant de banyeres i dutxes, i condicions de
canalitzacions, mecanismes i equips.

El motor ha de:

1. Modelar banyera, plat, dutxa sense plat i parets fixes.
2. Generar els volums en 3D.
3. Classificar cada component respecte als volums.
4. Aplicar grau de protecció i condicions específiques.
5. Mostrar la font i l'apartat.

No s'usa la regla genèrica “prohibit qualsevol empalme al bany”. La posició i
les condicions exactes importen.

## 10. Preguntes del flux

- Quins equips elèctrics hi haurà?
- Quina potència nominal té cada equip?
- Quins punts són existents?
- Quin punt controla cada llum?
- Cal commutació des de més d'un lloc?
- Hi ha calefacció, aire condicionat, termo, secadora o domòtica?
- Hi ha banyera o dutxa? Quin tipus i geometria?
- Quin recorregut i sistema d'instal·lació es preveu?
- Es coneixen quadre, proteccions i seccions existents?
- L'actuació requereix verificació, memòria o projecte específic?

## 11. Cas daurat inicial

Bany amb:

- Un punt de llum de sostre.
- Un punt de llum de mirall.
- Un interruptor doble.
- Una presa permesa segons ubicació.
- Extractor.
- Dutxa.
- Lavabo.

El test ha de comprovar:

- Assignació de circuits.
- Conductors per cada tram.
- Metres de tub sense duplicació.
- Mecanismes i caixes.
- Proteccions associades.
- Classificació en volums.
- Dades insuficients.
- Traçabilitat de totes les línies d'escandall.

## 12. Fonts

- BOE, Real Decreto 842/2002 i text consolidat del REBT:
  https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099
- Codi electrònic consolidat del REBT i ITC:
  https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=326

Abans de publicar regles cal verificar modificacions, guies tècniques
d'aplicació, normativa territorial i condicions particulars aplicables.
