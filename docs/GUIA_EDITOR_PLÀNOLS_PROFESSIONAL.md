# Obrametrik — Guia de l'editor professional de plànols i superfícies

**Estat:** decisió de producte prèvia a implementació  
**Versió:** 1.0  
**Data:** 26 de juliol de 2026

## 1. Objectiu

Obrametrik necessita un editor espacial visual, precís i àgil que recordi la
lògica d'una eina CAD, però sense exigir que l'usuari conegui AutoCAD.

L'editor ha de permetre:

- Dibuixar un espai rectangular, en L, en U o de forma lliure.
- Veure i editar el plànol directament.
- Passar de la planta 2D a una vista 3D del mateix model.
- Introduir cotes professionals en mil·límetres.
- Col·locar portes, finestres i altres elements sobre una paret.
- Dissenyar punts elèctrics, il·luminació, aigua, sanejament, climatització i
  altres instal·lacions amb connexions i alçades reals.
- Obtenir automàticament parets, terres, sostres, superfícies i deduccions.
- Manipular el model còmodament amb ratolí, teclat o gestos tàctils.
- Conservar la traçabilitat de cada càlcul.

No es busca replicar totes les funcions d'AutoCAD. Es busca un **CAD vertical
per a reformes**, amb menys eines, millors valors per defecte i un recorregut
guiat.

## 2. Principis no negociables

1. **El plànol és la font de veritat.** Les parets i superfícies no es creen com
   formularis independents si es poden derivar de la geometria.
2. **Mil·límetres de principi a fi.** Les longituds es capturen, desen i
   mostren en enters `mm`. Les àrees derivades es mostren en `m²`.
3. **Edició directa.** L'usuari selecciona el que veu i modifica el seu valor
   en un inspector contextual.
4. **Restriccions abans que correccions.** L'editor evita geometries
   impossibles, solapaments i obertures fora de paret.
5. **Precisió visible.** Snap, cotes, alineacions i estat de selecció sempre
   tenen resposta visual.
6. **Mòbil de debò.** Cap acció essencial depèn de hover, botó dret o una
   precisió tàctil irreal.
7. **Potència progressiva.** Les plantilles resolen els casos habituals; la
   forma lliure resol els casos especials.
8. **Auditable i reversible.** Desfer, refer i historial eviten perdre feina i
   expliquen com s'ha obtingut cada amidament.
9. **Un model, diverses vistes.** Planta 2D, alçat i 3D són projeccions del
   mateix model; mai tres dibuixos independents.
10. **Normativa versionada.** Una regla indica jurisdicció, font, versió,
    vigència i severitat. L'app no converteix una comprovació parcial en una
    certificació.

## 3. Vocabulari del producte

Per evitar ambigüitats:

| Terme | Significat |
| --- | --- |
| Espai | Habitació o zona física: bany, cuina, passadís, terrassa |
| Plànol | Representació 2D de la geometria de l'espai |
| Contorn | Polígon tancat que defineix el perímetre |
| Tram de paret | Segment entre dos vèrtexs consecutius |
| Obertura | Porta, finestra, pas o buit associat a una paret |
| Element | Pilar, sanitari, moble fix, radiador o instal·lació |
| Superfície | Cara mesurable derivada: terra, sostre o alçat de paret |
| Cota | Mesura explícita entre punts, mostrada en `mm` |
| Punt tècnic | Terminal d'una instal·lació: endoll, llum, presa d'aigua, desguàs |
| Xarxa | Conjunt connectat de punts, trams i equips d'un mateix sistema |
| Zona de protecció | Volum espacial on una norma limita determinats elements |

No s'utilitzarà “estança” a la interfície quan “espai” sigui més clar.

## 4. Experiència principal

### 4.1 Crear un espai

L'usuari escull una entrada:

- Rectangle.
- Forma en L.
- Forma en U.
- Forma lliure.
- Importar plànol o imatge com a referència, en una fase posterior.

Les plantilles mostren un esquema, no una llista de camps. Després de triar una
forma, l'usuari introdueix les cotes mínimes necessàries i entra a l'editor.

### 4.2 Editor

La pantalla es divideix conceptualment en:

- **Barra superior:** tornar, nom de l'espai, estat de desat, desfer i refer.
- **Canvas central:** plànol amb graella, murs, cotes, obertures i elements.
- **Barra d'eines:** seleccionar, dibuixar paret, afegir obertura, afegir
  element i mesurar.
