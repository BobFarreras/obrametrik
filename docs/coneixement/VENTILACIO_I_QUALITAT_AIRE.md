# Ventilació i qualitat de l'aire — Base de coneixement inicial

**Jurisdicció inicial:** Espanya  
**Estat:** base inicial pendent de revisió per tècnic competent  
**Fonts:** CTE DB-HS 3, DB-HR i RITE quan sigui aplicable  
**Verificat:** 26 de juliol de 2026

## 1. Objectiu

Modelar i calcular:

- Admissió d'aire exterior.
- Transferència entre espais.
- Extracció de locals humits.
- Extracció específica de cocció.
- Conductes, boques, ventiladors i controls.
- Soroll, condensacions, foc i manteniment.
- Escandall complet.

Ventilar no és només afegir un extractor. La xarxa ha de tenir un recorregut
continu i equilibrat des de l'entrada fins a l'expulsió.

## 2. Sistemes diferenciats

- Ventilació general de l'habitatge.
- Ventilació natural complementària.
- Extracció específica de cocció.
- Ventilació de locals no habitables.
- Ventilació associada a climatització, quan correspongui.

No es fusionen xarxes perquè comparteixin fals sostre. Cada sistema conserva
ús, cabal, contaminació, conducte i punt d'expulsió.

## 3. Flux d'aire de l'habitatge

DB-HS 3 estableix que l'aire circuli dels locals secs als humits:

```text
exterior
→ admissió en dormitori/sala/menjador
→ obertura de pas
→ bany/lavabo/cuina
→ extracció
→ conducte
→ expulsió
```

El model classifica cada espai com sec, humit, ús mixt, no habitable o
desconegut.

### VENT-AIRFLOW-DIRECTION-001

- Entrades: tipus d'espais, admissions, passos i extraccions.
- Resultat: error si no existeix recorregut del local sec al local humit.
- Font: DB-HS 3, 3.1.1.

## 4. Components

### Admissió

- Airejador.
- Obertura fixa.
- Microventilació quan sigui admissible.
- Conducte d'admissió.
- Boca de presa exterior.
- Filtre.

### Pas

- Airejador de transferència.
- Reixeta.
- Folgança sota porta quan compleixi la funció i àrea efectiva.
- Silenciador de transferència.

### Extracció

- Boca o vàlvula d'extracció.
- Conducte.
- Aspirador mecànic o híbrid.
- Extractor local.
- Vàlvula antiretorn.
- Regulador de cabal.
- Boca d'expulsió.

### Control

- Cabal constant.
- Presència.
- Humitat.
- Contaminants.
- Temporització.
- Control manual.
- Sistema central.

## 5. Cabals

El paquet normatiu ha de conservar íntegrament les taules vigents de DB-HS 3
com a dades versionades. Per a habitatges, el càlcul considera:

- Nombre de dormitoris.
- Dormitori principal.
- Altres dormitoris.
- Sales d'estar i menjadors.
- Nombre i tipus de locals humits.
- Ocupació/no ocupació.
- Sistema de cabal constant o variable.

No s'ha de copiar un únic cabal de bany a tots els projectes.

### Extracció de cocció

DB-HS 3 considera satisfeta la condició d'extracció específica en la zona de
cocció amb un cabal mínim de 50 l/s, independent de la ventilació general.

### VENT-KITCHEN-SPECIFIC-001

- Aplica quan: cuina d'habitatge amb zona de cocció.
- Resultat: sistema mecànic específic, cabal mínim de referència de 50 l/s i
  conducte independent de la ventilació general.
- Font: DB-HS 3, apartats 2 i 3.1.1.

La campana de recirculació sense expulsió no es considera automàticament
equivalent a aquesta extracció.

## 6. Abertures

Cada obertura registra:

- Tipus.
- Espai o conducte connectat.
- Cabal assignat.
- Àrea efectiva declarada.
- Posició i alçada.
- Regulació.
- Prestació acústica.
- Protecció davant pluja o insectes quan correspongui.

DB-HS 3 dimensiona l'àrea efectiva segons cabal i tipus d'obertura. Entre les
fórmules de la taula 4.1:

```text
admissió: max(4 × qv, 4 × qva)
extracció: max(4 × qv, 4 × qve)
pas: max(70 cm², 8 × qvp)
```

Les variables de cabal es calculen mitjançant l'equilibrat de la xarxa.

