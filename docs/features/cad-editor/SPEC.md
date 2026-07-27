# Especificació — Editor tècnic 2D/3D

**Estat:** en implementació — consolidació de l'editor essencial

**Mètode:** SDD + TDD

## Resultat

L'usuari dibuixa o selecciona la forma d'un espai, edita les cotes en
mil·límetres, col·loca components sobre parets i alterna entre planta 2D i una
vista 3D generada del mateix model.

## Workspace

- Llenç central amb quadrícula i escala.
- Barra d'eines: seleccionar, paret, porta, finestra, llum, endoll i aigua.
- Inspector contextual per a l'element actiu.
- Navegador de nivells i espais.
- Modes 2D i 3D, mai models independents.
- Accions desar, desfer, refer i ajustar vista.

## Geometria inicial

- Rectangle.
- L.
- U.
- Polígon editable.
- Coordenades i cotes en `mm`.
- Snap inicial configurable a 50 mm.
- Altura lliure de l'espai.

## Interacció 2D

- Arrossegar un vèrtex modifica les dues parets adjacents.
- Editar X/Y a l'inspector produeix el mateix resultat.
- Les cotes s'actualitzen immediatament.
- Un polígon invàlid no es pot desar.
- Portes, finestres i punts tècnics es projecten sobre la paret seleccionada.
- El viewport enquadra el contorn i permet pan i zoom sense dependre d'una
  mida fixa d'escriptori.
- Seleccionar o arrossegar un component conserva el seu ancoratge a paret.
- Quan una paret es trasllada, gira o canvia de longitud, tots els seus
  components conserven la posició longitudinal relativa i es reproyecten sobre
  la nova paret. Les portes i finestres es mantenen completament dins del tram.
- `Shift+clic` permet seleccionar diversos components i eliminar el conjunt com
  una única operació reversible.
- La selecció es pot duplicar (`Ctrl/Cmd+D`) o copiar i enganxar
  (`Ctrl/Cmd+C`, `Ctrl/Cmd+V`). Les còpies es desplacen 200 mm al llarg de la
  seva pròpia paret i continuen respectant els límits de les obertures.
- Arrossegar una selecció múltiple aplica el mateix desplaçament longitudinal a
  cada component sobre la seva paret amfitriona.
- Cada component exposa la seva posició longitudinal des de l'inici de la paret
  en mil·límetres i permet editar-la numèricament.
- `Shift+arrossegar` sobre el llenç crea un marc de selecció acumulatiu.
- Tres o més components seleccionats es poden distribuir uniformement per cada
  paret amfitriona, sense barrejar elements de parets diferents.
- Cada cota de paret és seleccionable i permet introduir la longitud exacta del
  tram en mil·límetres; els components allotjats es reproyecten immediatament.
- El mode `ORTHO`, actiu per defecte, conserva l'orientació horitzontal o
  vertical de les dues parets adjacents quan es mou un vèrtex. Es pot desactivar
  per editar geometria lliure.
- L'eina de contorn lliure afegeix punts amb clic o toc, mostra una
  previsualització i ofereix accions explícites de finalitzar i cancel·lar.
- Finalitzar exigeix almenys tres punts, trams no nuls i un polígon sense
  autointerseccions. Un contorn invàlid no substitueix el plànol existent.
- L'inspector permet editar dimensions i alçada del component seleccionat.
- Les mutacions del document creen punts d'historial coherents. Desfer i refer
  restauren geometria, propietats i components com una sola operació.
- L'historial admet botons accessibles i els atajos `Ctrl/Cmd+Z` i
  `Ctrl/Cmd+Shift+Z`; pan, zoom i selecció no embruten l'historial.

## Símbols i biblioteca essencial

- Porta: buit, fulla i arc d'obertura.
- Finestra: buit i doble línia de marc.
- Llum, interruptor i endoll: símbols elèctrics diferenciats.
- Aigua: preses independents d'aigua freda i ACS.
- Sanejament: desguàs independent de les preses d'aigua.
- La barra utilitza icones SVG consistents; no lletres ni emoji.

## Interacció 3D

- Extrusió de les mateixes parets fins a l'altura lliure.
- Les obertures i punts conserven paret i posició.
- La vista permet rotació visual sense alterar la geometria de l'obra.
- 3D és una ajuda de comprensió, no un render fotorealista.
- El viewport calcula el centre i l'escala a partir del volum complet; cap forma
  depèn d'un canvas fix ni queda descentrada per l'origen de coordenades.
- Presets sincronitzats: planta superior, frontal, lateral, isomètrica i
  perspectiva.
- Isomètrica i perspectiva permeten òrbita, zoom, pan i reenquadrament. Les
  vistes ortogràfiques mantenen escala tècnica sense deformació de perspectiva.
- Els components es poden seleccionar en qualsevol projecció. L'alçat mostra
  explícitament la seva cota vertical en `mm` i reutilitza el mateix inspector.
- L'alçat navega paret a paret, representa portes i finestres a mida real i
  permet arrossegar punts en horizontal i vertical mantenint el seu host.
- El mode recorregut situa la càmera a altura ocular en un punt realment
  interior, permet mirada amb arrossegament i moviment amb fletxes, WASD o
  controls visibles. La càmera no pot travessar el contorn de l'espai.

## Persistència

- Un plànol desat conserva el mateix `spaceId`: els desats posteriors actualitzen
  l'espai existent i no creen duplicats.
- Espai, parets i components es desen en una única transacció PostgreSQL. Un
  error no pot deixar geometria parcial.
- El primer desat és explícit. Després, els canvis s'autodesen amb debounce i la
  interfície mostra els estats pendent, desant, desat i error amb reintent.
- El servidor torna a validar el projecte i el document complet; l'RPC s'executa
  com a invocador i conserva les polítiques RLS.

- El client envia una ordre validable, no files SQL.
- El cas d'ús valida geometria abans del repositori.
- El repositori tradueix el domini als tipus generats de Supabase.
- RLS continua sent la frontera d'autorització.

## Accessibilitat i mòbil

- Totes les eines tenen nom accessible i estat seleccionat.
- Cap acció depèn només del color.
- Targets mínims de 44 px.
- Inspector en drawer inferior en amplades petites.
- Els inputs actius permanecen visibles sobre el teclat.

## Criteris d'acceptació del primer increment

1. Crear formes rectangle, L i U.
2. Editar vèrtexs amb snap.
3. Mostrar cotes en mm.
4. Alternar 2D/3D sobre el mismo estado.
5. Col·locar components de manera visual.
6. Desar l'espai unificat amb RLS.
7. Recuperar els espais unificats del projecte.
8. Retirar el recorregut legacy de la UI sense eliminar-ne encara les dades.
9. Enquadrar, ampliar i desplaçar el plànol en qualsevol amplada.
10. Seleccionar, moure, editar i eliminar components.