- **Inspector contextual:** propietats de la selecció actual.
- **Acció de revisió:** validar geometria i continuar a amidaments.

En web o tauleta, l'inspector pot ocupar un lateral. En mòbil, apareix com un
panell inferior redimensionable que no oculta la selecció.

### 4.3 Seleccionar i editar

- Tocar una paret la ressalta i mostra longitud, gruix i alçada.
- Tocar una cota obre l'edició numèrica.
- Tocar un vèrtex permet moure'l mantenint les restriccions actives.
- Tocar una obertura mostra tipus, amplada, alçada, ampit i posició.
- Tocar el buit del canvas anul·la la selecció.
- Una pulsació llarga obre accions secundàries: duplicar, eliminar o bloquejar.

La selecció ha de ser inequívoca mitjançant color, gruix, handles i etiqueta;
mai només mitjançant color.

### 4.4 Canviar entre 2D, alçat i 3D

L'editor ofereix tres vistes sincronitzades:

- **Planta 2D:** dibuix, cotes, distribució, rutes i col·locació ràpida.
- **Alçat:** edició precisa dels elements d'una paret, les seves alçades i
  distàncies laterals.
- **3D:** comprensió espacial, detecció visual de conflictes i presentació.

Seleccionar un element en qualsevol vista el selecciona a les altres. Modificar
una cota actualitza totes les projeccions. La vista 3D no és només decorativa,
però tampoc substitueix la precisió de planta i alçat.

## 5. Sistema geomètric

### 5.1 Model canònic

Cada espai es representa amb:

- Un sistema de coordenades local.
- Vèrtexs amb coordenades enteres en `mm`.
- Trams de paret que connecten dos vèrtexs.
- Un contorn tancat, simple i orientat.
- Alçada general de l'espai, sobrescrivible per paret.
- Gruix de paret opcional.
- Obertures ancorades a un tram.
- Elements posicionats al sistema local.

Conceptualment:

```ts
type PointMm = {
  xMm: number;
  yMm: number;
};

type WallSegment = {
  id: string;
  startVertexId: string;
  endVertexId: string;
  heightMm: number;
  thicknessMm?: number;
};

type Opening = {
  id: string;
  wallId: string;
  kind: "door" | "window" | "passage";
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  sillHeightMm: number;
};
```

`offsetMm` indica la distància des de l'inici orientat de la paret fins a
l'obertura. Això permet conservar la posició si canvia la longitud del tram.

Els punts i equips tècnics utilitzen coordenades locals i, quan estan sobre una
paret, un ancoratge semàntic:

```ts
type HostedPoint = {
  id: string;
  system: "electrical" | "lighting" | "water" | "drainage" | "hvac" | "data";
  kind: string;
  hostSurfaceId: string;
  horizontalOffsetMm: number;
  elevationMm: number;
  depthMm?: number;
  orientationDeg: number;
  connectionIds: string[];
};
```

Un element ancorat no perd la relació amb la paret quan aquesta es mou. Les
coordenades globals es deriven de l'ancoratge, no es dupliquen.

### 5.2 Regles geomètriques

- El contorn ha de romandre tancat i sense autointerseccions.
- Cap tram pot tenir longitud zero.
- Les obertures han de quedar completament dins del tram.
- Dues obertures no es poden solapar.
- Una porta no pot tenir un ampit diferent de zero.
- L'alçada d'una obertura no pot superar l'alçada de la paret.
- Moure un vèrtex recalcula els trams i superfícies afectats.
- Qualsevol canvi presenta una previsualització abans de confirmar una
  correcció destructiva.

### 5.3 Càlculs derivats

El motor determinista calcula:

- Àrea de terra a partir del polígon.
- Àrea de sostre, inicialment igual a la del terra.
- Longitud i àrea bruta de cada paret.
- Àrea de cada obertura.
- Àrea neta de paret.
- Perímetre.
- Volum de l'espai.
- Longitud aproximada de cada recorregut tècnic.
- Distàncies entre punts, equips, zones de protecció i passos.

Les fórmules treballen amb enters o decimals de precisió controlada. La UI no
calcula ni persisteix resultats crítics de manera independent.

## 6. Unitats i format

- Unitat canònica de longitud: `mm`.
- Entrada vàlida inicial: enters positius, per exemple `2400`.
- Presentació de cota: `2 400 mm`, respectant el locale.
- Àrees: `m²`, amb dues decimals per defecte i més precisió sota demanda.
- Volums: `m³`.
- No es mostra `240 cm` com a valor principal.
- Una preferència futura pot mostrar unitats alternatives, però mai canvia la
  unitat interna ni la precisió.

