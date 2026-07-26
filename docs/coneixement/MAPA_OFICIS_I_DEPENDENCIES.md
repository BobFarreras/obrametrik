# Mapa d'oficis i dependències

## Objectiu

Evitar que Obrametrik calculi cada ofici com una illa. Una reforma és una xarxa
de decisions espacials, tècniques i temporals.

## Àrees de coneixement

| Àrea | Modela | Depèn especialment de |
| --- | --- | --- |
| Geometria i amidaments | Espais, parets, cotes, àrees i volums | Tots els oficis |
| Demolicions | Elements retirats, residus i proteccions | Estructura, instal·lacions |
| Paleteria | Suports, envans, regates, recreixements | Electricitat, fontaneria, tancaments |
| Impermeabilització | Zones, capes, trobades i passos | Paleteria, fontaneria, revestiments |
| Electricitat | Circuits, punts, canalitzacions, quadres | Geometria, paleteria, zones humides |
| Il·luminació | Lluminàries, controls i prestacions | Electricitat, sostres, ús |
| Fontaneria | AF, ACS, claus i equips | Geometria, paleteria, sanejament |
| Sanejament | Desguassos, pendents, baixants | Cotes, paleteria, estructura |
| Ventilació | Admissió, pas, extracció i conductes | Tancaments, sostres, electricitat |
| Climatització | Equips, canonades, conductes, condensats | Electricitat, ventilació, sanejament |
| Tancaments | Buit, marc, vidre, persiana i juntes | Façana, energia, humitat, ventilació |
| Fusteria interior | Portes, mobiliari i remats | Paviments, parets, electricitat |
| Revestiments | Capes, peces, juntes i perfils | Suport, impermeabilització, tancaments |
| Pintura | Suport, preparació i acabat | Paleteria, humitat |

## Dependències temporals orientatives

```text
captura i diagnosi
→ demolicions controlades
→ replanteig
→ xarxes ocultes i passos
→ proves abans de tancar
→ paleteria i regularització
→ impermeabilització
→ revestiments i paviments
→ tancaments, mecanismes i sanitaris
→ proves finals i remats
```

Aquesta seqüència és una plantilla, no una planificació universal. El motor de
tasques la concreta segons l'abast i les dependències reals.

## Conflictes multidisciplinaris que ha de detectar l'app

- Caixa elèctrica dins d'un volum de protecció incompatible.
- Regata o pas sobre element estructural no validat.
- Desguàs sense pendent geomètricament viable.
- Clau o registre ocult darrere d'un acabat no desmuntable.
- Canonada que ocupa l'espai d'una caixa o premarc.
- Porta que col·lideix amb sanitari, radiador o mobiliari.
- Finestra que perd funcionalitat per una aixeta o moble.
- Impermeabilització interrompuda per un pas sense tractament.
- Gruixos de capes que alteren la cota de desguàs o porta.
- Fals sostre insuficient per a conductes, lluminàries o registres.
- Element que requereix manteniment sense espai d'accés.
- Xarxa preparada per tancar sense prova registrada.

## Estat de cada element

Tots els oficis comparteixen:

```text
existent
→ inspeccionat o desconegut
→ es conserva / es retira / es modifica
→ nou proposat
→ confirmat
→ executat
→ provat
```

No es pot pressupostar una retirada i conservar simultàniament el mateix
element sense una divisió explícita.

## Informació transversal

Cada entitat pot aportar:

- Ubicació i host.
- Fase d'obra.
- Responsable.
- Estat de confirmació.
- Fotografies i documents.
- Regles aplicades.
- Amidament.
- Materials.
- Mà d'obra orientativa.
- Residus.
- Cost previst i real.
- Incidències.

## Ordre d'ampliació de la biblioteca

1. Electricitat d'habitatges.
2. Fontaneria i sanejament.
3. Paleteria, suports i capes.
4. Impermeabilització de banys i zones humides.
5. Demolicions i residus.
6. Tancaments, fusteria i vidre.
7. Revestiments i paviments — base inicial creada.
8. Ventilació i climatització — bases inicials creades.
9. Il·luminació.
10. Pintura, proves i posada en servei.

Cada bloc necessita almenys un cas daurat que travessi altres oficis.
