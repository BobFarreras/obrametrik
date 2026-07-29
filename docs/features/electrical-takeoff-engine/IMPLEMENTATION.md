# Implementació del motor elèctric determinista

## Estat de l'increment

Aquest document descriu l'estat implementat a juliol de 2026. El sistema parteix
exclusivament dels elements elèctrics presents al CAD, genera una proposta
determinista de circuits i recorreguts, la representa en planta i alçat, i
transforma les dades confirmades en un escandall auditable.

La proposta automàtica és editable i no equival a una instal·lació certificada.
No decideix passos estructurals, regates, perforacions, ocupació de tubs,
caiguda de tensió, proteccions definitives ni compliment normatiu final.

## Flux canònic

```text
objectes CAD confirmats
  → model espacial compartit
  → proposta determinista C1/C2 + caixes + recorreguts 3D
  → visualització en planta o alçat
  → confirmació/persistència dels circuits i trams
  → motor d'amidaments
  → snapshot immutable d'escandall
  → materials i llista de compra editable
```

Hi ha quatre conceptes diferents que no s'han de barrejar:

1. El CAD és la font de geometria i dels terminals existents.
2. La proposta derivada es pot reconstruir sempre amb les mateixes entrades.
3. Els circuits i recorreguts persistits representen la decisió editable i
   confirmada del projecte.
4. L'escandall és un resultat immutable i versionat; la llista de compra és
   editable i queda separada del càlcul.

Si les taules elèctriques encara no estan desplegades, web i mòbil poden mostrar
la proposta local. En aquest cas no hi ha sincronització dels circuits entre
dispositius ni metres confirmats per a un escandall definitiu.

## On és cada responsabilitat

| Responsabilitat | Ubicació principal |
| --- | --- |
| Model CAD compartit | `packages/application/src/models/cad-plan.ts` |
| Projecció espacial i proposta determinista | `packages/application/src/models/electrical-layout.ts` |
| Model editable de l'editor elèctric | `packages/application/src/models/electrical-editor.ts` |
| Orquestració de l'escandall del projecte | `packages/application/src/use-cases/generate-electrical-project-takeoff.ts` |
| Càlcul de cablejat | `packages/calculations/src/electrical-wiring.ts` |
| Escandall combinat del projecte | `packages/calculations/src/electrical-project-takeoff.ts` |
| Motor base d'amidaments | `packages/calculations/src/electrical-takeoff.ts` |
| Editor CAD web | `apps/web/src/components/cad-workspace.tsx` |
| Editor elèctric web | `apps/web/src/components/electrical-editor.tsx` |
| Panell de materials web | `apps/web/src/components/electrical-takeoff-panel.tsx` |
| Accions de servidor del projecte | `apps/web/src/app/[locale]/dashboard/projects/[projectId]/actions.ts` |
| Editor CAD mòbil | `apps/mobile/app/projects/[projectId]/cad.tsx` |
| Editor elèctric mòbil | `apps/mobile/app/projects/[projectId]/electrical.tsx` |
| Materials mòbil | `apps/mobile/app/projects/[projectId]/materials.tsx` |
| Migració de circuits i rutes | `supabase/migrations/20260729073000_electrical_circuits_and_routes.sql` |
| Contracte funcional | `docs/features/electrical-takeoff-engine/SPEC.md` |

La lògica nova s'ha d'afegir primer als paquets compartits. Web i mòbil només
han d'adaptar interacció, representació i persistència; no han de contenir
fórmules o receptes de negoci alternatives.

## Com es genera la proposta

`buildElectricalLayout` rep el plànol i retorna terminals, caixes de derivació i
rutes tridimensionals. La sortida és pura: no consulta la base de dades, no usa
IA i és reproduïble.

- Els punts de llum es modelen com a elements de sostre amb coordenades lliures
  en planta. Els plànols antics es normalitzen a aquest muntatge.
- Endolls i interruptors conserven paret, desplaçament horitzontal i alçada.
- La planta i els alçats W1…Wn són projeccions del mateix punt espacial.
- Es crea una caixa de derivació per cada circuit poblat, en una posició interior
  estable i 300 mm per sota del sostre.
