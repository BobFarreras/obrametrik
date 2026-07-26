# Fontaneria i sanejament — Base de coneixement inicial

**Jurisdicció:** Espanya  
**Estat:** base inicial pendent de revisió professional  
**Fonts inicials:** CTE DB-HS 4 i DB-HS 5  
**Verificat:** 26 de juliol de 2026

## 1. Abast

- Aigua freda.
- Aigua calenta sanitària.
- Claus de tall.
- Canonades, accessoris i aïllament.
- Aparells i equips.
- Evacuació d'aigües.
- Sifons, ramals, baixants, ventilació i registres.
- Escandall i comprovacions de connexió.

## 2. Dades mínimes

- Tipus d'actuació i jurisdicció.
- Origen del subministrament.
- Pressions o dades disponibles.
- Sistema existent i material.
- Equips productors d'ACS.
- Aparells previstos.
- Simultaneïtat i cabals de càlcul aplicables.
- Recorreguts, longituds i desnivells.
- Diàmetres i pendents confirmats o pendents.
- Claus i registres accessibles.
- Xarxa d'evacuació existent.

## 3. Components

### Subministrament

- Origen.
- Comptador quan formi part de l'abast.
- Clau general.
- Distribuïdor o col·lector.
- Ramal.
- Clau de local humit.
- Clau d'aparell.
- Presa AF.
- Presa ACS.
- Vàlvula, filtre, reductor o antiretorn quan correspongui.
- Equip productor.

### Evacuació

- Desguàs d'aparell.
- Sifó.
- Ramal.
- Col·lector.
- Baixant.
- Ventilació.
- Registre.
- Embornal o canal.

## 4. Relacions funcionals

Un lavabo habitual genera candidats a:

- Presa AF.
- Presa ACS si el projecte en disposa.
- Claus accessibles.
- Aixeta o mesclador.
- Desguàs.
- Sifó.
- Connexió a ramal d'evacuació.

“Candidat” no significa confirmat. L'usuari valida la solució i el motor aplica
les regles del context.

## 5. Regles inicials de subministrament

### FONT-ROOM-ISOLATION-001

- Tipus: normativa.
- Aplica quan: instal·lació particular amb bany, cuina o altre local humit.
- Resultat: la derivació al local humit és independent i disposa de tall per a
  aigua freda i aigua calenta quan existeixi ACS.
- Font: DB-HS 4, 3.2.1.3.

### FONT-FIXTURE-ISOLATION-001

- Tipus: normativa.
- Aplica quan: punt de consum o aparell inclòs a l'àmbit de DB-HS 4.
- Resultat: necessitat de clau de tall individual.
- Font: DB-HS 4, 3.2.1.3.

### FONT-ACCESSIBILITY-001

- Tipus: normativa i manteniment.
- Resultat: les claus que ho requereixen han de quedar identificables i
  accessibles segons la seva funció.
- Font: DB-HS 4, apartats aplicables de 3.2.

L'app ha de diferenciar:

- Clau general.
- Clau de l'habitatge.
- Claus del local humit AF/ACS.
- Clau individual de l'aparell.
- Vàlvula de retenció.

No totes les vàlvules tenen la mateixa funció ni es poden fusionar en una sola
línia de material.

## 6. Diàmetres mínims inicials de subministrament

Resum de DB-HS 4, taula 4.2, per ramals d'enllaç domèstics de coure o plàstic.
Són mínims; el dimensionament complet depèn de cabal, pressió, velocitat,
pèrdues de càrrega i característiques del sistema.

| Aparell | Diàmetre mínim |
| --- | ---: |
| Rentamans | 12 mm |
| Lavabo o bidet | 12 mm |
| Dutxa | 12 mm |
| Banyera | 20 mm |
| Inodor amb cisterna | 12 mm |
| Aigüera domèstica | 12 mm |
| Rentavaixelles domèstic | 12 mm |
| Rentadora domèstica | 20 mm |

La taula 4.3 estableix 20 mm com a mínim de coure o plàstic per a l'alimentació
d'un local humit privat —bany, lavabo o cuina—, sense substituir el
dimensionament complet de la xarxa.

### FONT-BRANCH-MIN-DN-001

- Entrades: tipus d'aparell, material de la canonada i ús.
- Resultat: diàmetre mínim candidat de la taula aplicable.
- Estat si falta material: informació insuficient.
- Font: DB-HS 4, 4.3, taules 4.2 i 4.3.

## 7. Evacuació: unitats de desguàs

DB-HS 5 utilitza unitats de desguàs `UD`, diferenciant ús privat i públic.
Resum inicial per a ús privat:

| Aparell | UD | Sifó/derivació mínima |
| --- | ---: | ---: |
| Lavabo | 1 | 32 mm |
| Bidet | 2 | 32 mm |
| Dutxa | 2 | 40 mm |
| Banyera | 3 | 40 mm |
| Inodor amb cisterna | 4 | 100 mm |
| Aigüera de cuina | 3 | 40 mm |
| Safareig | 3 | 40 mm |
| Embornal sifònic | 1 | 40 mm |
| Rentavaixelles | 3 | 40 mm |
| Rentadora | 3 | 40 mm |