Els inputs numèrics inclouen:

- Unitat sempre visible.
- Botó per esborrar.
- Valor anterior accessible.
- Validació en temps real sense perdre el que s'està escrivint.
- Confirmació explícita amb “Aplicar” o tecla equivalent.

## 7. Obertures i elements

### 7.1 Afegir una porta o finestra

Flux ideal:

1. L'usuari toca la icona de porta o finestra.
2. Les parets vàlides es ressalten.
3. Toca la paret desitjada.
4. Apareix una previsualització ancorada amb snap.
5. Arrossega per posicionar-la o introdueix l'offset exacte.
6. Ajusta amplada, alçada, ampit i sentit d'obertura quan correspongui.
7. Confirma.

L'objecte es dibuixa amb una icona arquitectònica reconeixible. La porta mostra
fulla i arc d'obertura; la finestra mostra el buit dins del mur.

### 7.2 Biblioteca inicial

- Porta abatible.
- Porta corredissa.
- Finestra.
- Pas sense fusteria.
- Pilar.
- Plat de dutxa.
- Banyera.
- Lavabo.
- Inodor.
- Radiador.

La primera implementació pot limitar-se a porta, finestra i pas, sempre amb una
arquitectura ampliable.

### 7.3 Inspector de l'element

L'inspector evita formularis llargs. Mostra només propietats aplicables:

- Tipus.
- Amplada.
- Alçada.
- Distància al cantell.
- Ampit, només en finestres.
- Sentit i costat d'obertura, només en portes compatibles.
- Bloquejar posició.
- Eliminar.

## 8. Model 3D

### 8.1 Abast

El 3D es genera extrudint el contorn i aplicant alçades, gruixos, obertures,
acabats i components. No s'ha de redibuixar manualment.

La primera versió 3D inclou:

- Parets, terra i sostre.
- Portes i finestres amb els buits reals.
- Equipament sanitari i mobiliari fix.
- Punts elèctrics, d'aigua i de llum amb símbols clars.
- Zones de protecció semitransparents.
- Mesura i selecció.
- Ocultar sostre o parets per inspeccionar l'interior.

### 8.2 Navegació

- Orbitar al voltant de l'espai.
- Pan i zoom.
- Vistes predefinides: superior, frontal, lateral i perspectiva.
- “Entrar a l'espai” opcional, sense convertir l'editor en un videojoc.
- Tall o secció per veure conduccions ocultes.
- Enquadrar selecció.

En mòbil, els gestos de càmera i d'edició no poden competir. Per defecte el 3D
és de consulta i selecció; moure un component requereix activar explícitament
el mode d'edició.

### 8.3 Nivells de representació

Cada component té:

- Símbol 2D normalitzat.
- Representació d'alçat.
- Volum 3D simplificat.
- Caixa d'ocupació i manteniment.
- Punts de connexió.
- Metadades tècniques.

No cal un model fotorealista per calcular. Els models detallats de fabricants
són opcionals i no poden degradar el rendiment.

### 8.4 Rendiment

- Càrrega progressiva dels models.
- Geometria instanciada per components repetits.
- Nivells de detall.
- Occlusion/frustum culling quan la tecnologia ho permeti.
- Objectiu inicial: interacció fluida en un Android de gamma mitjana.
- Mode 2D completament funcional si el dispositiu no suporta bé el 3D.

## 9. Sistemes tècnics i biblioteca de components

La biblioteca no és una galeria d'icones. Cada component defineix geometria,
connexions, paràmetres, restriccions, amidaments i regles aplicables.

### Estat implementat del primer vertical elèctric

A juliol de 2026, web i mòbil comparteixen el model que genera la proposta
determinista de C1/C2, conductors, caixes de derivació i recorreguts 3D. Els
punts de llum es poden col·locar lliurement al sostre. La planta i els alçats
W1…Wn projecten el mateix model; els terminals de paret es poden ajustar en
desplaçament i alçada des de l'alçat.

La capa de circuits es pot ocultar sense modificar el projecte. La proposta
local és immediata i les rutes confirmades, quan existeixen, en són la font
persistent. L'abast, les decisions i el mapa de codi actuals es documenten a
`docs/features/electrical-takeoff-engine/IMPLEMENTATION.md`.

