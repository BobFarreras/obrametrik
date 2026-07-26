# Obrametrik — Sistema de disseny canònic

> Planificació de reformes accessible, visual i orientada a tasques sobre una
> identitat teal fosc i amber.

Aquest document és la font de veritat visual d’Obrametrik. Deriva dels
prototips `reforma_facil_app.html`, `reforma_facil_web.html` i de la referència
`DESIGN.md` aportats el 26 de juliol de 2026. El nom de producte continua sent
**Obrametrik**; “Reforma-Fàcil” només identifica l’origen dels prototips.

## Principis de producte

1. **Mòbil primer.** La majoria d’accions s’han de poder completar amb una mà.
2. **Orientat a tasques.** Cada pantalla té una acció principal evident.
3. **Llenguatge no tècnic.** Preguntar amb exemples i unitats familiars; el
   sistema converteix i valida internament.
4. **Complexitat progressiva.** Mostrar primer el necessari i revelar opcions
   tècniques quan el context les requereix.
5. **Visual però auditable.** Il·lustracions i plànols faciliten la comprensió,
   però fórmules, supòsits i dades continuen disponibles.
6. **Sense carrerons sense sortida.** Tots els estats buits expliquen el següent
   pas i ofereixen una acció.

## Identitat

| Token | Valor | Ús |
| --- | --- | --- |
| `blueprint` | `#2A4B4F` | Marca, shell, botons secundaris i web promocional |
| `plaster` | `#F9F8F4` | Fons principal de l’app |
| `hardhat` | `#F4AC3D` | Acció primària, progrés i estat actiu |
| `slate` | `#1C3133` | Text principal sobre superfícies clares |
| `concrete` | `#8A9A9C` | Text secundari, icones inactives i divisors |
| `safety` | `#E76F51` | Avisos i errors; mai com a acció principal |
| `white` | `#FFFFFF` | Targetes i superfícies interiors |

No s’utilitza violeta com a accent de producte. L’amber és l’únic accent
d’acció. El teal comunica confiança i l’amber energia i progrés.

## Tipografia

- Família principal: **Quicksand**.
- Fallback: Nunito, system-ui, sans-serif arrodonida.
- Pesos: 500, 700 i 800.
- Cos mínim principal: 14 px.
- Títols de targeta: 18 px/700–800.
- Títols de pantalla mòbil: 24–32 px/800.
- Display web: fins a 56 px/800.
- Tracking entre `0` i `-0.02em`; no comprimir text petit.

## Espai, forma i elevació

- Escala: 4, 8, 12, 16, 24, 32 i 48 px.
- Targetes principals: radi de 24 px.
- Contingut interior i files: radi de 16–20 px.
- Inputs i botons: píndola completa.
- Targets tàctils: mínim 48 × 48 px.
- Ombra de targeta: `0 8px 24px rgba(42, 75, 79, 0.08)`.
- Ombra d’acció: `0 4px 16px rgba(244, 172, 61, 0.40)`.
- Evitar vores fortes; separar amb superfície, espai i ombra.

## Arquitectura mòbil

### Shell

- Fons `plaster`.
- Contingut amb 20–24 px de marge horitzontal.
- Navegació inferior blanca, fixa i segura respecte de la safe area.
- Destins previstos: Inici, preferits/guardats, acció contextual central,
  compra/pressupost i perfil.
- Icona inactiva `concrete`; activa `blueprint` amb punt amber.
- L’acció central és circular, elevada i contextual, no un destí ambigu.

### Pantalla de projectes

- Capçalera “Els meus projectes” amb menú contextual.
- Cerca en píndola blanca.
- Filtres horitzontals: en curs, finalitzats i idees.
- Projectes recents en carrusel amb `scroll-snap`.
- Targeta: nom, subtítol, progrés visible i il·lustració vectorial de l’espai.
- Banner teal “Crear projecte” amb il·lustració i acció inequívoca.

### Projecte i amidaments

- Flux guiat, no formulari tècnic pla.
- Ordre: espai → dimensions → plànol → superfícies generades → portes i
  finestres → estat actual → treball desitjat → revisió.
- Dimensions introduïdes en cm amb exemples; conversió interna a metres.
- El plànol i les superfícies es generen de les mateixes dades.
- Cada resultat diferencia àrea bruta, deduccions i àrea neta.
- Els errors impossibles s’expliquen abans de guardar.

### Materials

- Files blanques de 16–20 px de radi.
- Il·lustració o icona a l’esquerra; nom, ús i quantitat al centre.
- Stepper en píndola per ajustar unitats.
- Checkbox o estat clar a la dreta.
- Comparar preus és una acció amber de l’amplada completa.

## Arquitectura web

La web de màrqueting utilitza un canvas `blueprint`, text blanc, subtítol teal
clar i CTA amber. La composició principal és de dues columnes:

1. Marca, proposta de valor, tres beneficis i CTA.
2. Mockups mòbils que mostren el producte real.

La web autenticada conserva els mateixos tokens i components de l’app. Pot
augmentar densitat i amplada, però no crear una identitat paral·lela.

## Il·lustració i iconografia

- Estil vectorial amable, net i lleugerament lúdic.
- Habitacions, eines i materials han de ser reconeixibles sense text.
- Evitar fotografia d’obra bruta o realisme agressiu.
- Els emoji dels prototips són placeholders, no assets finals.
- Icones amb el mateix gruix i família; no barrejar símbols del sistema.
- Els plànols es generen en SVG/canvas a partir de dades reals.

## Accessibilitat

- Contrast WCAG 2.2 AA.
- No comunicar estat només amb color.
- Focus visible a web.
- Etiquetes accessibles a icones i controls.
- Respectar safe areas i mida de text del sistema.
- Animacions breus i compatibles amb `prefers-reduced-motion`.
- Inputs amb unitat visible, exemple i error associat.

## Internacionalització

Cap text visible queda escrit directament al component. Català, castellà i
anglès mantenen paritat. Els layouts han d’admetre textos un 30% més llargs
sense truncar informació crítica.

## Regles d’implementació

- Reutilitzar tokens des de `packages/ui-tokens`.
- Crear primitives abans de repetir estils.
- Compartir semàntica i lògica, no forçar una UI idèntica entre web i natiu.
- Cada component inclou loading, buit, error, disabled i focus/pressed.
- No introduir un nou color, radi, ombra o patró de navegació sense actualitzar
  aquest document.
- Qualsevol pantalla nova es revisa primer a 390 px i després a escriptori.

## Prohibit

- Violeta com a accent principal.
- Targetes amb cantonades dures.
- Formularis llargs sense passos ni context.
- Inputs de mesures sense unitat.
- Icones o botons menors de 44 px.
- Navegació inferior flotant que no respecti la safe area.
- Decoració que amagui jerarquia, errors o fórmules.
- Copiar literalment els emoji o el marc de telèfon dels prototips.

