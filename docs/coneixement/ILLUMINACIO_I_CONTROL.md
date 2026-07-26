# Il·luminació i control — Base de coneixement inicial

**Jurisdicció inicial:** Espanya

**Estat:** base inicial pendent de revisió per especialista en il·luminació

**Fonts:** REBT, CTE segons àmbit, normes UNE aplicables i fotometria

**Verificat:** 26 de juliol de 2026

## 1. Objectiu

Obrametrik ha de permetre:

- Col·locar punts de llum i lluminàries en 2D, alçat i 3D.
- Definir què il·lumina cada element.
- Relacionar comandaments, sensors, circuits i escenes.
- Fer una estimació luminotècnica inicial.
- Importar fotometries per a un càlcul detallat posterior.
- Generar escandall elèctric i de muntatge.
- Detectar enlluernament, ombres o zones sense cobertura de manera orientativa.

Un punt de llum és una connexió elèctrica. Una lluminària és un producte amb
distribució fotomètrica. Una escena és un estat de control. No són la mateixa
entitat.

## 2. Àmbit normatiu

### Habitatges

- El REBT i la ITC-BT-25 defineixen circuits i punts mínims d'utilització.
- C1 és el circuit funcional d'il·luminació en habitatges dins del seu àmbit.
- La taula 2 de la ITC-BT-25 relaciona punts mínims amb tipus d'espai i
  superfície.
- Les zones de banyera i dutxa es comproven amb ITC-BT-27.

### HE 3

DB-HE 3 exclou del seu àmbit les instal·lacions interiors dels habitatges.
L'app no ha de presentar els requisits d'HE 3 com si fossin exigències
residencials.

### Llocs de treball

UNE-EN 12464-1:2022 tracta il·luminació de llocs de treball interiors. Només
s'utilitza quan l'ús i l'àmbit corresponen; no com a taula de lux universal per
a qualsevol estança domèstica.

### Emergència

La il·luminació d'emergència és un sistema separat amb fonts i regles pròpies.
No es dedueix automàticament de la il·luminació normal ni s'aplica a tots els
espais sense verificar l'àmbit.

## 3. Vocabulari

| Terme | Significat |
| --- | --- |
| Punt de llum | Connexió preparada per alimentar una lluminària |
| Lluminària | Equip que distribueix, filtra o transforma la llum |
| Font | Component emissor integrat o substituïble |
| Grup | Conjunt de lluminàries controlades conjuntament |
| Escena | Valors de grups i controls per a una activitat |
| Pla de treball | Superfície sobre la qual s'avalua una tasca visual |
| Fotometria | Distribució espacial mesurada de la lluminària |

## 4. Model de lluminària

Cada lluminària registra:

- Fabricant, model i variant.
- Muntatge: sostre, encastat, superfície, paret, suspès, terra o mobiliari.
- Posició, orientació i altura en `mm`.
- Dimensions i volum de reserva.
- Flux lluminós declarat.
- Potència.
- Eficàcia.
- Distribució o angle de feix.
- Temperatura de color.
- Reproducció cromàtica.
- Enlluernament declarat quan sigui aplicable.
- Regulació i protocol.
- Grau IP/IK quan sigui aplicable.
- Classe elèctrica.
- Fotometria IES/LDT si existeix.
- Vida útil i manteniment declarats.
- Driver, alimentació i accessoris.

Les dades comercials sense condicions o documentació queden com a no
verificades.

## 5. Capes d'il·luminació

- **General:** orientació i ús habitual.
- **Tasca:** mirall, taulell, escriptori, lectura o treball.
- **Accent:** objecte, textura o arquitectura.
- **Orientació/nocturna:** recorregut amb baixa intensitat.
- **Decorativa:** efecte visual.
- **Emergència:** sistema específic quan aplica.

Una mateixa lluminària pot participar en més d'una capa, però cada objectiu es
valida per separat.

## 6. Zones i plans de càlcul

El model permet dibuixar:

- Pla de terra.
- Pla de treball horitzontal.
- Pla vertical de mirall o paret.
- Zona de dutxa.
- Taulell de cuina.
- Eix de circulació.
- Objecte d'accent.

Cada pla registra:

- Geometria.
- Altura.
- Objectiu lumínic.
- Uniformitat o criteris aplicables.
- Ús.
- Font de la regla o preferència.

No es calcula una mitjana única per a tota l'habitació si les tasques tenen
necessitats diferents.

## 7. Càlcul orientatiu inicial

Quan encara no hi ha fotometria completa, es pot utilitzar el mètode dels
lúmens com a estimació:

```text
E_mitjana_lux =
(flux_total_lm × factor_utilització × factor_manteniment)
/ àrea_m2
```

Entrades:

- Flux de les lluminàries.
- Geometria.
- Reflectàncies aproximades.
- Factor d'utilització justificat.
- Factor de manteniment.
- Pla de càlcul.

El resultat es marca com a estimació. No avalua correctament distribució
local, ombres, uniformitat o enlluernament.

## 8. Càlcul fotomètric posterior

Amb fitxer IES/LDT:

```text
geometria 3D
+ reflectàncies
+ fotometria
+ orientació
+ obstruccions
→ malla de punts
→ il·luminància, uniformitat i visualització
```

El motor ha de conservar:

- Fitxer i checksum.
- Variant exacta.
- Unitats.
- Data.
- Condicions.
- Versió del càlcul.

No s'interpola una fotometria d'un model diferent perquè tingui la mateixa
potència.

## 9. Qualitat de la llum

Paràmetres:

