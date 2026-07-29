# Climatització i calefacció — Base de coneixement inicial

**Jurisdicció inicial:** Espanya  
**Estat:** base inicial pendent de revisió per tècnic/instal·lador habilitat  
**Fonts:** RITE, CTE i reglamentacions específiques aplicables  
**Verificat:** 26 de juliol de 2026

## 1. Abast

- Calefacció i refrigeració.
- Bombes de calor.
- Sistemes aire-aire i aire-aigua.
- Emissors i terra radiant.
- Conductes, canonades i refrigerant.
- Condensats.
- Control.
- Electricitat associada.

El RITE considera instal·lacions tèrmiques les instal·lacions fixes de
climatització —calefacció, refrigeració i ventilació— i les d'ACS dins del seu
àmbit.

## 2. Separació de problemes

```text
demanda de l'espai
→ càrrega tèrmica
→ sistema
→ equip
→ distribució
→ terminals
→ control
→ energia
→ evacuació de condensats
→ manteniment
```

No es dimensiona un equip només amb `m² × W/m²` com a resultat final. Aquesta
aproximació pot orientar una pregunta, però no substitueix el càlcul tèrmic.

## 3. Dades de l'edifici

- Ubicació i clima.
- Orientació.
- Geometria i volum.
- Envolupant.
- Finestres i protecció solar.
- Infiltracions i ventilació.
- Ús, ocupació i consignes.
- Guanys interns.
- Espais adjacents.
- Horaris.
- Sistemes existents.

Les dades desconegudes es mantenen com a supòsits visibles.

## 4. Tipus de sistema

### Expansió directa

- Unitat exterior i interior.
- Canonada de refrigerant.
- Desguàs de condensats.
- Alimentació i comunicació.
- Suports i passos.

### Hidràulic

- Generador.
- Impulsió i retorn.
- Bomba i col·lector.
- Vàlvules.
- Emissors.
- Purga, buidatge i expansió aplicables.
- Aïllament.

### Aire

- Unitat.
- Impulsió i retorn.
- Aire exterior quan correspongui.
- Conductes.
- Difusors/reixetes.
- Filtració i control.

### Terra radiant

- Sistema i aïllament.
- Col·lector.
- Circuits.
- Pas i longitud definits pel càlcul/sistema.
- Capes i cota final.
- Juntes i control per zones.

## 5. Model d'equip

Cada equip registra:

- Fabricant i model.
- Capacitat declarada en condicions identificades.
- Potència absorbida i eficiència declarada.
- Refrigerant quan aplica.
- Cabals i pressions disponibles.
- Nivell sonor.
- Dimensions i pes.
- Connexions.
- Desguàs.
- Espais de manteniment.
- Condicions d'instal·lació.
- Documentació.

No es comparen capacitats declarades sota condicions diferents sense
normalitzar-les.

## 6. Xarxes

### Canonada tèrmica

- Impulsió/retorn.
- Fluid i temperatures.
- Cabal i diàmetre.
- Longitud i pèrdua de càrrega.
- Aïllament.
- Vàlvules i accessoris.

### Refrigerant

- Línia i funció.
- Diàmetre segons equip.
- Longitud i desnivell.
- Aïllament.
- Unions.
- Càrrega addicional segons fabricant.
- Reglamentació de seguretat aplicable.

El dimensionament i manipulació de refrigerant queden subjectes a documentació
de l'equip i personal habilitat. Obrametrik no proposa diàmetres o càrregues
genèriques.

### Aire

- Impulsió/retorn/extracció/admissió.
- Cabal i secció.
- Velocitat i pèrdua de càrrega.
- Estanquitat.
- Aïllament i acústica.

## 7. Condensats

Cada equip que pot generar condensats necessita:

- Safata o punt de recollida.
- Sortida i canonada.
- Pendent.
- Sifó quan sigui requerit.
- Connexió admissible.
- Aïllament si hi ha risc.
- Accés de neteja.
- Bomba si la gravetat no és viable.

### CLIMA-CONDENSATE-PATH-001

- Entrades: equip, cota, recorregut, connexió i pendent.
- Resultat: error si no hi ha evacuació viable o bombeig definit.