### 9.1 Electricitat

Components inicials:

- Punt de llum de sostre, paret, encastat o tira LED.
- Interruptor, commutador, creuament i regulador.
- Base d'endoll amb terra, presa dedicada i presa estanca.
- Caixa de mecanismes.
- Caixa de derivació o empalme.
- Quadre elèctric.
- Detector, timbre i alimentació d'equip fix.
- Canalització, tub, canal i registre.
- Circuit i protecció associada.

Propietats:

- Alçada i posició.
- Muntatge superficial o encastat.
- Grau IP quan sigui aplicable.
- Potència prevista.
- Circuit.
- Conductors, secció i canalització com a dades tècniques, no com a decisió
  automàtica no revisada.
- Control de cada lluminària.

La UI ha de permetre veure quins interruptors controlen cada punt de llum i a
quin circuit pertany cada receptor.

### 9.2 Il·luminació

- Lluminària i tipus de muntatge.
- Flux, potència, temperatura de color i regulació, si es coneixen.
- Zona funcional il·luminada.
- Grup de control.
- Sensors de presència o llum.
- Volum aproximat i distàncies a altres elements.

Una fase posterior pot simular cobertura lumínica orientativa. No ha de
presentar-se com a càlcul luminotècnic certificat sense dades fotomètriques.

### 9.3 Aigua freda i calenta

Components inicials:

- Presa d'aigua freda.
- Presa d'aigua calenta.
- Clau de tall general, de local humit i d'aparell.
- Col·lector.
- Canonada i accessori.
- Aixeta, mesclador i equip connectat.
- Escalfador, termo o caldera com a equip.

Cada presa ha de saber:

- Xarxa d'aigua freda o calenta.
- Aparell servit.
- Alçada i separació.
- Diàmetre nominal, material i sistema quan estiguin confirmats.
- Clau de tall associada.
- Accessibilitat per manteniment.

En un lavabo, per exemple, el model pot esperar connexions d'aigua freda,
aigua calenta i desguàs, i claus de tall segons la solució. Si falta alguna
dada, genera una pregunta o avís, no inventa la instal·lació.

### 9.4 Sanejament

- Desguàs d'aparell.
- Sifó individual o solució equivalent.
- Ramal.
- Baixant.
- Punt de registre.
- Embornal i canal de dutxa.
- Ventilació de xarxa quan sigui aplicable.

Propietats:

- Diàmetre.
- Cota d'eix o sortida.
- Pendent.
- Sentit de flux.
- Aparells connectats.
- Accessibilitat de registre.

La vista 3D i les seccions han de fer visibles pendents i encreuaments que una
planta 2D amagaria.

### 9.5 Climatització i ventilació

- Radiador i vàlvules.
- Terra radiant com a zona.
- Unitat interior i exterior.
- Reixeta, difusor i extractor.
- Conducte.
- Desguàs de condensats.
- Termòstat o control.

El sistema registra espai de manteniment, recorreguts i connexions. El
dimensionament tèrmic queda separat i requereix dades i regles específiques.

### 9.6 Telecomunicacions i control

- Presa de dades.
- Presa de televisió.
- Punt d'accés.
- Porter o vídeo porter.
- Sensor.
- Actuador domòtic.
- Cablejat i canalització.

La separació o compatibilitat amb xarxes elèctriques es valida mitjançant
regles versionades.

### 9.7 Paleteria, revestiments i sistemes constructius

- Envà, trasdossat, fals sostre i calaix.
- Pilar, biga visible i pas d'instal·lacions.
- Impermeabilització com a sistema per zones.
- Aïllament tèrmic o acústic.
- Enrajolat, pintura, paviment i sòcol.
- Pendent de dutxa.
- Juntes, perfils i remats.
- Demolició i nova construcció com a estats diferenciats.

Cada sistema constructiu necessita capes, gruix, superfície, trobades i
condicions del suport.

### 9.8 Fusteria, alumini i vidre

- Porta interior, exterior, corredissa o plegable.
- Finestra fixa, practicable, oscil·lobatent o corredissa.
- Persiana i caixa.
- Premarc, marc, tapajuntes i ampit.
- Mampara.
- Moble fix i taulell.

Propietats:

- Mida de buit i mida de conjunt.
- Material i sistema.
- Sentit d'obertura.
- Espai d'escombratge.
- Accessoris.
- Prestacions conegudes.
- Trobades i segellats.

