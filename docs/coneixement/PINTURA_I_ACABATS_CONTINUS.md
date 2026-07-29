# Pintura i acabats continus — Base de coneixement inicial

**Jurisdicció inicial:** Espanya

**Estat:** base inicial pendent de revisió per pintor i tècnic

**Fonts:** fitxes de producte, UNE-EN 13300, RD 227/2006 i CTE aplicable

**Verificat:** 26 de juliol de 2026

## 1. Objectiu

Convertir una superfície i el seu estat en:

- Diagnosi del suport.
- Preparació necessària.
- Sistema de capes compatible.
- Color i acabat.
- Quantitats per producte i envàs.
- Temps de repintat i posada en servei.
- Proteccions, eines i residus.
- Resultat auditable.

“Pintar una paret” no equival només a multiplicar `m² × litres`.

## 2. Àmbit inicial

- Parets i sostres interiors minerals.
- Placa de guix laminat.
- Pintura existent.
- Fusta interior.
- Metall interior.
- Acabats continus decoratius.
- Reparacions locals.

Façanes, protecció contra foc, anticorrosió especial, paviments industrials,
fusta exterior i tractaments sanitaris necessiten paquets específics.

## 3. Model de superfície

Cada superfície registra:

- Geometria neta.
- Suport.
- Recobriment existent.
- Estat.
- Humitat.
- Alcalinitat o altres assaigs quan siguin aplicables.
- Brillantor existent.
- Color actual.
- Reparacions.
- Exposició.
- Ús i neteja prevista.
- Acabat desitjat.
- Elements que no s'han de pintar.

La inspecció visual no confirma humitat interna, adherència o contaminació.

## 4. Diagnosi del suport

Estats possibles:

- Nou i no pintat.
- Pintat i estable.
- Pulverulent o disgregat.
- Amb mala adherència.
- Fissurat.
- Amb forats o cops.
- Amb taques.
- Amb greix o contaminació.
- Amb floridura aparent.
- Amb eflorescències.
- Humit.
- Diferències d'absorció.
- Desconegut.

Cada problema genera una pregunta, assaig o operació; no una capa de pintura
automàtica.

### PAINT-SUPPORT-UNKNOWN-001

- Aplica quan: el sistema depèn del suport i no està identificat.
- Resultat: informació insuficient.

### PAINT-MOISTURE-CAUSE-001

- Aplica quan: hi ha humitat o dany recurrent.
- Resultat: investigar i resoldre la causa abans de prescriure l'acabat.

Pintura “antihumitat” no substitueix la reparació d'una filtració,
condensació o fuita.

## 5. Operacions de preparació

- Protegir i emmascarar.
- Desmuntar mecanismes o accessoris quan procedeixi.
- Netejar.
- Desgreixar.
- Eliminar material no adherit.
- Rascar o decapar.
- Tractar contaminació amb sistema compatible.
- Obrir i reparar fissures segons diagnosi.
- Emplenar forats.
- Aplicar pasta.
- Polir.
- Aspirar pols.
- Segellar juntes.
- Igualar absorció.
- Imprimar.

Les operacions conserven superfície, longitud o unitats i alimenten l'escandall.

## 6. Sistema de capes

```text
suport diagnosticat
→ neteja/preparació
→ reparació
→ imprimació o consolidació
→ capa intermèdia si aplica
→ acabat 1
→ acabat 2 o capes necessàries
```

Cada capa registra:

- Producte i variant.
- Funció.
- Consum.
- Dilució autoritzada.
- Mètode.
- Gruix o rendiment declarat.
- Condicions ambientals.
- Temps de repintat.
- Temps de curat.
- Compatibilitat.

El nombre de capes no és universal. Depèn del sistema, contrast de color,
absorció, aplicació i poder cobrent declarat.

## 7. Classificació del producte

Per a pintures de parets i sostres interiors, UNE-EN 13300:2023 proporciona
una classificació. El model ha de poder conservar les propietats declarades,
com ara:

