# Revestiments i paviments — Base de coneixement inicial

**Jurisdicció inicial:** Espanya  
**Estat:** base inicial pendent de revisió per col·locador i tècnic  
**Àmbit inicial:** revestiments ceràmics adherits en reformes interiors  
**Verificat:** 26 de juliol de 2026

## 1. Objectiu

Transformar una superfície real en:

- Disseny de modulació.
- Nombre de peces senceres i tallades.
- Distribució de juntes.
- Compatibilitat de suport, adhesiu, peça i ús.
- Escandall de peces, adhesiu, rejuntat, perfils i segellats.
- Pla de col·locació auditable.

L'àrea dividida per l'àrea d'una peça només és una estimació inicial. No
representa cantonades, patrons, obertures, retalls reutilitzables, lots ni
paquets comercials.

## 2. Sistema complet

```text
host
→ suport
→ preparació/regularització
→ impermeabilització o capa funcional
→ adhesiu o sistema de fixació
→ peça
→ junta de col·locació
→ junta de moviment o perimetral
→ perfils i remats
→ segellat aplicable
```

Cada component té una funció diferent. El material de rejuntat no substitueix
una junta de moviment ni una impermeabilització.

## 3. Dades de la superfície

- Polígon i buits en `mm`.
- Pla: terra, paret, sostre o element.
- Cota i orientació.
- Suport i estat.
- Planimetria.
- Humitat i exposició a aigua.
- Ús i trànsit.
- Interior o exterior.
- Calefacció radiant.
- Juntes existents.
- Impermeabilització.
- Trobades, passos i perfils.

## 4. Dades de la peça

- Tipus de material.
- Fabricant, sèrie i referència.
- Amplada, llargada i gruix nominal.
- Mida de fabricació/calibre quan estigui disponible.
- Rectificada o no.
- Pes per peça o `m²`.
- Peces per caixa.
- `m²` per caixa.
- Lot, to i calibre.
- Direccionalitat del dibuix.
- Variació visual.
- Prestacions declarades.
- Ús previst pel fabricant.

No es considera que dues caixes amb la mateixa referència siguin
intercanviables si to, calibre o lot són rellevants i no estan confirmats.

## 5. Dades del patró

Patrons inicials:

- Junta contínua.
- Desplaçat.
- Diagonal.
- Espiga.
- Modular multiformat.
- Patró definit pel fabricant.

Paràmetres:

- Origen.
- Eixos de replanteig.
- Orientació.
- Amplada de junta.
- Desplaçament.
- Regles de simetria.
- Alineació amb parets o elements.
- Continuïtat entre superfícies.
- Preferència de tall.

El desplaçament màxim o recomanat no s'inventa: depèn de la peça, la seva
geometria, documentació i criteri revisat.

## 6. Editor visual de modulació

La vista 2D/alçat ha de permetre:

- Seleccionar la superfície.
- Escollir peça i patró.
- Moure l'origen.
- Girar el patró.
- Canviar la junta.
- Veure peces senceres, retalls i buits.
- Marcar cortes inviables o molt petits.
- Alinear juntes amb sanitaris, nínxols, cantonades o altres superfícies.
- Comparar variants.
- Bloquejar un replanteig confirmat.

La vista 3D mostra el resultat, però l'alçat és la vista principal per editar
un revestiment de paret amb precisió.

## 7. Motor geomètric de peces

Pipeline:

```text
superfície útil
→ graella infinita del patró
→ intersecció peça-superfície
→ classificació sencera/tallada/fora
→ exclusió de buits
→ identificació de retalls reutilitzables
→ agrupació per referència
→ paquets comercials
```

Cada fragment conserva:

- Peça d'origen.
- Polígon de tall.
- Àrea.
- Dimensions mínimes.
- Cantells vistos.
- Possibilitat de reutilització.
- Destí assignat o residu.

La reutilització de retalls és una optimització explícita, no una reducció
oculta del marge.

## 8. Quantitat de peces

### Estimació ràpida

Només quan encara no hi ha replanteig:

```text
peces_teòriques =
àrea_neta / àrea_nominal_peça

peces_estimades =
ceil(peces_teòriques × factor_pèrdua_contextual)
```

### Càlcul amb modulació