L'app ha de detectar col·lisions d'obertura amb sanitaris, mobles o altres
fulles.

### 9.9 Gas i elements estructurals

Es poden representar per coordinar l'espai, però qualsevol proposta,
modificació o dimensionament queda marcat com a treball especialitzat i subjecte
a validació professional. El model no ha de suggerir intervencions estructurals
ni de gas a partir de regles simplificades.

## 10. Xarxes, connexions i recorreguts

Els punts tècnics han de formar xarxes:

```text
origen → tram → derivació → tram → terminal
```

Cada xarxa conserva:

- Sistema i subsistema.
- Origen i terminals.
- Trams amb longitud, diàmetre/secció i cota.
- Unions i registres.
- Estat: existent, es manté, es retira o és nou.
- Requisits encara no confirmats.

L'enrutament automàtic només proposa candidats. No decideix perforacions,
regates, passos estructurals ni compatibilitats ocultes sense confirmació.

Les eines visuals inclouen:

- Mostrar una xarxa aïllada.
- Colorejar per sistema amb llegenda accessible.
- Veure elements sense connexió.
- Detectar recorreguts que travessen zones o elements incompatibles.
- Calcular longituds orientatives amb marge separat i explícit.

## 11. Motor de regles i normativa

### 11.1 Tipus de regla

- **Geomètrica:** fora de paret, solapament, radi d'obertura.
- **Connexió:** terminal sense xarxa o aparell incomplet.
- **Constructiva:** falta de capa, registre o espai de manteniment.
- **Compatibilitat:** materials o sistemes incompatibles.
- **Normativa:** requisit vinculat a jurisdicció i versió.
- **Recomanació professional:** bona pràctica diferenciada d'una obligació.

### 11.2 Resultats

Una regla retorna:

- Correcte.
- Avís.
- Error bloquejant.
- Informació insuficient.
- Requereix revisió professional.
- No aplicable.

Cada resultat mostra:

- Element afectat.
- Explicació clara.
- Dada utilitzada.
- Font, apartat i versió.
- Acció possible.
- Si és obligació, recomanació o comprovació incompleta.

### 11.3 Jurisdicció i vigència

El projecte defineix país, regió, municipi, ús i data de referència. Les regles
no s'apliquen si falta el context necessari. Les actualitzacions normatives no
reescriuen silenciosament un projecte anterior: generen una nova revisió.

La base de coneixement registra:

```ts
type RuleMetadata = {
  jurisdiction: string;
  sourceId: string;
  sourceSection: string;
  effectiveFrom: string;
  effectiveTo?: string;
  ruleVersion: string;
  reviewerId: string;
  severity: "info" | "warning" | "blocking" | "professional_review";
};
```

### 11.4 Exemple: bany, dutxa i electricitat

L'app construeix en 3D els volums de protecció derivats de la banyera o dutxa i
comprova cada equip elèctric respecte d'aquests volums.

No s'ha d'implementar la regla simplista “en un bany no hi pot haver caixes
d'empalme”. La ubicació, el volum, el tipus d'equip, el grau de protecció i les
condicions d'instal·lació són determinants segons el REBT. L'app ha de:

1. Demanar quin element defineix la zona humida.
2. Generar els volums aplicables.
3. Classificar espacialment el component.
4. Consultar la regla vigent.
5. Mostrar la condició exacta i la font.
6. Bloquejar només quan una regla revisada ho exigeixi.

Per al lavabo, l'assistent pot comprovar que el sanitari tingui les connexions
d'aigua i evacuació esperades i que siguin registrables. La seva proximitat a
electricitat s'avalua amb les regles aplicables al context, no amb una frase
genèrica.

### 11.5 Governança del coneixement

Les regles tècniques han de passar per:

1. Redacció estructurada.
2. Font oficial o tècnica identificada.
3. Revisió per professional competent de l'ofici.
4. Casos de prova.
5. Publicació versionada.
6. Seguiment de canvis normatius.
7. Retirada o substitució auditada.

L'experiència de professionals serveix per crear bones preguntes i detectar
errors reals; les obligacions legals sempre es vinculen a una font vigent.

## 12. Gestos i controls

### Mòbil

- Un dit sobre buit: desplaçar el plànol.
- Pinça: zoom centrat entre els dits.
- Toc: seleccionar.
- Doble toc: zoom a l'element.
- Arrossegar handle: modificar geometria.
- Pulsació llarga: menú contextual.
- Botons `+` i `−`: alternativa accessible al gest de zoom.
- “Enquadrar”: centra tot el plànol.

