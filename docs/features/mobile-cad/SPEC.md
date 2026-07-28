# Editor CAD mòbil — Especificació observable

## Problema i abast

L'app Expo ha d'obrir i modificar el mateix model `building_spaces` /
`building_elements` que la web, sense mantenir una còpia paral·lela basada en
`rooms` i centímetres. Aquesta fase cobreix consulta, edició tàctil 2D,
components tècnics, inspector, guardat atòmic i una previsualització espacial
adaptada a mòbil.

## Contractes i invariants

- Totes les cotes es capturen i es mostren en mil·límetres.
- Un document conté contorn, alçada lliure i components allotjats en una paret.
- La col·locació tàctil projecta el punt a la paret més propera i respecta la
  meitat de l'amplada del component.
- Canviar la mida del contorn reproyecta els components allotjats.
- Guardar utilitza `save_cad_plan`; web i mòbil reobren el mateix `space_id`.
- La clau publishable és l'única clau Supabase disponible al client.
- RLS i la funció transaccional continuen sent l'autoritat; la UI local no
  autoritza cap projecte.

## Criteris d'acceptació

- Des d'un projecte autenticat es pot obrir l'editor CAD mòbil.
- El detall del projecte llista tots els `building_spaces` autoritzats i cada
  targeta obre explícitament el seu `space_id`; no depèn de l'ordre de consulta.
- Es poden crear formes rectangulars, L i U i editar amplada, fondària i alçada.
- Es poden col·locar portes, finestres, llums, interruptors, endolls, aigua freda
  i calenta i desguassos.
- Un component seleccionat es pot dimensionar, elevar i eliminar.
- El camp actiu queda visible sobre el teclat mitjançant `KeyboardAvoidingView`.
- El canvas ocupa l'espai disponible sense obligar a desplaçar un formulari
  llarg; les propietats de l'espai s'obren en un panell contextual.
- La planta mostra vèrtexs editables, permet reubicar components allotjats i
  ofereix controls accessibles d'enquadrament i zoom.
- Cada mur mostra la longitud en `mm`, es pot seleccionar, redimensionar i
  conserva els components en la seva posició longitudinal relativa.
- Les cotes estan ocultes inicialment i es poden activar des d'un únic control;
  les etiquetes només mostren el valor compacte en `mm`.
- Vèrtexs i components es poden arrossegar directament amb snap de 50 mm;
  totes les operacions tenen desfer i refer.
- Portes i finestres utilitzen símbols arquitectònics en planta, no marcadors
  genèrics, i les seves dimensions es representen també al visor 3D.
- El visor 3D representa el mateix contorn, alçada i components, amb controls
  visibles de rotació, zoom, enquadrament i vistes superior, frontal, lateral i
  isomètrica.
- Planta i 3D no mostren cap bàner flotant que tapi el contingut.
- Tocar una zona buida de la planta cancel·la la selecció i tanca l'inspector.
- Al 3D, un dit orbita la càmera i una pinça controla el zoom.
- Els canvis vàlids es desen automàticament després d'un breu període
  d'inactivitat, mantenint també el botó de desat explícit.
- Els estats loading, buit, error, brut, guardant i guardat són visibles.

## Fora d'abast

- Escaneig LiDAR/AR i fotogrametria.
- Edició offline amb resolució de conflictes (la base SQLite es farà en una fase
  pròpia).
- Render fotorealista o motor físic 3D natiu.
