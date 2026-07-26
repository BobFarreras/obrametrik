# Proves, posada en servei i lliurament — Base de coneixement inicial

**Jurisdicció inicial:** Espanya

**Estat:** base inicial pendent de revisió multidisciplinària

**Fonts:** CTE, REBT, RITE, reglaments aplicables, projecte i fabricants

**Verificat:** 26 de juliol de 2026

## 1. Objectiu

Obrametrik ha de convertir el final d'una partida o instal·lació en un procés
demostrable:

```text
executat
→ inspeccionat
→ provat
→ incidències resoltes
→ documentació completa
→ acceptat
→ posat en servei quan sigui procedent
```

“Sembla acabat” no és un resultat tècnic. Cada acceptació ha d'indicar què s'ha
comprovat, amb quin procediment, sobre quin element, amb quin resultat, qui ho
ha fet i quina evidència existeix.

## 2. Conceptes que no s'han de confondre

| Concepte         | Funció                                                             |
| ---------------- | ------------------------------------------------------------------ |
| Autocontrol      | Comprovació de l'executor durant o després del treball             |
| Prova            | Operació definida amb entrades, procediment i criteri d'acceptació |
| Inspecció        | Examen efectuat per l'agent i sota el règim que correspongui       |
| Verificació      | Confirmació del compliment d'un requisit determinat                |
| Certificat       | Document emès i signat per l'agent habilitat o competent           |
| Posada en servei | Pas administratiu i tècnic regulat quan sigui aplicable            |
| Recepció         | Acceptació de l'obra o partida amb reserves o sense                |
| Lliurament       | Transferència de documentació, ús, garanties i manteniment         |

Una fotografia, una casella marcada o una lectura introduïda per l'usuari no
substitueixen un certificat ni atribueixen competència professional.

## 3. Àmbits de control

### 3.1 Recepció de productes

- Identitat, model, variant i lot.
- Quantitat.
- Estat del subministrament.
- Prestacions i compatibilitat.
- Full de subministrament.
- Declaracions, marcatge o documentació exigible.
- Fitxa tècnica, instruccions i garantia.
- Caducitat i condicions d'emmagatzematge quan pertoqui.

### 3.2 Execució

- Suport i condicions inicials.
- Replanteig.
- Capes, components i unions.
- Mesures reals.
- Parells, pressions o ajustos quan estiguin prescrits.
- Fotografies abans d'ocultar.
- Desviacions respecte al projecte o solució confirmada.

### 3.3 Obra acabada

- Funcionament.
- Seguretat.
- Estanquitat.
- Prestacions mesurables.
- Acabats.
- Coordinació entre oficis.
- Neteja, accessibilitat i manteniment.
- Documentació final.

El CTE diferencia el control de recepció, el control d'execució i el control de
l'obra acabada. Obrametrik conserva aquesta classificació.

## 4. Model de pla de control

```ts
type InspectionAndTestPlan = {
  id: string;
  projectId: string;
  scopeEntityIds: string[];
  jurisdiction: string;
  sourceIds: string[];
  revision: string;
  status: "draft" | "approved" | "in_progress" | "closed" | "superseded";
  approvedBy?: string;
  checkpoints: Checkpoint[];
};
```

Cada punt de control defineix:

```ts
type Checkpoint = {
  id: string;
  phase: "incoming" | "execution" | "pre_cover" | "final" | "handover";
  controlType: "inspection" | "measurement" | "test" | "document";
  requiredInputs: string[];
  methodRef: string;
  acceptanceCriteria: unknown;
  requiredAgentRole: string;
  witnessRequired: boolean;
  holdPoint: boolean;
  evidenceRequirements: string[];
};
```

Els criteris provenen, segons el cas, de:

1. Reglament vigent.
2. Projecte o memòria tècnica.
3. Direcció facultativa.
4. Sistema o instruccions del fabricant.
5. Contracte i mostra aprovada.
6. Pla de control confirmat.

Un valor per defecte de l'app mai es presenta com a límit legal.

## 5. Tipus de fita

- **Punt d'espera:** no es continua sense acceptació explícita.
- **Punt de presència:** s'avisa l'agent perquè pugui presenciar el control.
- **Revisió documental:** falta un document o signatura.
- **Autocontrol:** comprovació registrada per l'executor.
- **Mostreig:** control d'una mostra amb pla i població definits.
- **Prova al 100 %:** cada element identificat necessita resultat.

### TEST-HOLD-POINT-001