- Il·luminància.
- Uniformitat.
- Enlluernament.
- Reproducció cromàtica.
- Temperatura de color.
- Consistència cromàtica quan estigui declarada.
- Parpelleig quan hi hagi dades.
- Ombres.
- Reflexos en miralls i pantalles.
- Llum natural.

Els objectius depenen de l'activitat, usuari i àmbit. No es converteixen
preferències de disseny en obligacions normatives.

## 10. Bany

Zones funcionals:

- Il·luminació general.
- Mirall i rostre.
- Dutxa/banyera.
- Orientació nocturna.

Comprovacions:

- Volums de protecció ITC-BT-27.
- Equip i grau de protecció compatibles.
- Alimentació i classe.
- Ombres al rostre.
- Reflexos.
- Manteniment.
- Coordinació amb extractor, fals sostre i impermeabilització.

La lluminària sobre el mirall no es col·loca només al centre geomètric si genera
ombres inadequades; el model ha de permetre comparar variants laterals,
superiors o combinades.

## 11. Cuina

Zones:

- General.
- Taulell.
- Cocció.
- Aigüera.
- Interior de mobiliari.
- Menjador.

Conflictes:

- Ombra de l'usuari sobre el taulell.
- Lluminària incompatible amb campana o moble.
- Driver inaccessible.
- Tira LED sense perfil, difusor, alimentació o dissipació definida.
- Enlluernament sobre superfícies brillants.

## 12. Control

Entitats:

- Interruptor simple.
- Commutador.
- Creuament.
- Polsador.
- Regulador.
- Sensor de presència.
- Sensor de llum.
- Relé/actuador.
- Controlador.
- Grup.
- Escena.

Relació:

```text
entrada de control
→ lògica
→ actuador/driver
→ grup de lluminàries
```

Cada lluminària ha de poder respondre:

- Qui la controla?
- Des de quins punts?
- Amb quin protocol?
- En quin estat queda davant una fallada?
- A quin circuit elèctric pertany?

## 13. Simulació d'escenes

Escenes residencials candidates:

- General.
- Tasca.
- Relax.
- Neteja.
- Nocturna.
- Absència.

Són plantilles editables, no requisits. La vista 3D pot previsualitzar
intensitat i grups sense prometre una renderització fotomètrica exacta.

## 14. Circuit i escandall elèctric

La xarxa de control alimenta el paquet elèctric:

- Circuit C1 o circuit aplicable.
- Fase, neutre i protecció.
- Retorns.
- Viatgers de commutació.
- Bus o cable de control.
- Caixes.
- Mecanismes.
- Drivers.

El nombre de conductors per tram deriva de la topologia:

```text
tram
→ funcions que el travessen
→ conductors/cable necessaris
→ secció segons regla elèctrica
→ longitud i reserva
```

No es multiplica tota la ruta per un nombre fix.

## 15. Escandall d'il·luminació

- Lluminàries.
- Fonts substituïbles quan existeixin.
- Drivers i fonts d'alimentació.
- Perfils i difusors.
- Carrils i accessoris.
- Suports, florons i cables de suspensió.
- Caixes i mecanismes.
- Sensors i actuadors.
- Conductors/cables de control.
- Proteccions.
- Connectors.
- Elements d'estanquitat.
- Registres.

Per tires LED:

```text
longitud_tira =
Σ(trams_reals)

potència_disseny =
longitud_tira × W_per_m_de_variant

font =
selecció_compatible(
  potència_disseny,
  marge_documentat,
  tensió,
  regulació,
  longituds
)
```

La caiguda de tensió, injeccions i límits de tram depenen del sistema.

## 16. Regles inicials

### LIGHT-REBT-MIN-POINTS-001

- Entrades: espai, superfície, jurisdicció i tipus d'actuació.
- Resultat: punts mínims de la ITC-BT-25 o regla no aplicable.

### LIGHT-CONTROL-ORPHAN-001

- Resultat: lluminària sense control definit o control sense càrrega.

### LIGHT-PHOTOMETRY-MISSING-001

- Resultat: simulació detallada no disponible; permetre només estimació.

### LIGHT-MAINTENANCE-001

- Resultat: driver o lluminària integrada sense accés és conflicte.

### LIGHT-WET-ZONE-001

- Entrades: lluminària, volum 3D i prestacions.
- Resultat: validació segons ITC-BT-27.

### LIGHT-SCENE-COMPATIBILITY-001

- Resultat: avisar si driver, regulador i protocol no són compatibles.

## 17. Preguntes del flux

- Quines activitats es fan a cada zona?
- On són els plans de treball?
- Es vol llum general, de tasca, accent o nocturna?
- Hi ha llum natural?
- Quina atmosfera i temperatura de color es busca?
- Cal bona reproducció cromàtica?
- Hi ha superfícies reflectants?
- Com es controla cada grup?
- Cal regulació o automatització?
- On quedaran drivers i registres?
- Existeix fotometria del producte?
- Hi ha zones humides o condicions especials?

## 18. Cas daurat

Bany amb:

- Llum general.
- Il·luminació de mirall.
- Llum de dutxa.
- Escena nocturna.
- Sensor opcional.
- Extractor coordinat.

El test comprova:

- Punts i controls.
- Circuits i conductors.
- Volums de protecció.
- Plans de càlcul.
- Fotometria/estimació.
- Drivers accessibles.
- Escandall.

## 19. Fonts

- REBT:
  https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099
- CTE DB-HE:
  https://www.codigotecnico.org/pdf/Documentos/HE/DBHE.pdf
- CTE DB-SUA:
  https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf
- UNE-EN 12464-1:2022:
  https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma?c=N0068596

Altres normes de fotometria, emergència, producte i control s'incorporaran
segons l'àmbit, sempre versionades i sense reproduir contingut protegit.