### Posició d'extracció

Per a habitatges, DB-HS 3 situa les obertures d'extracció:

- A menys de 200 mm del sostre.
- A més de 100 mm d'un racó o cantonada vertical.
- En el compartiment més contaminat quan el local està compartimentat.

Aquestes distàncies es comproven directament sobre el model 3D.

## 7. Conductes

Cada tram registra:

- Xarxa.
- Secció i forma.
- Longitud 3D.
- Cabal acumulat.
- Velocitat i pèrdua de càrrega quan es calculin.
- Material i estanquitat.
- Aïllament i cota.
- Accessoris i registres.
- Pas per elements constructius.

Regles:

- No hi ha obstacles o reduccions arbitràries.
- La secció deriva del cabal i mètode aplicable.
- Es preveu registre i neteja.
- Es controla condensació.
- Els passos amb prestació de foc conserven la sectorització.
- L'expulsió es coordina amb admissions, finestres i zones ocupades.

## 8. Banys i lavabos

L'assistent pregunta:

- Hi ha sistema general existent?
- On és la boca d'extracció?
- Quin conducte serveix?
- Quin cabal té o ha de tenir?
- L'espai està compartimentat?
- On és el vàter?
- Hi ha admissió o pas suficient des del local sec?
- L'extractor té manteniment accessible?
- Pot generar soroll o vibració?

Afegir un ventilador sense camí d'entrada d'aire pot impedir el cabal previst.

## 9. Cuina

Es modelen per separat:

- Extracció general del local humit.
- Extracció de la zona de cocció.
- Campana o captació.
- Filtre de greix.
- Conducte específic.
- Antiretorn.
- Descàrrega.

## 10. Soroll, condensacions i foc

El sistema registra:

- Potència sonora declarada.
- Transmissió per conducte.
- Velocitat d'aire.
- Silenciadors i suports antivibratoris.
- Risc de punt de rosada.
- Aïllament i barrera de vapor aplicable.
- Pas per elements amb prestació de foc.

Es coordina amb DB-HR, DB-SI, RITE i dades de fabricant. Una etiqueta comercial
de “silenciós” no és una verificació acústica.

## 11. Manteniment

- Aspiradors accessibles.
- Filtres extraïbles.
- Registres de conducte.
- Boques netejables.
- Fals sostre amb trampilles coordinades.
- Manual i periodicitat.

Un equip ocult sense accés queda en conflicte abans de tancar el fals sostre.

## 12. Escandall

- Airejadors.
- Reixetes i boques.
- Conducte per forma, material i secció.
- Colzes, tes, transicions i derivacions.
- Reguladors i antiretorn.
- Ventiladors/aspiradors.
- Filtres i silenciadors.
- Aïllament i suports.
- Connexions flexibles.
- Segellats i passos.
- Registres i trampilles.
- Cablejat, protecció i control.

La longitud prové del recorregut 3D; els accessoris provenen dels nodes.

## 13. Regles inicials

### VENT-DRY-WET-PATH-001

- Resultat: tots els locals servits han de tenir recorregut d'aire coherent.

### VENT-ORPHAN-TERMINAL-001

- Resultat: admissió o extracció sense xarxa/origen/destí és incompleta.

### VENT-MAINTENANCE-ACCESS-001

- Resultat: equip o filtre ocult sense accés és conflicte.

### VENT-FIRE-CROSSING-001

- Resultat: pas per element amb prestació de foc requereix detall compatible.

### VENT-KITCHEN-MIX-001

- Resultat: no fusionar extracció específica de cocció amb xarxa general quan
  DB-HS 3 exigeix independència.

## 14. Cas daurat

Habitatge de dos dormitoris amb:

- Admissions en dormitoris i sala.
- Passos sota portes.
- Extracció en bany i cuina.
- Campana amb conducte específic.
- Fals sostre parcial.

El test comprova cabals, equilibrat, àrees efectives, recorreguts, accessos,
condensació, soroll i escandall.

## 15. Fonts

- CTE DB-HS:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf
- CTE DB-HR:
  https://www.codigotecnico.org/pdf/Documentos/HR/DBHR.pdf
- RITE:
  https://www.boe.es/buscar/act.php?id=BOE-A-2007-15820

Les taules i fórmules es publicaran com a regles només després de transcripció
verificada, revisió i casos de prova.