- Ús.
- Brillantor.
- Resistència al fregament humit.
- Poder cobrent/relació de contrast.
- Granulometria quan sigui aplicable.

Obrametrik no dedueix aquestes prestacions de paraules comercials.

### PAINT-CLASSIFICATION-VERSION-001

- Entrades: producte, norma, versió i prestacions.
- Resultat: acceptar, marcar històric o requerir dades vigents.
- Referència inicial: UNE-EN 13300:2023.

## 8. Color

Cada selecció conserva:

- Sistema de color i codi.
- Marca i col·lecció.
- Nom comercial.
- Base de tintat.
- Fórmula o referència quan sigui disponible.
- Brillantor.
- Lot.
- Mostra aprovada.
- Il·luminació sota la qual s'ha revisat.

Una captura RGB/hexadecimal és útil per a UI, però no és una especificació
física suficient per comprar o reproduir pintura.

### Canvi de color

El motor considera:

- Color actual.
- Color final.
- Contrast.
- Base de tintat.
- Imprimació recomanada.
- Poder cobrent.
- Nombre de capes confirmat o estimat.

## 9. Amidament geomètric

```text
àrea_bruta =
Σ(superfícies_host)

àrea_no_pintada =
Σ(obertures + revestiments + elements_exclosos)

àrea_neta =
àrea_bruta - àrea_no_pintada
```

Les arestes generen amidaments separats:

- Segellats.
- Talls de color.
- Perfils.
- Cinta.
- Cantonades.

Portes i finestres poden excloure el buit però afegir brancals, llinda o
elements pintables. La geometria decideix cada cara.

## 10. Consum i envasos

Quan el fabricant declara rendiment en `m²/l`:

```text
litres_capa =
àrea_neta / rendiment_documentat_m2_per_l

litres_sistema =
Σ(litres_capa × nombre_capes_equivalent)
```

Quan declara consum en `kg/m²`:

```text
kg_capa =
àrea_neta × consum_documentat_kg_per_m2
```

Després:

```text
quantitat_compra =
optimitzar_envasos(
  quantitat_base + reserva_explícita,
  formats_disponibles
)
```

L'optimitzador pot comparar combinacions d'envasos per minimitzar cost o
sobrant, però no barreja lots o bases incompatibles sense confirmació.

## 11. Reparacions

Amidaments:

- Forats: unitats i mida.
- Fissures: longitud, amplada i diagnosi.
- Pasta general: `m²` i gruix.
- Cantoneres: metres.
- Malla: `m²` o metres segons sistema.
- Taques: àrea i tipus.

Una fissura recurrent o d'origen desconegut no es resol només amb massilla.

## 12. Fusta

Dades:

- Espècie o suport derivat.
- Interior/exterior.
- Acabat existent.
- Estat.
- Humitat quan sigui rellevant.
- Nusos, resines o tanins.
- Transparència/opacitat.
- Brillantor.

Sistema candidat:

- Neteja i polit.
- Tractament específic si aplica.
- Imprimació/fons.
- Esmalt, vernís o lasur compatible.

La selecció depèn de l'ús i fitxa, no només del color.

## 13. Metall

Dades:

- Metall.
- Galvanitzat o no.
- Oxidació.
- Recobriment existent.
- Interior/exterior.
- Exposició.

Sistema candidat:

- Preparació mecànica/química compatible.
- Imprimació adequada.
- Capes intermèdies.
- Acabat.

Les proteccions anticorrosives especials requereixen un paquet tècnic propi.

## 14. Banys i cuines

Comprovacions:

- Causa de la humitat.
- Ventilació.
- Condensació.
- Zones amb aigua directa.
- Superfícies impermeabilitzades o ceràmiques.
- Neteja prevista.
- Compatibilitat amb segellants.
- Temps de curat abans d'ús.

La pintura no substitueix impermeabilització en una zona que la necessita.