- C1 agrupa il·luminació i control; C2 agrupa bases d'endoll.
- Cada terminal rep una polilínia 3D fins a la caixa del seu circuit.

Els conductors inicials es representen individualment:

| Ús | Conductors proposats | Secció inicial |
| --- | --- | --- |
| Punt de llum | retorn negre, neutre blau i protecció verd/groc | 1,5 mm² |
| Interruptor | fase marró i retorn negre | 1,5 mm² |
| Endoll | fase marró, neutre blau i protecció verd/groc | 2,5 mm² |

Aquests colors i seccions són valors inicials explícits de la proposta, no una
certificació. Qualsevol canvi tècnic s'ha de fer al model versionat, cobrir amb
tests i presentar-lo per revisió professional.

## Experiència web i mòbil

La capçalera de l'editor manté en una mateixa línia les accions de plànols,
materials i desar. El progrés de desat es mostra dins del botó de desar; l'estat
textual queda disponible per a tecnologies d'assistència.

El control de circuits mostra o oculta la capa visual sense alterar les dades.
La proposta apareix immediatament, encara que no existeixin rutes persistides.
Quan hi ha rutes confirmades, aquestes substitueixen la proposta en la vista.

La vista `Planta` permet editar la posició XY. La vista `Alçat` permet navegar
per totes les parets W1…Wn i editar el desplaçament i l'alçada dels terminals
allotjats a paret. Els punts de sostre es projecten a l'alçat com a referència,
però continuen editant-se lliurement des de planta.

## Persistència i seguretat

La migració crea:

- `electrical_circuits`;
- `electrical_circuit_terminals`;
- `electrical_route_segments`;
- `electrical_connections`;
- `electrical_connection_controls`.

Les claus i restriccions eviten referències creuades incompatibles. RLS permet
lectura als membres del projecte i reserva les mutacions a `owner` i `admin`.
La UI i els casos d'ús filtren també per `project_id`; no s'utilitza
`service_role`.

Per activar la persistència en un entorn:

```bash
supabase migration up --local
supabase test db
```

Abans d'aplicar-la a remot cal enllaçar el projecte correcte i revisar el diff.
En el moment d'aquest lliurament el repositori local no té un `project ref`
enllaçat, per tant la migració no s'ha verificat ni aplicat al Supabase remot.

## Validació

Les proves principals són:

- `packages/application/src/electrical-layout.test.ts`;
- `packages/application/src/electrical-editor.test.ts`;
- `packages/application/src/generate-electrical-project-takeoff.test.ts`;
- `packages/calculations/src/electrical-wiring.test.ts`;
- `packages/calculations/src/electrical-project-takeoff.test.ts`;
- `supabase/tests/electrical_circuits_and_routes.sql`;
- proves CAD web i mòbil existents.

Comprovació completa:

```bash
pnpm lint
pnpm --filter @obrametrik/application test
pnpm build
supabase test db
```

El test de Supabase necessita una instància local preparada. Les altres tres
comandes s'han executat correctament en aquest increment.

## Limitacions i següent treball

- Les caixes automàtiques encara són entitats derivades: no tenen edició ni
  persistència pròpia.
- L'enrutament no coneix obstacles, regates, passos, volums protegits,
  agrupament, ocupació ni caiguda de tensió.
- La proposta persistent inicial cobreix C1 i C2. El model admet connexions i
  controls, però la generació completa de commutades i creuaments encara no està
  resolta automàticament.
- Els metres només són definitius quan la polilínia ha estat revisada i
  confirmada.
- Les imatges comercials, SKU, preus i disponibilitat corresponen a la futura
  capa de catàleg. S'han de cachejar amb font i data de vigència, sense
  convertir l'scraping en font única.

Per continuar sense crear deute tècnic: ampliar primer el contracte observable
de `SPEC.md`, escriure el test de domini que falla, implementar al paquet
compartit, adaptar web i mòbil, afegir migració si cal i validar paritat
CA/ES/EN.