La xarxa de condensats es coordina amb sanejament; no es deixa com un “tub
auxiliar” sense destí.

## 8. Aïllament

RITE exigeix aïllament en les condicions definides per a canonades, equips i
conductes, tant per limitar pèrdues com per evitar condensacions.

El motor necessita:

- Diàmetre exterior.
- Temperatura del fluid.
- Ambient.
- Interior/exterior.
- Conductivitat de l'aïllament.
- Funcionament.
- Protecció exterior.

No s'aplica un gruix únic. Les taules i el mètode del RITE es converteixen en
regles versionades.

## 9. Accessibilitat

RITE exigeix situar equips de forma que se'n faciliti neteja, manteniment i
reparació. Els equips ocults necessiten accés adequat reflectit als plànols.

El model 3D conserva:

- Volum físic i de servei.
- Extracció de filtres.
- Obertura de tapes.
- Accés a vàlvules.
- Trampilla.
- Ruta de substitució.

### CLIMA-MAINTENANCE-CLEARANCE-001

- Entrades: volum de manteniment del fabricant i obstacles.
- Resultat: conflicte si l'accés queda ocupat.

## 10. Electricitat, control, soroll i vibració

- Circuit, protecció i potència.
- Alimentació segons esquema.
- Cable de comunicació.
- Termòstat, sensors, actuadors i zones.
- Potència i pressió sonora declarades.
- Suports antivibratoris.
- Connexions flexibles.

La instal·lació elèctrica deriva cap al paquet REBT. L'acústica es coordina amb
DB-HR, ordenances i fabricant.

## 11. Escandall

- Equips.
- Suports i bancades.
- Emissors o terminals.
- Canonada, refrigerant o conducte.
- Aïllament.
- Accessoris i vàlvules.
- Reixetes i difusors.
- Condensats i bombes.
- Control.
- Electricitat associada.
- Trampilles.
- Segellats de passos.
- Posada en servei.

## 12. Regles inicials

### CLIMA-LOAD-UNKNOWN-001

- Aplica quan: es pretén seleccionar equip sense càrrega o hipòtesis.
- Resultat: estimació no confirmada o revisió professional.

### CLIMA-CONNECTION-COMPLETE-001

- Resultat: equip nou ha de tenir totes les connexions requerides.

### CLIMA-INSULATION-001

- Entrades: xarxa, fluid, temperatura, ubicació i material.
- Resultat: gruix calculat o informació insuficient.
- Font: RITE, IT 1.2.4.2.

### CLIMA-HIDDEN-ACCESS-001

- Resultat: equip ocult sense accés adequat és conflicte.
- Font: RITE, IT 1.3.4.4.3.

### CLIMA-MANUFACTURER-LIMIT-001

- Comprova longituds, desnivells, connexions i espais contra documentació del
  model seleccionat.

## 13. Preguntes del flux

- Quin sistema existeix i què es conserva?
- Quins espais es climatitzen?
- Es coneixen envolupant, orientació i ús?
- On poden anar unitats i terminals?
- Hi ha recorregut per xarxes?
- Com s'evacuen condensats?
- Hi ha alimentació disponible?
- Quins límits declara el fabricant?
- Es pot mantenir i substituir l'equip?
- Quin impacte acústic pot tenir?
- L'actuació requereix memòria, projecte, registre o instal·lador habilitat?

## 14. Cas daurat

Sistema split per dormitori:

- Unitat interior i exterior.
- Línies frigorífiques.
- Condensats per gravetat.
- Alimentació.
- Pas de façana.
- Suports.
- Volums de manteniment.

El test comprova connexions, cotes, pendent, longituds, aïllament, col·lisions,
electricitat, acústica i escandall.

## 15. Fonts

- RITE consolidat:
  https://www.boe.es/buscar/act.php?id=BOE-A-2007-15820
- CTE:
  https://www.codigotecnico.org/DocumentosCTE/DocumentosCTE.html

També s'aplicaran el reglament de seguretat d'instal·lacions frigorífiques,
normativa de refrigerants, DB-HR, ordenances i documentació del fabricant quan
correspongui.