```text
peces_necessàries =
peces_senceres
+ peces_noves_consumides_per_retalls
+ reserva_definida

caixes =
ceil(peces_necessàries / peces_per_caixa)
```

També es calcula:

- `m²` comprats.
- `m²` instal·lats.
- Retall reutilitzat.
- Sobrant íntegre.
- Residu estimat.

El factor de reserva per manteniment es mostra separat de la pèrdua
d'instal·lació.

## 9. Adhesiu

La selecció depèn de:

- Suport.
- Peça i absorció/prestacions declarades.
- Format i pes.
- Interior/exterior.
- Terra/paret/sostre.
- Humitat o immersió.
- Deformabilitat i moviments.
- Calefacció radiant.
- Temps obert i condicions d'obra.
- Sistema impermeable subjacent.

La classificació i prestacions dels adhesius ceràmics es documenten mitjançant
la norma vigent i la declaració del producte. No es tria un adhesiu només per
una etiqueta comercial com “flexible”.

### Consum

```text
kg_base =
àrea_col·locada
× consum_documentat(
  producte,
  llana,
  suport,
  peça,
  tècnica
)

sacs =
ceil(
  kg_base × factor_marge
  / kg_per_sac
)
```

La mida de llana o tècnica de doble encolat no es decideix només pel costat
llarg de la peça; s'ha de validar amb el sistema i condicions reals.

## 10. Material de rejuntat

Dades:

- Tipus i classificació vigent.
- Amplada i profunditat de junta.
- Dimensions i gruix de peça.
- Densitat o consum del producte.
- Exposició química i aigua.
- Color.
- Unitat comercial.

Fórmula paramètrica habitual, només quan la fitxa o regla validada l'admet:

```text
kg_rejuntat =
funció(
  llargada_peça,
  amplada_peça,
  gruix_peça,
  amplada_junta,
  densitat_producte,
  àrea
)
```

El motor prefereix el calculador o rendiment documentat del fabricant i
registra la versió utilitzada.

La UNE-EN 13888:2009 està anul·lada. La referència inicial vigent per a
requisits, classificació, designació, marcatge i etiquetatge és
UNE-EN 13888-1:2024. Les dades antigues s'han de migrar o marcar com a
històriques, no reinterpretar silenciosament.

## 11. Juntes de moviment i perimetrals

Es modelen com entitats, no com “metres de rejuntat”:

- Juntes estructurals existents.
- Juntes del suport.
- Perimetrals.
- Canvis de pla.
- Divisió de camps.
- Trobades amb materials diferents.

Propietats:

- Traçat.
- Amplada i profunditat.
- Fons de junta.
- Segellant.
- Perfil.
- Continuïtat a través de capes.
- Prestació requerida.

Cap regla de separació es codifica sense context, font o sistema revisat.

## 12. Perfils, sòcols i remats

Entitats lineals:

- Cantonera exterior.
- Perfil terminal.
- Perfil de transició.
- Junta de moviment prefabricada.
- Sòcol.
- Remat d'escala.
- Trobada amb plat, banyera, mampara o tancament.

```text
longitud_compra =
ceil(
  (longitud_geomètrica + retalls/reserva)
  / longitud_comercial
)
× longitud_comercial
```

L'escandall conserva també nombre de barres i retalls sobrants.

## 13. Resbaladicitat

DB-SUA classifica el paviment exigible segons localització, humitat, pendent i
ús. Com a base:

- Zones interiors humides amb pendent menor del 6 %: classe 2.
- Zones interiors humides amb pendent igual o superior al 6 %: classe 3.
- Dutxes i altres ubicacions indicades: classe 3.

L'aplicabilitat concreta s'ha de verificar amb l'àmbit del DB-SUA, ús de
l'edifici i condicions del projecte. La classe del producte prové d'assaig o
documentació vàlida; no de l'aspecte rugós.

### PAV-SLIP-CLASS-001

- Entrades: jurisdicció, ús, localització, humitat i pendent.
- Resultat: classe mínima a verificar o regla no aplicable.
- Font: DB-SUA 1 i document de suport vigent.

## 14. Compatibilitats

El motor revisa:

