# Impermeabilització de zones humides — Base de coneixement inicial

**Jurisdicció inicial:** Espanya  
**Estat:** base inicial pendent de revisió per tècnic i aplicador especialitzat  
**Fonts:** CTE aplicable, prestacions del sistema i instruccions de fabricant  
**Verificat:** 26 de juliol de 2026

## 1. Abast i límit

Aquest document cobreix zones interiors exposades a aigua:

- Dutxes.
- Banyeres i entorns immediats.
- Banys.
- Cuines i safareigs quan l'actuació ho requereixi.
- Trobades amb desguassos, passos i tancaments.

DB-HS 1 regula protecció davant humitat en murs i terres en contacte amb el
terreny, façanes i cobertes. No s'ha d'utilitzar com si contingués, per si sol,
una recepta completa i universal per a tota dutxa interior.

La solució interior es defineix mitjançant:

- Exigències reglamentàries aplicables al projecte.
- Sistema impermeable amb prestacions documentades.
- Suport compatible.
- Instruccions del fabricant.
- Detalls de trobades.
- Control d'execució.

## 2. Conceptes

| Terme | Significat |
| --- | --- |
| Zona d'exposició | Superfície o volum amb una intensitat d'aigua prevista |
| Suport | Element sobre el qual es prepara el sistema |
| Impermeabilització | Capa o conjunt continu que limita el pas d'aigua |
| Detall singular | Cantonada, junta, pas, desguàs, canvi de pla o terminació |
| Protecció | Capa que evita danyar la impermeabilització |
| Acabat | Revestiment visible, que no substitueix necessàriament la impermeabilització |

Rajola i rejuntat no es consideren automàticament una capa impermeable.

## 3. Model de zona

Cada zona registra:

- Tipus d'espai.
- Font d'aigua: dutxa, banyera, esquitxades o neteja.
- Superfícies afectades.
- Alçada o extensió definida.
- Suport.
- Pendent.
- Desguàs.
- Sistema impermeable.
- Trobades i passos.
- Estat de prova i inspecció.

La geometria 3D genera superfícies, arestes i perforacions; el sistema tècnic
decideix quines necessiten tractament.

## 4. Capes

Model orientatiu:

```text
suport confirmat
→ reparació o regularització
→ imprimació si el sistema la requereix
→ impermeabilització principal
→ bandes, peces o reforços singulars
→ protecció o adhesiu compatible
→ acabat
→ juntes i segellats de moviment
```

Cap capa s'afegeix només perquè “sempre es fa així”. Ha d'estar requerida pel
sistema, la regla o l'estat del suport.

## 5. Detalls singulars obligatoris al model

- Trobada terra-paret.
- Cantonada interior i exterior.
- Junta de moviment.
- Pas de canonada.
- Cos d'aixeta o element encastat.
- Desguàs puntual.
- Canal lineal.
- Llindar o transició.
- Trobada amb banyera o plat.
- Trobada amb premarc o mampara.
- Final superior o lateral de la zona.

Una superfície impermeabilitzada sense els detalls singulars modelats queda
incompleta.

## 6. Desguàs i pendent

El model relaciona:

- Cota del suport.
- Cota superior del desguàs.
- Gruixos de capes.
- Punts alts.
- Direcció i percentatge de pendent.
- Absència de contrapendents.
- Capacitat i compatibilitat del desguàs.

```text
pendent_percent =
(desnivell_mm / longitud_horitzontal_mm) × 100
```

El valor objectiu no és universal. Depèn de la solució, geometria, desguàs,
acabat, accessibilitat i documentació aplicable.

## 7. Compatibilitat del sistema

La regla ha de validar:

- Suport admès.
- Humitat admissible abans d'aplicar.
- Imprimació.
- Nombre de capes o gruix final documentat.
- Consum.
- Temps entre capes.
- Adhesiu o protecció posterior.
- Temperatura i condicions d'aplicació.
- Tractament dels punts singulars.
- Posada en servei.

Les dades de fitxa tècnica es versionen per producte i lot documental. No es
barregen components de sistemes diferents sense compatibilitat demostrada.