- Aplica quan: una instal·lació, capa o unió quedarà oculta.
- Resultat: bloquejar el tancament si falta la prova o acceptació exigida.
- Excepció: només amb desviació formal autoritzada i traçable.

## 6. Registre d'una execució de prova

```ts
type TestRun = {
  id: string;
  checkpointId: string;
  entityIds: string[];
  startedAt: string;
  finishedAt?: string;
  performer: {
    personId: string;
    organizationId?: string;
    role: string;
    credentialRef?: string;
  };
  instrumentIds: string[];
  environmentalConditions: Record<string, unknown>;
  readings: TestReading[];
  result: "pass" | "fail" | "inconclusive" | "not_applicable";
  evidenceIds: string[];
  notes?: string;
  signatureId?: string;
};
```

Cada lectura conserva valor, unitat, precisió o incertesa quan sigui necessària,
punt mesurat, hora i criteri aplicat. No s'admet un `pass` sense les dades
obligatòries del procediment.

## 7. Instruments

Per cada instrument:

- Tipus, fabricant, model i número de sèrie.
- Rang i resolució.
- Identificador intern.
- Calibratge o verificació quan correspongui.
- Data de validesa.
- Certificat associat.
- Estat abans i després de la prova si el procediment ho exigeix.

### TEST-INSTRUMENT-VALIDITY-001

- Resultat: prova no concloent o bloquejada si l'instrument exigit no està
  identificat o no compleix les condicions de validesa definides.

L'app no inventa precisió a partir del nombre de decimals introduïts.

## 8. Evidència

Tipus:

- Fotografia o vídeo.
- Lectura manual.
- Captura d'un equip.
- Fitxer de dades.
- Croquis amb punts de mesura.
- Acta.
- Certificat.
- Signatura.
- Document del fabricant.

Cada evidència conserva:

- Autor i data.
- Projecte, espai, element i prova.
- Hash i versió del fitxer.
- Metadades rellevants.
- Estat d'aprovació.
- Política de privacitat i retenció.

Una foto s'ha d'associar a l'element concret; una galeria sense context no
demostra què va quedar instal·lat.

## 9. No-conformitats i repeticions

```text
resultat fallit
→ no-conformitat
→ classificació i responsable
→ contenció si cal
→ correcció
→ nova inspecció o prova
→ tancament amb evidència
```

La prova original no s'elimina ni se sobreescriu.

Estats:

- Oberta.
- En anàlisi.
- Correcció planificada.
- Corregida pendent de prova.
- Tancada.
- Acceptada amb desviació autoritzada.

### TEST-FAIL-CLOSE-001

- Resultat: impedir el tancament de la partida mentre existeixi una
  no-conformitat bloquejant sense resoldre.

## 10. Control de canvis

Qualsevol canvi posterior a una prova determina:

- Quins elements han canviat.
- Quines proves queden invalidades.
- Quins documents `as-built` s'han d'actualitzar.
- Quina nova acceptació és necessària.

### TEST-CHANGE-INVALIDATION-001

- Exemple: modificar una unió d'una xarxa després de la prova d'estanquitat
  invalida el resultat per a l'abast afectat.

## 11. Electricitat

El REBT assigna a l'empresa instal·ladora les verificacions prèvies a la posada
en servei. Determinades instal·lacions requereixen, a més, inspecció inicial per
un organisme de control. La documentació i els agents depenen de l'abast.

El paquet de prova pot incloure, segons projecte i reglament:

- Continuïtat dels conductors de protecció.
- Resistència d'aïllament.
- Protecció per separació de circuits quan sigui aplicable.
- Resistència de sòls i parets quan sigui aplicable.
- Tall automàtic de l'alimentació i proteccions.
- Polaritat.
- Assaigs funcionals.
- Identificació de circuits i correspondència amb quadre.
- Verificacions específiques de zones humides.
- Certificat, projecte o memòria i inspecció quan pertoquin.

Les proves les defineix el paquet REBT aplicable; la UI no ofereix una llista
universal desconnectada del tipus d'instal·lació.

## 12. Fontaneria i ACS

Controls candidats:

- Xarxes identificades.
- Prova d'estanquitat abans d'ocultar.
- Neteja o tractament requerit.
- Claus i elements accessibles.
- Cabal, pressió i funcionament als punts quan correspongui.
- Temperatures i regulació d'ACS.
- Absència de connexions creuades.
- Aïllament complet.
- Equips, vàlvules i seguretats funcionals.
- Documentació i manteniment.

