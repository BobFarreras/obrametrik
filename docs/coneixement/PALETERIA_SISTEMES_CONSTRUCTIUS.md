# Paleteria i sistemes constructius — Base de coneixement inicial

**Estat:** base funcional pendent de revisió professional  
**Àmbit inicial:** reformes interiors d'habitatges  
**Verificat:** 26 de juliol de 2026

## 1. Abast

- Demolicions i desmuntatges.
- Envans, trasdossats i tancaments interiors.
- Regates i passos coordinats amb instal·lacions.
- Regularització de suports.
- Recreixements i pendents.
- Impermeabilització.
- Paviments i revestiments.
- Falsos sostres.
- Aïllaments.
- Remats, juntes i segellats.
- Residus i mitjans auxiliars.

## 2. Model per capes

Una superfície no és només una àrea. Ha de registrar una composició:

```text
suport
→ preparació
→ regularització
→ capa funcional
→ adhesió o fixació
→ acabat
→ juntes i remats
```

Cada capa té:

- Material o sistema.
- Gruix.
- Extensió.
- Rendiment.
- Estat actual.
- Compatibilitats.
- Temps i condicions d'execució.
- Pèrdues.

També registra:

- Cota inicial i final.
- Gruix nominal i gruix executat.
- Tolerància.
- Pes propi orientatiu quan sigui rellevant.
- Humitat o condició del suport.
- Preparació requerida.
- Temps abans de cobrir o posar en servei.
- Lots i documents de producte.

## 3. Dades mínimes

- Tipus i estat del suport.
- Planimetria o irregularitats conegudes.
- Humitat i exposició a aigua.
- Acabat actual i retirada prevista.
- Acabat nou.
- Dimensions i patró.
- Obertures, cantonades, trobades i perfils.
- Instal·lacions encastades.
- Limitacions de càrrega o gruix.
- Residus i accés a l'obra.

## 4. Escandall

- Unitats o superfície de fàbrica/envà.
- Morters, pastes o adhesius segons rendiment verificat.
- Plaques, perfils, muntants i fixacions.
- Impermeabilització i bandes.
- Aïllament.
- Rajoles o paviment amb patró i pèrdua explícita.
- Rejuntat.
- Perfils, cantoneres, sòcols i remats per longitud.
- Segellants.
- Protecció d'obra.
- Sacs, contenidors o gestió de residus.

L'escandall separa sempre:

- Material principal.
- Components obligatoris del sistema.
- Fixacions.
- Tractament de juntes i trobades.
- Proteccions.
- Mitjans auxiliars.
- Retalls i pèrdues.
- Residus i transport.

## 5. Fórmules base

```text
àrea_neta =
àrea_geomètrica
- obertures aplicables

quantitat_base =
àrea_neta × consum_del_sistema

quantitat_compra =
arrodonir_format_comercial(
  quantitat_base × factor_pèrdua
)
```

El factor de pèrdua depèn del material, format, patró, geometria i condicions;
no és un percentatge universal.

Els metres de perfil, banda o sòcol deriven de vores classificades, no de
l'àrea.

### Fàbrica o envà

```text
àrea_bruta =
Σ(superfícies_de_paret_nova)

àrea_neta =
àrea_bruta
- buits_descomptables

peces_base =
àrea_neta × peces_per_m2_del_format_i_junta

peces_compra =
arrodonir_paquet(
  peces_base × factor_pèrdua_contextual
)
```

No tots els buits es descompten igual en un pressupost o rendiment. La regla de
mesurament s'ha d'identificar separadament de la geometria física.

### Morter, pasta o adhesiu

```text
quantitat_base =
superfície_aplicable
× consum_declarat_per_unitat
× correcció_de_gruix_si_el_sistema_ho_permet
```

El consum prové de documentació tècnica o recepta revisada. No es deriva només
del nom genèric del producte.

### Perfils i muntants

```text
unitats =
regla_modulació(
  longitud,
  alçada,
  separació,
  reforços,
  buits,
  trobades
)
```

Les separacions i reforços depenen del sistema constructiu documentat.

## 6. Classificació del suport

Abans de proposar una capa, l'app pregunta o registra:

- Formigó.
- Fàbrica ceràmica.
- Bloc.
- Morter o arrebossat.
- Placa de guix laminat.
- Panell cimentós.
- Ceràmica existent.
- Fusta o derivat.
- Metall.
- Suport desconegut.

I el seu estat:

- Sòlid.
- Disgregat.
- Fissurat.
- Irregular.
- Pintat o contaminat.
- Humit.
- Amb sals o eflorescències.
- No inspeccionat.