Per evitar moviments accidentals, arrossegar una entitat requereix seleccionar-la
primer o superar un llindar de moviment.

### Web

- Roda: zoom.
- Espai + arrossegar o botó central: pan.
- Clic: seleccionar.
- `Esc`: cancel·lar.
- `Delete`: eliminar amb confirmació quan hi ha dependències.
- `Ctrl/Cmd + Z`: desfer.
- `Ctrl/Cmd + Shift + Z`: refer.
- Fletxes: ajust fi; modificador per pas major.

Totes les accions de teclat tenen alternativa visible.

## 13. Snap, guies i precisió

El snap inicial inclou:

- Extrems de paret.
- Punt mig.
- Perpendicular.
- Paral·lel.
- Alineació horitzontal i vertical.
- Graella configurable.
- Cantells d'obertures.

Durant una operació es mostra:

- Punt de snap.
- Guia temporal.
- Distància.
- Angle.
- Motiu del bloqueig si la posició no és vàlida.

El snap es pot desactivar temporalment i la seva tolerància visual s'adapta al
zoom, no a una distància fixa del món.

## 14. Teclat i formularis en mòbil

El teclat no pot tapar el camp actiu ni l'objecte que s'està editant.

Patró obligatori:

- Contenidor compatible amb safe areas.
- Ajust del layout amb el teclat, no simple superposició.
- Scroll automàtic fins a deixar el camp actiu en el terç superior de la zona
  visible.
- Panell inferior que puja amb el teclat.
- Accions “Anterior”, “Següent” i “Fet” per navegar entre camps.
- Botó principal visible sobre el teclat quan sigui necessari.
- En tancar el teclat, restauració suau de la posició anterior.
- Toc fora per tancar, sense perdre canvis.

Per a cotes, es prefereix un editor numèric compacte sobre el canvas o dins de
l'inspector, no una pantalla sencera de formulari.

La implementació s'ha de validar en Android físic, Android amb navegació per
gestos i iOS. `KeyboardAvoidingView` sol no es considera una solució completa:
cal mesurar el camp actiu i controlar el scroll.

## 15. Presentació visual professional

L'editor conserva la identitat d'Obrametrik, però redueix l'aspecte lúdic:

- Canvas neutre amb graella subtil.
- Murs en teal fosc, selecció amber i errors en safety.
- Iconografia arquitectònica coherent, sense emoji.
- Menys targetes decoratives; més espai de treball.
- Controls compactes amb targets tàctils mínims de 48 px.
- Cotes i geometria amb tipografia més tècnica i llegible.
- Animacions curtes per confirmar snap, selecció i actualització.
- Mode clar inicial; mode fosc de plànol considerat després de validar contrast.

La modernitat ha de venir de la fluïdesa, la precisió i el feedback, no de
decoració innecessària.

## 16. Funcions que aporten nivell professional

Prioritat alta:

- Desfer i refer.
- Autosave amb estat visible.
- Snap i guies.
- Enquadrar selecció o plànol.
- Bloqueig d'elements.
- Duplicar.
- Validació geomètrica en temps real.
- Vista de plànol i vista d'alçat de paret.

Prioritat posterior:

- Vista 3D sincronitzada, seccions i zones de protecció.
- Xarxes d'instal·lacions i detecció de conflictes.
- Capes: geometria, cotes, obertures, elements i anotacions.
- Importar una imatge o PDF i calibrar-la amb una cota coneguda.
- Duplicar espais o utilitzar plantilles.
- Mesurament amb làser Bluetooth.
- Escaneig LiDAR en dispositius compatibles, sempre amb confirmació.
- Exportació SVG/PDF/DXF.
- Comentaris i revisió col·laborativa.

## 17. Arquitectura recomanada

El domini geomètric ha de ser compartit i independent de React, Expo, canvas o
Supabase:

```text
packages/geometry
├── model
├── commands
├── constraints
├── calculations
├── serialization
└── tests
```

El model espacial i els sistemes tècnics es mantenen separats:

```text
packages/spatial-model     # espais, plantes, parets, hosts i coordenades
packages/geometry          # operacions geomètriques i càlculs
packages/building-systems  # components, ports, xarxes i amidaments
packages/rules-engine      # regles versionades, evidències i resultats
packages/calculations      # fórmules deterministes de negoci
```

