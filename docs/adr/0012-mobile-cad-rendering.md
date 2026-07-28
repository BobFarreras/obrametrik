# ADR 0012 — Renderització CAD mòbil 2D/3D

- Estat: Acceptat
- Data: 2026-07-28

## Context

El primer prototip mòbil dibuixava planta i perspectiva amb `View` posicionades.
Aquest enfocament permetia validar persistència i navegació, però no ofereix un
pipeline gràfic, càmera perspectiva, profunditat, il·luminació ni hit testing 3D
fiable. Afegir més gestos sobre aquesta base augmentaria el deute tècnic.

El domini espacial i les dades persistides ja són independents de React Native
i treballen en mil·límetres. El renderer ha de consumir aquest model sense
convertir-se en la font de veritat.

## Decisió

- El 3D mòbil utilitza `three` mitjançant `@react-three/fiber/native`.
- `expo-gl` proporciona el context OpenGL ES a Android i iOS.
- Un generador d'escena pur converteix el model CAD en paviments, trams de mur,
  buits i entitats renderitzables.
- Three.js treballa en metres i el domini continua treballant en mil·límetres.
- La càmera i els gestos són estat de presentació i no es persisteixen com a
  geometria del projecte.
- Si el context 3D no està disponible, la planta 2D continua sent plenament
  operativa.

## Conseqüències

- Portes i finestres generen buits reals als murs.
- Un dit orbita, la pinça aproxima o allunya i els controls visibles continuen
  oferint una alternativa accessible.
- Android i iOS comparteixen escena, càmera i materials.
- El renderer es pot substituir sense modificar domini, casos d'ús o Supabase.
- Cal validar rendiment i context GL en dispositius físics; el simulador iOS no
  és l'únic criteri d'acceptació.

## Alternatives descartades

- `View` posicionades: no és un renderer 3D.
- Three.js imperatiu directament sobre `GLView`: més gestió manual de cicle de
  vida, recursos i sincronització.
- WebView amb l'editor web: pitjor integració tàctil, offline i accessibilitat
  nativa.