- Suport ↔ preparació.
- Preparació ↔ impermeabilització.
- Impermeabilització ↔ adhesiu.
- Adhesiu ↔ peça.
- Peça ↔ ús.
- Rejuntat ↔ exposició.
- Segellant ↔ materials dels cantells.
- Perfil ↔ gruix de peça i trobada.

Resultats:

- Compatible.
- Compatible sota condicions.
- Incompatible.
- Dades insuficients.
- Requereix confirmació del fabricant.

## 15. Regles inicials

### REV-SYSTEM-INCOMPLETE-001

- Aplica quan: es proposa peça sense suport, preparació o sistema d'adhesió.
- Resultat: informació insuficient.

### REV-WATERPROOF-COMPAT-001

- Aplica quan: superfície impermeabilitzada.
- Resultat: adhesiu i sistema posterior han d'estar declarats compatibles.

### REV-PATTERN-RECALC-001

- Aplica quan: canvia peça, junta, orientació, origen o superfície.
- Resultat: invalidar modulació i recalcular peces, retalls i paquets.

### REV-OPENING-EDGE-001

- Aplica quan: tall o junta arriba a un buit, pas o cantonada.
- Resultat: generar trobada, cantell vist i perfil/remat candidat.

### REV-BATCH-TRACE-001

- Aplica quan: ceràmica confirmada.
- Resultat: registrar referència, to, calibre i lot quan siguin aplicables.

### REV-MOVEMENT-JOINT-COVER-001

- Aplica quan: una capa superior creua una junta que s'ha de respectar.
- Resultat: error o revisió; no ocultar-la sota ceràmica rígida.

## 16. Escandall

- Peces per referència i caixa.
- Peces especials.
- Imprimació i regularització atribuïbles.
- Adhesiu.
- Rejuntat.
- Segellant.
- Fons de junta.
- Perfils i cantoneres.
- Creuetes, sistemes d'anivellament o separadors si el sistema els requereix.
- Protecció del paviment acabat.
- Tall i consumibles.
- Reserva de manteniment.
- Residus.

Cada línia indica si deriva de geometria, fitxa de producte, regla, paquet
comercial o selecció manual.

## 17. Preguntes del flux

- És paviment o revestiment?
- Quin ús, humitat, pendent i trànsit tindrà?
- Quin suport existeix i està preparat?
- Hi ha impermeabilització o calefacció radiant?
- Quina peça, format, gruix i prestacions?
- Quin patró i amplada de junta?
- On ha de començar o alinear-se?
- Quins cantells quedaran vistos?
- Quines juntes s'han de respectar?
- Quin sistema d'adhesió declara compatibilitat?
- Cal reserva futura del mateix lot?

## 18. Casos daurats

### Dutxa amb canal

- Paviment amb pendent.
- Tres parets.
- Nínxol.
- Aixetes i passos.
- Canal lineal.
- Mampara.

Comprova modulació, peces, retalls, perfils, compatibilitat impermeable,
resbaladicitat i escandall.

### Bany amb peça gran

- Terra irregular.
- Porta.
- Inodor i lavabo.
- Patró alineat amb eix visual.
- Caixes comercials.

Comprova origen, talls, aprofitament, consum d'adhesiu, juntes i cota final.

## 19. Fonts inicials

- CTE DB-SUA:
  https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf
- Document de suport de resbaladicitat:
  https://www.codigotecnico.org/pdf/Documentos/SUA/DA_SUA_3_Resbaladicidad.pdf
- UNE, CTN 138:
  https://www.une.org/encuentra-tu-norma/comites-tecnicos-de-normalizacion/comite?c=CTN+138
- UNE-EN 12004-1:2017, adhesius:
  https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma?c=N0059284
- UNE-EN 13888-1:2024, rejuntat:
  https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma?c=N0072693

Referències inicials a controlar per versió:

- UNE 138002:2023, execució de revestiments ceràmics adherits.
- UNE-EN 14411, rajoles ceràmiques.
- UNE-EN 12004-1:2017, adhesius.
- UNE-EN 13888-1:2024, rejuntat.
- UNE-EN 14891:2017, impermeabilització líquida sota ceràmica adherida.

No es reprodueix el contingut protegit de les normes. Les regles publicades
necessiten accés legítim a la font, extracció estructurada, revisió i tests.