Patrons clau:

- Operacions com comandes: `MoveVertex`, `ResizeWall`, `AddOpening`.
- Cada comanda es valida, aplica i pot revertir-se.
- La UI emet intencions; el domini decideix si són vàlides.
- Renderers diferents per web i mòbil poden consumir el mateix model.
- Els renderers 2D i 3D consumeixen identificadors i geometria compartits.
- Persistència versionada per poder migrar plànols antics.
- Supabase desa geometria normalitzada i snapshots versionats quan sigui útil.
- RLS protegeix tots els recursos per projecte i organització.

Abans d'escollir la tecnologia de renderitzat s'ha de fer un spike comparant:

- Rendiment amb 100–500 entitats.
- Gestos i hit testing.
- Text i cotes.
- Exportació.
- Accessibilitat.
- Compatibilitat Expo i web.
- 2D, 3D, seccions, símbols, text i gestió de memòria.

No s'ha de lligar el domini a una llibreria gràfica concreta.

## 18. Persistència i migració

La implementació actual desa amplada i llargada en metres. No s'ha d'ampliar
aquest model com si fos el definitiu.

Pla de transició:

1. Congelar noves funcions sobre el model rectangular actual.
2. Introduir el model geomètric versionat en mil·límetres.
3. Convertir els espais rectangulars existents a quatre vèrtexs.
4. Derivar superfícies des del nou model.
5. Mantenir compatibilitat de lectura durant la migració.
6. Retirar camps antics només amb migració explícita i dades verificades.

Cap migració aplicada s'edita. Les conversions han de ser idempotents,
auditables i provades amb fixtures.

## 19. Accessibilitat

- Targets tàctils mínims de 48 × 48 px.
- Alternatives als gestos multipunt.
- Lector de pantalla: resum textual del plànol i llista editable d'entitats.
- Llista textual equivalent de xarxes, punts i conflictes del model 3D.
- No dependre només del color o del gruix.
- Ordre de focus estable.
- Zoom de text sense trencar l'inspector.
- Vibració opcional en snap i accions confirmades.
- Respectar reducció de moviment.

El resum textual permet editar el projecte encara que el canvas no sigui
accessible per a una persona concreta.

## 20. Fases d'implementació

### Fase 0 — Especificació i prototip

- Wireframes de mòbil, tauleta i web.
- Prototip navegable del canvas i l'inspector.
- Proves amb rectangle, L i U.
- Spike tècnic de renderitzat i gestos.
- Prototip de canvi sincronitzat entre planta, alçat i 3D.
- Decisió formal del model geomètric.

**Sortida:** ADR, prototip validat i criteris de rendiment.

### Fase 1 — Nucli geomètric

- Paquet de geometria independent.
- Polígons simples.
- Parets i cotes en `mm`.
- Plantilles rectangle, L i U.
- Càlcul determinista d'àrea i perímetre.
- Tests de propietats i casos daurats.

**Sortida:** domini provat sense dependre de la UI.

### Fase 2 — Editor essencial

- Canvas amb pan, zoom i selecció.
- Edició de cotes.
- Moviment de vèrtexs.
- Snap bàsic.
- Desfer, refer i autosave.
- Adaptació real al teclat.

**Sortida:** crear i editar formes amb precisió en mòbil i web.

### Fase 3 — Obertures

- Portes, finestres i passos.
- Col·locació directa sobre paret.
- Inspector contextual.
- Validacions i deduccions automàtiques.
- Vista d'alçat de cada paret.

**Sortida:** amidaments nets coherents amb el plànol.

### Fase 4 — Model 3D sincronitzat

- Extrusió de l'espai i obertures.
- Navegació, selecció i enquadrament.
- Ocultació de parets, sostre i seccions.
- Components simplificats amb hosts i ports.
- Rendiment i fallback 2D en dispositius reals.

**Sortida:** planta, alçat i 3D representen el mateix model.

### Fase 5 — Sistemes tècnics essencials

- Electricitat i il·luminació.
- Aigua freda, aigua calenta i sanejament.
- Xarxes, connexions i elements orfes.
- Biblioteca inicial de components.
- Zones de protecció.
- Primer conjunt de regles revisades per professionals.

**Sortida:** disseny coordinat bàsic d'un bany amb comprovacions traçables.

### Fase 6 — Elements i abast de reforma

- Biblioteca inicial d'elements.
- Relació entre geometria, superfície i treball desitjat.
- Preguntes contextuals segons espai, element i zona humida.
- Generació de partides preliminars auditables.