## 15. COV, etiquetatge i documentació

El RD 227/2006 limita el contingut total de compostos orgànics volàtils de les
categories incloses i estableix requisits de producte i etiquetatge.

Cada producte registra:

- Categoria legal.
- Base aigua o dissolvent.
- Límit aplicable.
- Contingut màxim declarat en `g/l` preparat per a ús.
- Dilució i components.
- Etiqueta i fitxa.
- Data i versió.

### PAINT-VOC-001

- Entrades: jurisdicció, categoria, base, data i contingut declarat.
- Resultat: compatible, incompatible o informació insuficient.
- Font: RD 227/2006 i modificacions.

“Baix en COV” no és una dada suficient sense categoria i valor.

## 16. Condicions i seqüència

Cada aplicació conserva:

- Temperatura.
- Humitat relativa.
- Ventilació.
- Estat del suport.
- Temps entre capes.
- Curat.
- Ocupació o reentrada segons documentació aplicable.

El planificador no permet solapar una segona capa abans del temps mínim
documentat ni tancar una habitació sense considerar ventilació i curat.

## 17. Proteccions i logística

- Paviments.
- Mobiliari.
- Sanitaris.
- Fusteries.
- Mecanismes.
- Lluminàries.
- Zones de tall.
- Emmagatzematge.
- Ventilació.
- Neteja.

La superfície protegida i metres de cinta es deriven de la geometria, no d'un
percentatge genèric.

## 18. Escandall

- Netejadors i preparadors.
- Reparació i pastes.
- Malles i cantoneres.
- Abrasius.
- Imprimacions.
- Pintures, esmalts o vernissos.
- Diluent autoritzat.
- Segellants.
- Cinta i protecció.
- Rodets, brotxes i recanvis.
- Cubetes, reixetes i consumibles.
- Filtres o equips específics quan pertoqui.
- Envasos i gestió de residus.

Cada material mostra superfície/origen, capa, rendiment, nombre de capes,
envàs, sobrant i hipòtesis.

## 19. Regles inicials

### PAINT-SYSTEM-COMPLETE-001

- Resultat: no prescriure acabat sense suport, preparació i compatibilitat.

### PAINT-COAT-TIME-001

- Resultat: validar seqüència contra temps documentats.

### PAINT-COVERAGE-001

- Resultat: consum per capa i contrast, amb estat estimat o confirmat.

### PAINT-WET-AREA-001

- Resultat: evitar que pintura substitueixi una capa funcional requerida.

### PAINT-BATCH-001

- Resultat: conservar lot i fórmula en superfícies contínues quan sigui
  rellevant.

### PAINT-PROTECTION-001

- Resultat: generar proteccions segons superfícies i elements adjacents.

## 20. Preguntes del flux

- Quin suport i pintura existeixen?
- Estan adherits?
- Hi ha humitat, fissures o taques?
- S'ha resolt la causa?
- Quin ús i neteja tindrà?
- Quin color i brillantor?
- Quin sistema declara el fabricant?
- Quantes capes i quin rendiment?
- Quins elements es protegeixen?
- Quins temps de repintat i curat?
- Quin contingut de COV declara?
- Cal conservar pintura del mateix lot?

## 21. Cas daurat

Bany parcialment enrajolat:

- Sostre pintat.
- Parets pintades fora de zona ceràmica.
- Finestra i porta.
- Reparacions locals.
- Canvi de color fosc a clar.
- Ventilació existent.

El test comprova àrea neta, brancals, preparació, capes, rendiment, envasos,
proteccions, temps, COV i escandall.

## 22. Fonts

- RD 227/2006:
  https://www.boe.es/buscar/act.php?id=BOE-A-2006-3377
- UNE-EN 13300:2023:
  https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma?c=N0071498
- CTE DB-HS:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf

Les fitxes tècniques, fitxes de seguretat i instruccions de cada producte són
entrades versionades del sistema.
