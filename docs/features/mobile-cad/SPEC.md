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
- Una eina de component activa té prioritat sobre la selecció del mur: tocar el
  mur col·loca el component. Un component seleccionat es pot traslladar a un
  altre mur sense entrar accidentalment en edició del mur.
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
- Les cotes s'editen en una barra numèrica enfocada que queda visible sobre el
  teclat a Android i iOS, amb accions explícites de cancel·lar i aplicar.
- El canvas ocupa l'espai disponible sense obligar a desplaçar un formulari
  llarg; les propietats de l'espai s'obren en un panell contextual.
- La planta mostra vèrtexs editables, permet reubicar components allotjats i
  ofereix controls accessibles d'enquadrament i zoom.
- A planta, una pinça amplia o redueix al voltant del centre del gest i
  arrossegar el fons desplaça el plànol sense modificar geometria.
- Cada mur mostra la longitud en `mm`, es pot seleccionar, redimensionar i
  conserva els components en la seva posició longitudinal relativa.
- Les cotes estan ocultes inicialment i es poden activar des d'un únic control;
  les etiquetes només mostren el valor compacte en `mm`.
- Vèrtexs i components es poden arrossegar directament amb snap de 50 mm;
  totes les operacions tenen desfer i refer.
- Després de col·locar un component, l'eina torna a selecció per evitar
  insercions accidentals en el següent toc.
- Els murs disposen d'una zona tàctil contínua i es poden arrossegar directament;
  els components allotjats segueixen el mur.
- El control ORTHO és visible i commutable: activat conserva eixos ortogonals
  en moure vèrtexs i limita el mur al seu desplaçament perpendicular; desactivat
  permet moviment lliure.
- Portes i finestres utilitzen símbols arquitectònics en planta, no marcadors
  genèrics, i les seves dimensions es representen també al visor 3D.
- En seleccionar una obertura es mostren les tres cotes encadenades del mur:
  tram anterior, amplada de l'obertura i tram posterior.
- Les portes permeten escollir frontissa esquerra/dreta i obertura
  interior/exterior; el símbol 2D, el model 3D i la persistència comparteixen el
  mateix sentit d'obertura.
- En seleccionar qualsevol component, l'inspector inferior mostra el seu tipus
  tècnic mitjançant opcions horitzontals accessibles. Portes, finestres, llums,
  mecanismes elèctrics, punts d'aigua i desguassos tenen catàlegs propis; el
  valor es valida i persisteix com a metadada del model compartit.
- El símbol de porta practicable no dibuixa arcs decoratius: mostra el buit,
  brancals i fulla en la mateixa posició i angle que el visor 3D.
- El visor 3D representa el mateix contorn, alçada i components, amb controls
  visibles de rotació, zoom, enquadrament i vistes superior, frontal, lateral i
  isomètrica.
- El visor 3D utilitza una escena OpenGL real compartida entre Android i iOS;
  els murs tenen gruix i les portes i finestres retallen buits físics.
- Planta i 3D no mostren cap bàner flotant que tapi el contingut.
- Tocar una zona buida de la planta cancel·la la selecció i tanca l'inspector.
- L'inspector contextual té una acció de tancament de 48 px i no impedeix fer
  pan sobre la part visible del plànol.
- Els controls flotants respecten la safe area inferior i queden per sobre de
  la navegació del sistema.
- Al 3D, un dit orbita la càmera i una pinça controla el zoom.
- Els canvis vàlids es desen automàticament després d'un breu període
  d'inactivitat, mantenint també el botó de desat explícit.
- Els estats loading, buit, error, brut, guardant i guardat són visibles.

## Fora d'abast

- Escaneig LiDAR/AR i fotogrametria.
- Edició offline amb resolució de conflictes (la base SQLite es farà en una fase
  pròpia).
- Render fotorealista o motor físic 3D natiu.