**Sortida:** el plànol alimenta el motor de reforma sense duplicar dades.

### Fase 7 — Altres oficis i funcions avançades

- Referència d'imatge o PDF calibrada.
- Capes i anotacions.
- Exportació.
- Captura assistida i dispositius de mesura.
- Climatització, ventilació, telecomunicacions i més sistemes constructius.
- Detecció de conflictes entre xarxes.

## 21. Criteris d'acceptació del primer editor usable

- Es pot crear un rectangle, una L i una U sense escriure coordenades.
- Totes les cotes visibles i editables utilitzen `mm`.
- Es pot fer pan i zoom sense moure accidentalment una paret.
- El plànol es pot enquadrar amb una acció.
- Es pot seleccionar una paret i canviar-ne la longitud.
- Es pot afegir una porta i una finestra tocant una paret.
- No es pot guardar una obertura fora de paret o solapada.
- Àrea, perímetre i deduccions es recalculen de forma determinista.
- Desfer i refer cobreixen totes les operacions d'edició.
- Autosave mostra `desant`, `desat` o `error`.
- En mòbil, el teclat no tapa mai el camp actiu.
- El flux funciona en un Android físic, no només en navegador.
- La geometria té tests unitaris, d'integració i casos daurats.
- Els textos mantenen paritat en català, castellà i anglès.

## 22. Criteris d'acceptació del primer model 3D i MEP usable

- Planta, alçat i 3D comparteixen les mateixes entitats i identificadors.
- Modificar un element en una vista actualitza les altres sense divergència.
- Es poden ocultar parets i sostre per inspeccionar l'interior.
- Es poden col·locar punts de llum, endolls, interruptors i caixes.
- Es poden col·locar preses d'aigua freda/calenta, claus i desguassos.
- Cada punt mostra la seva xarxa o indica clarament que està desconnectat.
- Es pot veure l'alçada exacta d'un element en `mm`.
- Portes i altres elements mòbils detecten col·lisions bàsiques.
- Una dutxa o banyera genera zones de protecció 3D configurables per norma.
- Una regla mostra jurisdicció, versió, font i motiu.
- L'app diferencia obligació normativa, bona pràctica i dada insuficient.
- El 3D manté interacció usable en un Android físic de gamma mitjana.
- El projecte continua sent plenament editable en 2D si el 3D està desactivat.

## 23. Fora d'abast inicial

- BIM.
- Modelatge 3D de detall constructiu o fotorealista.
- Compatibilitat total amb DWG.
- Detecció automàtica fiable de geometria des d'una foto.
- Càlcul estructural.
- Certificació normativa.
- Col·laboració simultània en temps real.

Aquestes funcions no han de condicionar la primera arquitectura, però tampoc
s'han de prometre abans de validar-les.

## 24. Fonts normatives inicials

Per a projectes a Espanya, la primera base de regles haurà de partir com a
mínim de:

- Reglament electrotècnic per a baixa tensió i les seves ITC, especialment
  ITC-BT-25, ITC-BT-26 i ITC-BT-27.
- Codi Tècnic de l'Edificació, incloent DB-HS 4 i DB-HS 5.
- Altres documents bàsics, reglaments autonòmics, ordenances i normes de
  producte quan siguin aplicables.

La llista no implica que aquestes fonts siguin suficients per a qualsevol
projecte. Cada paquet normatiu necessita responsable, data de revisió i abast.

El coneixement detallat per oficis i el model comú de regles es mantenen a
`docs/coneixement/`. Aquesta biblioteca és la font de context ràpid per a
producte, desenvolupament, revisors i motor de càlcul.

## 25. Pròxima decisió

Abans de continuar implementant pantalles, el següent pas és preparar:

1. Wireframe del editor mòbil.
2. Wireframe de l'editor web/tauleta.
3. Wireframe de planta, alçat i 3D sincronitzats.
4. Model espacial, geomètric, components, ports i xarxes.
5. Spike de canvas 2D, motor 3D, gestos i rendiment.
6. Primer cas daurat: bany amb lavabo, dutxa, electricitat, AF/ACS i desguàs.
7. Revisió del cas daurat amb professionals dels oficis afectats.
8. ADR amb la tecnologia de renderitzat escollida.

Només després d'aquest spike s'ha de substituir el flux actual d'amplada,
llargada i targetes de superfícies.