## 8. Regles inicials

### IMP-ZONE-INCOMPLETE-001

- Aplica quan: zona amb dutxa o exposició directa a aigua.
- Resultat: error si no hi ha sistema impermeable definit o decisió revisada.
- Tipus: regla de producte/bona pràctica pendent de paquet normatiu aplicable.

### IMP-DETAIL-CONTINUITY-001

- Entrades: superfícies, arestes, passos i components del sistema.
- Resultat: avís o error si la capa no és contínua en una trobada.

### IMP-DRAIN-CONNECTION-001

- Aplica quan: impermeabilització acaba en desguàs o canal.
- Resultat: requerir detall compatible i documentat entre sistema i desguàs.

### IMP-PENETRATION-001

- Aplica quan: una canonada, aixeta o fixació travessa la zona.
- Resultat: generar detall de segellat compatible; no considerar cobert només
  per aplicar material al voltant.

### IMP-COVER-BEFORE-APPROVAL-001

- Aplica quan: es vol cobrir la impermeabilització.
- Resultat: exigir inspecció i prova definida pel pla de qualitat o sistema.

### IMP-TILE-NOT-MEMBRANE-001

- Aplica quan: l'única capa declarada és ceràmica, adhesiu o rejuntat.
- Resultat: informació insuficient; no marcar la zona com impermeabilitzada.

## 9. Control de qualitat

Estats:

```text
suport inspeccionat
→ detalls preparats
→ sistema aplicat
→ gruix/consum registrat
→ curat
→ inspeccionat
→ prova registrada
→ autoritzat per cobrir
→ cobert
```

Evidències possibles:

- Fotografies abans de cobrir.
- Producte, lot i fitxa.
- Consum real.
- Mesura de gruix quan el sistema ho contempli.
- Temps i condicions.
- Resultat de prova.
- Incidències i reparacions.

## 10. Escandall

- Imprimació.
- Membrana líquida, làmina o panell segons sistema.
- Bandes de cantonada.
- Peces interiors/exteriors.
- Maneguets per passos.
- Connexió o peça de desguàs.
- Adhesiu o material d'unió.
- Segellants.
- Protecció temporal.
- Eines i consumibles específics.

### Superfície

```text
àrea_zona =
Σ(superfícies_classificades)

quantitat_producte =
àrea_zona
× consum_documentat
× nombre_de_capes_si_el_consum_no_les_inclou
```

### Detalls lineals

```text
metres_banda =
Σ(arestes_classificades)
+ solapaments_documentats
+ reserva_explícita
```

### Peces

- Cantonades → peces compatibles o amidament de banda segons sistema.
- Passos → un maneguet per pas compatible.
- Desguassos → una connexió per punt.

No s'aplica un percentatge genèric per substituir el recompte de singularitats.

## 11. Preguntes del flux

- Quin tipus de dutxa o banyera hi ha?
- Quines superfícies reben aigua directa?
- Quin suport existeix i en quin estat?
- Quin sistema impermeable es farà servir?
- Quins passos i elements encastats hi ha?
- Quin desguàs i connexió utilitza?
- Quines cotes i pendents són necessàries?
- Hi ha juntes de moviment?
- Com acaba la impermeabilització als límits?
- Quin control es farà abans de cobrir?

## 12. Cas daurat

Dutxa arran de terra amb:

- Canal lineal.
- Tres parets.
- Un cos de dutxa encastat.
- Dues sortides.
- Mampara.
- Transició amb paviment exterior.

El test comprova:

- Superfícies i arestes classificades.
- Pendent i cotes finals.
- Connexió al canal.
- Maneguets.
- Continuïtat.
- Quantitats per consum i detalls.
- Estat de prova abans de cobrir.

## 13. Fonts i referències inicials

- CTE DB-HS:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf
- CTE DB-SUA:
  https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf
- Document de suport sobre lliscament:
  https://www.codigotecnico.org/pdf/Documentos/SUA/DA_SUA_3_Resbaladicidad.pdf

En seleccionar productes s'han d'incorporar declaracions de prestacions,
fitxes i les normes de producte aplicables sense reproduir contingut protegit.