Una foto pot suggerir una inspecció, però no confirma cohesió, humitat interna
o composició oculta.

## 7. Operacions de paleteria

Cada operació té entrada, resultat i dependències:

- Desmuntar o demolir.
- Netejar i preparar.
- Reparar.
- Regularitzar.
- Formar pendent.
- Executar fàbrica o envà.
- Obrir o tancar un pas no estructural validat.
- Executar regata autoritzada.
- Reomplir i reparar regata.
- Formar calaix o trasdossat.
- Preparar trobades.
- Protegir abans del següent ofici.

Els elements estructurals, façanes, sectoritzacions i mitgeres requereixen
classificació i validació específica abans de modificar-los.

## 8. Regates, passos i reserves

El model d'una regata inclou:

- Host.
- Sistema allotjat.
- Traçat 3D.
- Amplada i profunditat.
- Distància a vores i buits.
- Creuaments.
- Material del suport.
- Estat d'autorització.
- Reparació i acabat posterior.

L'app no assumeix que una paret és no estructural. Si la classificació és
desconeguda, la modificació queda bloquejada o pendent de revisió segons risc.

Els passos d'instal·lacions han de coordinar:

- Maneguet o protecció.
- Moviment i dilatació.
- Segellat.
- Impermeabilització.
- Acústica.
- Foc, si l'element té una prestació exigida.
- Accessibilitat.

## 9. Cotes i gruixos acumulats

El motor conserva:

```text
cota_suport
+ regularització
+ impermeabilització
+ adhesiu
+ acabat
= cota_final
```

Canviar una capa recalcula:

- Pas sota portes.
- Alçada d'endolls i aixetes respecte a acabat final.
- Cota de desguàs.
- Pendents.
- Trobades amb altres paviments.
- Alçada lliure.
- Mida útil de premarcs i mobles.

## 10. Coordinació amb altres oficis

Abans de tancar una capa, el model comprova:

- Punts i recorreguts elèctrics.
- Preses d'aigua i desguassos.
- Registres que han de continuar accessibles.
- Passos de ventilació.
- Premarcs i fusteries.
- Pendents i cotes finals.
- Gruixos acumulats.

La paleteria no decideix perforacions o alteracions estructurals. Qualsevol
element sospitós de ser estructural queda pendent de revisió competent.

## 11. Regles inicials

### PAL-SUPPORT-UNKNOWN-001

- Aplica quan: una operació necessita adherència, perforació, demolició o
  càrrega i el suport és desconegut.
- Resultat: informació insuficient; demanar inspecció.

### PAL-LAYER-HEIGHT-001

- Aplica quan: s'afegeix o retira una capa.
- Resultat: recalcular cota final i totes les entitats allotjades o adjacents.

### PAL-HIDDEN-SYSTEM-CLOSE-001

- Aplica quan: es vol tancar una regata, calaix, envà o fals sostre.
- Resultat: exigir estat de prova o acceptació dels sistemes ocults aplicables.
- Tipus: bona pràctica/control de qualitat pendent de política per ofici.

### PAL-STRUCTURE-UNKNOWN-001

- Aplica quan: tall, perforació o demolició sobre host no classificat.
- Resultat: revisió professional; no generar instrucció d'execució.

## 12. Regles pendents de desenvolupar

- Compatibilitat entre suport, preparació, adhesiu i acabat.
- Necessitat de regularització.
- Continuïtat d'impermeabilització.
- Tractament de trobades i passos.
- Gruix total i cota final.
- Pendents en zones aplicables.
- Juntes de moviment.
- Planificació abans de tancar regates o trasdossats.
- Amidament de residus.

Les obligacions es vincularan al CTE, disposicions aplicables, documents de
producte i instruccions de fabricant. Les bones pràctiques es documentaran per
separat i amb revisor.

## 13. Cas daurat inicial

Conversió de banyera a dutxa:

- Demolició selectiva d'acabats i banyera.
- Inspecció del suport.
- Adaptació validada d'instal·lacions.
- Regularització.
- Formació de pendent.
- Impermeabilització.
- Revestiment i paviment.
- Segellats i remats.

El test verifica amidaments per capes, cotes finals, passos, residus,
dependències d'oficis i dades desconegudes.

## 14. Fonts inicials

- CTE DB-HS:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf
- Catàleg d'Elements Constructius:
  https://www.codigotecnico.org/Recursos/Aplicaciones/CatalogoElementosConstructivos.html
- Llei 7/2022 de residus:
  https://www.boe.es/eli/es/l/2022/04/08/7/con
- Reial decret 105/2008 sobre RCD:
  https://www.boe.es/buscar/act.php?id=BOE-A-2008-2486