La pressió, durada, medi i seqüència de la prova han de provenir del procediment
aplicable i del sistema instal·lat. No s'usa una xifra genèrica.

## 13. Sanejament

Controls candidats:

- Traçat, diàmetres i pendents confirmats.
- Suports i unions visibles abans de tancar.
- Estanquitat de la xarxa.
- Funcionament dels aparells.
- Cierres hidràulics.
- Ventilació de la xarxa.
- Registres accessibles.
- Absència de retorns, fuites i sorolls anòmals.

El DB-HS inclou proves per a les xarxes d'evacuació dins del seu àmbit. El
procediment concret s'enllaça a la secció i versió aplicables.

## 14. Impermeabilització

- Suport acceptat.
- Pendents i desguàs.
- Continuïtat de la capa.
- Solapaments, cantonades, passos i trobades.
- Gruix o consum documentat quan sigui aplicable.
- Temps de curat.
- Prova d'estanquitat definida per sistema, projecte o direcció.
- Inspecció abans de revestir.

Una prova superada no autoritza perforacions posteriors sense reavaluar la capa.

## 15. Ventilació i climatització

Per a instal·lacions dins de RITE, les proves de posada en servei i els seus
resultats formen part de la documentació final. Segons l'abast poden incloure:

- Estanquitat de xarxes.
- Neteja.
- Proves de lliure dilatació.
- Funcionament d'equips.
- Ajust i equilibrat.
- Cabals.
- Temperatures i pressions.
- Consum o potència absorbida.
- Control, alarmes i seguretats.
- Condensats.
- Qualitat de muntatge i aïllament.
- Dades nominals i dades reals.

Quan sigui preceptiu, el certificat i el registre davant l'òrgan competent són
condicions diferents de l'autocontrol intern d'Obrametrik.

## 16. Il·luminació i control

- Correspondència entre circuit, comandament, actuador i lluminària.
- Encès, commutació, regulació i escenes.
- Estat davant tall i retorn d'alimentació quan sigui rellevant.
- Sensors: cobertura, temporització i consigna.
- Lluminàries d'emergència quan siguin aplicables.
- Il·luminància i altres prestacions quan el projecte les exigeixi.
- Drivers i registres accessibles.
- Identificació de models i fotometries instal·lats.

Una lectura de lux conserva pla, posició, malla, condicions i instrument; no és
una foto del número en pantalla.

## 17. Paleteria, revestiments i paviments

- Geometria, aplomat, nivell i cotes definides pel projecte.
- Estat i preparació del suport.
- Capes i gruixos.
- Juntes i moviments.
- Planeïtat segons sistema o especificació aplicable.
- Peces, orientació, patró i remats.
- Percussió o altres controls només amb mètode i criteri acordats.
- Neteja i protecció.
- Mostra o zona de referència aprovada.

Les toleràncies depenen del sistema, projecte, fabricant i norma; no es crea una
tolerància universal de l'app.

## 18. Tancaments, fusteria i vidre

- Identificació de producte i prestacions.
- Cotes, aplomat, nivell i fixacions.
- Juntes i segellats.
- Obertura, tancament, bloqueig i ferratges.
- Col·lisions.
- Permeabilitat o estanquitat quan el pla ho exigeixi.
- Vidre, calços i proteccions.
- Persianes i motoritzacions.
- Claus, manuals i garanties.

## 19. Pintura i acabats

- Suport, reparacions i humitat acceptats.
- Sistema i lots registrats.
- Condicions d'aplicació.
- Temps entre capes i curat.
- Color, brillantor i textura contra mostra aprovada.
- Uniformitat visual sota condicions de revisió definides.
- Adherència o gruix només quan el sistema ho prescrigui.
- Remats, proteccions retirades i neteja.
- Reserva de producte etiquetada quan s'hagi acordat.

La il·luminació, distància i angle d'inspecció visual han d'estar definits per
evitar acceptacions arbitràries.

## 20. Proves integrades entre oficis

El tancament no és una suma de checklists independents. Cal provar escenaris:

- Dutxa funcionant mentre es revisen desguàs, estanquitat i evacuació.
- ACS amb temperatura, cabal, regulació i absència de fuites.
- Climatització amb condensats, alimentació, control i cabal.
- Extractor amb alimentació, comandament, pas d'aire i sortida.
- Porta i finestra sense col·lisions amb aixetes, mobles o mecanismes.
- Escena de bany amb llum, extractor i comportament dels controls.

### TEST-INTEGRATED-DEPENDENCY-001