Condicions que no es poden ometre:

- Els valors de derivació individual indicats són vàlids per a longituds de
  fins a 1,5 m.
- Per a longituds superiors cal càlcul segons longitud, pendent i cabal.
- El diàmetre no disminueix en sentit aigües avall.
- Els ramals col·lectors es dimensionen segons UD acumulades i pendent.

### SAN-FIXTURE-UD-001

- Entrades: aparell i ús privat/públic.
- Sortides: UD i diàmetre mínim de sifó/derivació.
- Font: DB-HS 5, 4.1.1.1, taula 4.1.

### SAN-LONG-BRANCH-001

- Aplica quan: derivació individual superior a 1.500 mm.
- Resultat: no acceptar automàticament el diàmetre tabulat; requerir càlcul
  pormenoritzat amb longitud, pendent i cabal.
- Font: DB-HS 5, 4.1.1.1.

### SAN-NO-DOWNSTREAM-REDUCTION-001

- Aplica quan: dos trams consecutius d'evacuació.
- Resultat: error si el tram aigües avall té menys diàmetre.
- Font: DB-HS 5, 4.1.1.1.

## 8. Model de xarxa

Cada tram de subministrament registra:

- Xarxa AF o ACS.
- Diàmetre interior/exterior segons el sistema.
- Material i sèrie.
- Longitud 3D.
- Accessoris inicial/final.
- Cabal de càlcul.
- Velocitat.
- Pèrdua de càrrega.
- Aïllament.
- Estat i nivell de confirmació.

Cada tram d'evacuació registra:

- Aigües residuals, pluvials o condensats.
- Diàmetre.
- Longitud.
- Cota inicial i final.
- Pendent i sentit de flux.
- UD acumulades o cabal.
- Unions, sifons i registres.
- Estat i nivell de confirmació.

La vista 3D ha de poder dibuixar l'eix, el diàmetre exterior i l'espai necessari
per a pendent, accessoris i manteniment.

## 9. Escandall

- Metres de canonada per sistema, material i diàmetre.
- Aïllament.
- Colzes, tes, maneguets i transicions.
- Claus i vàlvules.
- Suports i fixacions.
- Preses i plaques.
- Sifons i connexions.
- Canonada d'evacuació per diàmetre.
- Registres.
- Segellats i consumibles.

Els accessoris deriven dels nodes i canvis de direcció del recorregut, no d'un
percentatge opac.

### Càlcul de canonada

```text
longitud_neta_sistema_diàmetre =
Σ(longitud_3D_dels_trams_compatibles)

longitud_compra =
arrodoniment_comercial(
  longitud_neta_sistema_diàmetre
  + reserves_explícites
)
```

Els recorreguts AF, ACS i evacuació no es barregen. L'aïllament es calcula
sobre els trams on aplica i amb el diàmetre corresponent.

### Càlcul d'accessoris

- Canvi de direcció modelat → colze o corba candidata.
- Derivació modelada → te, col·lector o accessori candidat.
- Canvi de sistema/material → transició.
- Punt terminal → presa, vàlvula i connexió aplicables.
- Punt registrable → registre o element d'accés.

La selecció final depèn del sistema comercial i les instruccions del fabricant.

## 10. Preguntes del flux

- L'actuació conserva o substitueix la xarxa existent?
- Quin material i sistema existeixen?
- On són les claus generals i del local humit?
- Quin equip produeix ACS?
- Quins aparells necessiten AF, ACS o ambdues?
- Quina cota té cada presa i desguàs?
- On és la baixant o connexió disponible?
- Quines longituds i pendents són geomètricament possibles?
- Els registres continuen accessibles?
- Es coneixen pressió, cabal i diàmetres existents?

## 11. Regles pendents de desenvolupar

- Integritat de connexions AF/ACS.
- Seccionament i accessibilitat de claus.
- Compatibilitat de materials.
- Protecció i aïllament.
- Separacions i encreuaments.
- Dimensionament per cabal.
- Pendent i diàmetre d'evacuació.
- Sifonament.
- Registres.
- Condensacions i dilatacions.
- Prevenció de retorns.

Cada regla necessita l'apartat exacte de DB-HS o altra disposició aplicable,
casos de prova i revisor.

## 12. Cas daurat inicial

Bany privat amb:

- Lavabo amb AF, ACS, dues claus, sifó i evacuació.
- Inodor amb cisterna, AF, clau i evacuació.
- Dutxa amb AF, ACS, mesclador i evacuació.
- Claus AF/ACS del local humit.
- Connexió a una baixant coneguda.

El test comprova:

- Cap terminal sense connexió.
- Diàmetres mínims candidats.
- UD acumulades.
- Pendent i no reducció aigües avall.
- Accessibilitat de claus i registres.
- Metres i accessoris per sistema.
- Dades pendents i fonts de cada regla.

## 13. Fonts

- CTE DB-HS vigent:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf
- Portal oficial de documents del CTE:
  https://www.codigotecnico.org/DocumentosCTE/DocumentosCTE.html

No s'han d'omplir valors normatius de memòria. El desenvolupament d'aquest
document continuarà apartat per apartat sobre la versió oficial.
