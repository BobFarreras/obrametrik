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
- L'inspector permet editar dimensions i alçada del component seleccionat.

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

## Persistència

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