- Resultat: no donar per complet un sistema si una dependència necessària no
  està operativa o la prova integrada no s'ha fet.

## 21. Matriu de completitud

Cada partida mostra:

| Dimensió    | Estat possible                                  |
| ----------- | ----------------------------------------------- |
| Execució    | pendent / parcial / completa                    |
| Inspecció   | no requerida / pendent / acceptada / rebutjada  |
| Proves      | no requerides / pendents / superades / fallides |
| Documents   | incomplets / complets                           |
| Incidències | obertes / resoltes                              |
| Acceptació  | pendent / amb reserves / acceptada              |

La barra global de progrés no pot ocultar un bloqueig crític darrere d'un
percentatge.

## 22. Dossier final i passaport de reforma

- Abast real executat.
- Plànols i model `as-built`.
- Productes, lots i equips.
- Fotografies d'elements ocults.
- Resultats de proves.
- Certificats i registres.
- No-conformitats i resolució.
- Manuals.
- Garanties i factures.
- Colors i referències.
- Peces de recanvi.
- Pla de manteniment.
- Responsables i dates.

El dossier diferencia document aportat, revisat, acceptat i registrat.

## 23. Regles inicials

### TEST-REQUIRED-EVIDENCE-001

- Resultat: impedir `pass` si falta l'evidència obligatòria.

### TEST-AUTHORITY-001

- Resultat: diferenciar autocontrol d'una verificació, inspecció o certificat
  reservats a un agent determinat.

### TEST-SCOPE-001

- Resultat: tota prova identifica elements i versió exacta de l'obra provada.

### TEST-DOCUMENT-CONSISTENCY-001

- Resultat: detectar divergències entre instal·lat, `as-built`, certificat i
  inventari.

### TEST-HANDOVER-001

- Resultat: no marcar el projecte com a lliurat si falta un document
  obligatori, hi ha incidències bloquejants o no s'ha acceptat l'abast.

### TEST-EXPIRY-001

- Resultat: avisar quan una prova, calibratge, permís o document ha caducat
  abans del lliurament.

## 24. Flux mòbil a peu d'obra

1. Escanejar o seleccionar espai i element.
2. Mostrar només els punts de control de la fase actual.
3. Guiar el procediment sense inventar dades.
4. Capturar lectures, instrument i evidència.
5. Permetre treball offline amb identificadors locals.
6. Signar o enviar a l'agent que ha d'acceptar.
7. Crear incidència si falla.
8. Sincronitzar mantenint autoria, hora i historial.

Els botons de resultat han de ser grans, però `pass` mai és l'opció
preseleccionada. La captura incompleta es desa com a esborrany.

## 25. Preguntes del flux

- Quin abast, versió i elements es proven?
- Quina font defineix el procediment i el criteri?
- És autocontrol, prova, verificació, inspecció o certificació?
- Qui està autoritzat o habilitat per executar-la i signar-la?
- S'ha de fer abans d'ocultar?
- Quins instruments i condicions necessita?
- Quina evidència és obligatòria?
- Què bloqueja un resultat fallit?
- Quins canvis invaliden la prova?
- Quins documents s'han de lliurar o registrar?
- Hi ha proves integrades pendents?
- El manteniment futur queda documentat?

## 26. Cas daurat

Bany complet amb:

- Xarxes d'aigua i sanejament ocultes.
- Impermeabilització i dutxa.
- Instal·lació elèctrica i il·luminació.
- Extractor.
- Revestiments, pintura, sanitari, aixetes i fusteria.

El test comprova:

- Punts d'espera abans de tapar.
- Proves d'estanquitat i funcionament vinculades a l'abast.
- Evidències geolocalitzades dins del model, no necessàriament GPS.
- Instruments i agents.
- Incidència, correcció i repetició sense perdre historial.
- Invalidació després d'un canvi.
- Prova integrada del bany.
- Coherència entre `as-built`, inventari i documents.
- Dossier final i acceptació amb reserves o sense.

## 27. Fonts

- CTE, Parte I i Anejo II:
  https://www.codigotecnico.org/index.php/menu-cte
- CTE DB-HS:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf
- REBT:
  https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099
- RITE:
  https://www.boe.es/buscar/act.php?id=BOE-A-2007-15820

Els procediments, formularis i tràmits autonòmics s'incorporaran en paquets de
jurisdicció versionats. Les instruccions del fabricant i el projecte executat
són entrades del pla de control, no text lliure desconnectat.
