# Guia tècnica — Arquitectura, stack, seguretat i bones pràctiques

**Projecte provisional:** MaterialFlow / ReformAI / ObraIntel·ligent  
**Versió:** 2.1 — Expo adoptat com a stack mòbil definitiu  
**Data:** juliol de 2026  
**Tipus de document:** Arquitectura tècnica multiplataforma

---

## 1. Decisió d’arquitectura

### Decisió definitiva

Construir:

1. **Aplicació web amb Next.js** per a ordinadors, tauletes i navegador mòbil.
2. **Aplicació mòbil amb Expo i React Native** per a Android i iOS.
3. **Backend, base de dades i API compartits**.
4. **Monorepo TypeScript** amb paquets reutilitzables.
5. **No crear una aplicació d’escriptori separada** inicialment.
6. **Utilitzar Expo Application Services (EAS)** per compilar, provar i publicar les apps mòbils.

Expo queda escollit com a tecnologia mòbil oficial del projecte perquè permet aprofitar React, TypeScript, Supabase, Zod i gran part de la lògica compartida amb la web.

### Per què no només una PWA?

Una PWA permet validar ràpidament el producte i pot ser suficient durant el MVP. Però l’aplicació final necessita funcions mòbils que solen funcionar millor amb una app distribuïda a les botigues:

- Càmera.
- Selecció de fotos.
- Escàner de codis.
- Emmagatzematge offline.
- Notificacions.
- Compartició.
- Accés estable a fitxers.
- Publicació a Google Play i App Store.

### Per què no fer tres aplicacions completament separades?

Duplicaria:

- Lògica.
- Tipus.
- Validacions.
- Bugs.
- Cost de manteniment.
- Temps de desenvolupament.

La web i el mòbil compartiran domini, API, base de dades, autenticació, regles de càlcul i tipus. Les interfícies es poden adaptar a cada plataforma.

### Per què Expo és una opció professional

Expo no és una aplicació web encapsulada. És una plataforma sobre React Native que genera aplicacions reals per a Android i iOS.

Permet utilitzar:

- Components natius.
- Càmera.
- Galeria.
- Notificacions.
- Ubicació.
- Fitxers.
- Escàner de codis.
- Compartició.
- Emmagatzematge segur.
- Builds signades.
- Publicació a Google Play i App Store.

Quan una llibreria o funció necessita codi natiu, s’utilitzen **development builds** i Expo Prebuild. Per tant, el projecte no queda limitat a Expo Go.

### Flux de desenvolupament mòbil

#### Fase inicial amb Expo Go

Adequada per:

- Pantalles.
- Navegació.
- Formularis.
- API.
- Autenticació.
- Components.
- Proves ràpides amb un mòbil físic.

Comanda:

```bash
pnpm --filter mobile start
```

o dins de l’aplicació:

```bash
npx expo start
```

L’usuari escaneja el codi QR amb Expo Go i veu l’app al dispositiu.

#### Development build

Quan calguin:

- Llibreries natives.
- Configuració pròpia.
- Notificacions avançades.
- Càmera o sensors específics.
- Plugins Expo.
- Depuració pròxima a producció.

Comandes orientatives:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

La development build és una versió pròpia de l’app que es connecta al servidor local de Metro.

#### Preview build

Per compartir amb testers:

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

Android pot distribuir-se com APK o mitjançant un canal intern. iOS es distribuirà habitualment amb TestFlight.

#### Production build

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

Resultats:

- Android: AAB per a Google Play.
- iOS: IPA per a App Store Connect.

### Eines de desenvolupament

#### Obligatòries

- VS Code.
- Node.js.
- pnpm.
- Git.
- Expo CLI mitjançant `npx`.
- EAS CLI.
- Compte d’Expo.
- Un dispositiu Android o iPhone per fer proves reals.

#### Recomanades

- Android Studio per instal·lar Android SDK i emuladors.
- Google Play Console per publicar Android.
- Apple Developer Program per publicar iOS.
- Accés eventual a un Mac per depurar problemes exclusius d’iOS.

### Android Studio i VS Code

El codi es desenvoluparà principalment amb **VS Code**.

Android Studio s’utilitzarà com a eina auxiliar per:

- Android SDK.
- Emulador.
- Logcat.
- Gestió de dispositius.
- Depuració nativa puntual.

No és obligatori utilitzar Android Studio com a editor principal.

### Desenvolupament des de Windows

Des de Windows es podrà:

- Programar la web i l’app.
- Provar Android amb mòbil físic.
- Provar Android amb emulador.
- Crear builds Android amb EAS.
- Crear builds iOS al núvol amb EAS.
- Enviar builds a les botigues amb EAS Submit.

Limitació:

- El simulador d’iOS i Xcode només funcionen en macOS.
- Per problemes exclusius d’iOS, serà útil tenir accés eventual a un Mac o dispositiu iPhone real.

### Estratègia per fases

#### MVP

- Next.js responsive.
- PWA instal·lable.
- Backend compartit.
- Sense app nativa.

#### Després de validar

- Expo/React Native.
- Android i iOS.
- Mateix backend.
- Paquets compartits.

Així no es paga el cost mòbil abans de demostrar que el producte interessa.

---

## 2. Stack recomanat

## 2.1 Repositori i organització

- GitHub.
- Monorepo.
- pnpm workspaces.
- Turborepo.
- Conventional Commits.
- Pull requests.
- GitHub Actions.
- Dependabot o Renovate.
- Branch protection.

Estructura:

```text
materialflow/
├── apps/
│   ├── web/                 # Next.js
│   ├── mobile/              # Expo / React Native
│   ├── worker/              # processos asíncrons
│   └── admin/               # opcional; pot començar dins web
├── packages/
│   ├── domain/              # entitats i regles de negoci
│   ├── calculations/        # amidaments i quantitats
│   ├── validation/          # esquemes
│   ├── api-client/          # client tipat
│   ├── database/            # tipus i repositoris
│   ├── ai/                  # proveïdors i prompts
│   ├── catalog/             # normalització de productes
│   ├── optimization/        # plans de compra
│   ├── observability/       # logs i mètriques
│   ├── config/              # eslint, TS, etc.
│   └── ui-tokens/           # colors, espaiat i tokens
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── functions/
├── docs/
└── .github/
```

---

## 2.2 Web

- Next.js amb App Router.
- React.
- TypeScript estricte.
- Tailwind CSS.
- shadcn/ui o components propis.
- React Hook Form.
- Zod.
- TanStack Query només on aporti valor.
- next-intl per idiomes.
- Vercel per desplegament.
- PWA com a fase inicial.

### Responsabilitats de la web

- Landing.
- Registre i accés.
- Assistent de projecte.
- Editor d’estances.
- Pressupostos.
- Comparador.
- Panell professional.
- Administració.
- Documents.
- Configuració.

### Server Components i Client Components

Utilitzar Server Components per:

- Carregar dades.
- SEO.
- Pàgines informatives.
- Taules inicials.
- Reduir JavaScript al navegador.

Utilitzar Client Components per:

- Formularis interactius.
- Editors visuals.
- Drag-and-drop.
- Càmera del navegador.
- Estat temporal.
- Gràfics.
- Comparadors dinàmics.

---

## 2.3 Mòbil

### Stack definitiu

- Expo.
- React Native.
- Expo Router.
- TypeScript estricte.
- EAS Build.
- EAS Submit.
- EAS Update amb política prudent.
- TanStack Query.
- React Hook Form.
- Zod.
- Expo SQLite.
- Expo SecureStore.
- Expo Notifications.
- Expo Camera.
- Expo Image Picker.
- Expo File System.
- Expo Sharing.
- Expo Barcode Scanner o càmera amb lectura de codis.
- Expo Localization.
- Sentry per React Native.

### Política d’Expo

- Expo Go només per al prototip inicial.
- Development builds per al desenvolupament real.
- Config plugins versionats.
- `app.config.ts` per configuració dinàmica.
- `eas.json` per entorns de build.
- No guardar secrets dins de l’aplicació.
- Utilitzar variables públiques només per dades que puguin ser visibles al client.

### Responsabilitats del mòbil

- Crear projectes ràpidament.
- Fer fotos.
- Fer notes de veu.
- Consultar projectes.
- Llista de compra offline.
- Escàner.
- Tiquets.
- Notificacions.
- Seguiment a l’obra.

### Compartició de codi

Compartir:

- Tipus.
- Esquemes Zod.
- Regles de negoci.
- Motor de càlcul.
- Client API.
- Utilitats.
- Traduccions de domini.
- Telemetria.

No forçar a compartir:

- Components visuals complexos.
- Navegació.
- Layouts.
- Interaccions específiques.
- Accés a maquinari.

---

## 2.4 Backend

### Recomanació inicial

- Supabase Postgres.
- Supabase Auth.
- Supabase Storage.
- Row Level Security.
- Funcions del servidor de Next.js.
- Vercel Functions.
- Worker separat per processos llargs.

### Quan afegir un backend dedicat

Crear un servei propi quan hi hagi:

- Moltes integracions.
- Cues complexes.
- Processament llarg.
- Web scraping intens.
- Optimització pesada.
- Requisits de xarxa específics.
- Necessitat de desplegar fora de Vercel.

Opcions:

- Node.js amb Fastify o NestJS.
- Python amb FastAPI per processos de dades o visió.
- Contenidors en una plataforma adequada.

No cal començar amb microserveis.

---

## 2.5 Base de dades

- PostgreSQL.
- UUID.
- Migracions versionades.
- RLS.
- Índexs.
- Constraints.
- Funcions SQL només quan aportin valor.
- JSONB per dades flexibles però no per substituir un model relacional.
- pgvector només per casos justificats.

### Esquemes recomanats

```text
auth
public
catalog
pricing
knowledge
audit
analytics
```

Supabase exposa habitualment `public`; si s’utilitzen altres esquemes, s’ha de configurar l’accés de manera explícita.

### Taules principals

```text
profiles
organizations
organization_members
projects
properties
floors
rooms
zones
measurements
assets
project_answers
work_phases
work_tasks
recipes
recipe_versions
recipe_requirements
materials
canonical_products
product_variants
retailers
retailer_offers
price_snapshots
stock_snapshots
purchase_plans
purchase_plan_items
budgets
budget_items
purchases
receipts
comments
notifications
ai_runs
audit_events
```

---

## 2.6 Emmagatzematge

Buckets separats:

- project-images-private.
- project-documents-private.
- product-assets-public.
- exports-private.
- temporary-ai-inputs-private.

Regles:

- Privats per defecte.
- RLS.
- Signed URLs curtes.
- Validar MIME i extensió.
- Límit de mida.
- Antivirus o escaneig de fitxers.
- Eliminar EXIF quan no sigui necessari.
- Política de retenció.
- Eliminació automàtica de temporals.

---

## 2.7 API

### Recomanació

Crear una API de domini estable compartida per web i mòbil.

Opcions:

- Route Handlers de Next.js per al MVP.
- OpenAPI.
- Client generat o client tipat.
- Server Actions només per interaccions pròpies de la web.
- No fer que l’app mòbil depengui de Server Actions.

### Principis

- Versionar endpoints quan sigui necessari.
- Idempotència.
- Paginació.
- Filtres.
- Errors estructurats.
- Correlation ID.
- Rate limiting.
- Autorització al servidor.
- Validació d’entrada.
- No confiar en dades del client.

Exemple:

```json
{
  "error": {
    "code": "PROJECT_DATA_INCOMPLETE",
    "message": "Falten dades per calcular el projecte.",
    "details": {
      "missingFields": ["room.height"]
    },
    "requestId": "req_..."
  }
}
```

---

## 3. Arquitectura de domini

## 3.1 Separació de responsabilitats

### Capa de presentació

- Web.
- Mòbil.
- Administració.

### Capa d’aplicació

- Casos d’ús.
- Orquestració.
- Transaccions.
- Permisos.
- Notificacions.

### Capa de domini

- Entitats.
- Value objects.
- Fórmules.
- Compatibilitats.
- Regles.
- Optimització.

### Infraestructura

- PostgreSQL.
- Supabase.
- IA.
- Botigues.
- Mapes.
- Correu.
- Cues.
- Observabilitat.

## 3.2 Casos d’ús

Exemples:

```text
CreateProject
AddRoom
SubmitProjectDescription
ExtractProjectRequirements
GenerateScopeOfWork
CalculateMaterialRequirements
SearchCompatibleOffers
BuildPurchasePlans
ExportBudget
RecordPurchase
RecalculateActualCost
```

## 3.3 Repositoris

Definir interfícies:

```ts
export interface ProjectRepository {
  findById(id: string, actorId: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
}

export interface OfferRepository {
  searchCompatible(input: OfferSearchInput): Promise<Offer[]>;
}
```

Les implementacions poden utilitzar Supabase o altres serveis sense contaminar el domini.

---

## 4. Motor de càlcul

### Regla principal

Cap quantitat crítica s’ha de calcular exclusivament amb un LLM.

### Vertical elèctric implementat

El primer vertical operatiu separa el model espacial pur, l'orquestració
d'aplicació, el motor de càlcul, la persistència Supabase i les adaptacions web
i mòbil. La proposta automàtica és determinista i editable; l'escandall només
considera geometria i dades confirmades i conserva regles, fórmules i entitats
d'origen.

El mapa de dependències, taules, punts d'entrada, proves i limitacions vigents
es manté a
`docs/features/electrical-takeoff-engine/IMPLEMENTATION.md`.

### Entrada tipada

```ts
type TilingInput = {
  surfaceAreaM2: number;
  tileWidthMm: number;
  tileHeightMm: number;
  wastePercent: number;
  packageCoverageM2: number;
};
```

### Sortida auditable

```ts
type CalculationResult = {
  netQuantity: number;
  wasteQuantity: number;
  purchaseQuantity: number;
  packages: number;
  formula: string;
  assumptions: string[];
  warnings: string[];
  ruleVersion: string;
};
```

### Bones pràctiques

- Unitats explícites.
- Biblioteca d’unitats.
- Arrodoniment controlat.
- Tests de límit.
- Tests amb casos reals.
- Versionar fórmules.
- Guardar la versió usada.
- No modificar retroactivament pressupostos antics.

---

## 5. Base de coneixement

### Format

La recepta es desa de forma estructurada, no només com a text.

```yaml
id: bathroom.wall_tiling
version: 3
jurisdiction: ES
inputs:
  - wall_area_m2
  - openings_area_m2
  - tile_format
requirements:
  - category: tiles
    quantity_rule: net_area * waste_factor
  - category: adhesive
    quantity_rule: tiled_area / yield
conditions:
  - when: wet_zone == true
    add: waterproofing_system
warnings:
  - verify_substrate
```

### Procés editorial

1. Esborrany.
2. Revisió.
3. Proves.
4. Aprovació.
5. Publicació.
6. Retirada.

### Traçabilitat

- Autor.
- Revisor.
- Fonts.
- Data.
- País.
- Categoria.
- Historial.
- Motiu del canvi.

---

## 6. Integració d’intel·ligència artificial

## 6.1 Paper de la IA

Utilitzar-la per:

- Extreure intenció.
- Classificar el projecte.
- Convertir text a JSON.
- Fer preguntes.
- Analitzar imatges amb cautela.
- Normalitzar descripcions.
- Explicar resultats.
- Resumir documents.
- Proposar equivalències candidates.

No utilitzar-la com a única font per:

- Quantitats.
- Compatibilitats.
- Normativa.
- Seguretat.
- Preus.
- Estoc.
- Decisió estructural.

## 6.2 Estratègia multimodel

Crear una interfície pròpia:

```ts
export interface AIProvider {
  extractProject(input: ExtractProjectInput): Promise<ExtractProjectOutput>;
  analyzeImages(input: AnalyzeImagesInput): Promise<AnalyzeImagesOutput>;
  explainPlan(input: ExplainPlanInput): Promise<string>;
}
```

Això permet canviar entre:

- Gemini.
- OpenAI.
- Anthropic.
- Models locals o futurs.

## 6.3 Enrutament de models

### Model econòmic

Per:

- Classificació.
- Extracció JSON.
- Preguntes.
- Resums.
- Normalització senzilla.

### Model amb visió

Per:

- Fotografies.
- Documents.
- Croquis.
- Etiquetes.

### Model premium

Només quan:

- El model econòmic falla.
- Hi ha alta complexitat.
- L’usuari paga una funció premium.
- Una regla de qualitat ho requereix.

## 6.4 Control de costos

Per cada execució:

- Model.
- Tokens d’entrada.
- Tokens de sortida.
- Cost estimat.
- Latència.
- Resultat.
- Error.
- Projecte.
- Usuari.
- Funció.

Límits:

- Pressupost per usuari.
- Pressupost per organització.
- Pressupost diari.
- Límit de fotos.
- Límit de regeneracions.
- Màxim de tokens.
- Timeouts.
- Cues.
- Cache.

### Estratègies d’estalvi

- Prompts curts.
- JSON Schema.
- No enviar tot l’historial.
- Resumir context.
- Cachejar extraccions.
- No tornar a analitzar la mateixa imatge.
- Utilitzar regles abans que IA.
- Processar imatges en resolució adequada.
- Agrupar operacions.
- Models econòmics per defecte.
- Batch per treballs no urgents quan estigui disponible.

## 6.5 Seguretat contra prompt injection

Tractar com a dades no fiables:

- Text de botigues.
- PDFs.
- Fitxes.
- Comentaris.
- Imatges amb text.
- URLs.
- Documents de l’usuari.

Mesures:

- Separar instruccions i contingut.
- Sortida estructurada.
- Allowlist d’eines.
- No permetre que el model executi accions lliures.
- Validar la sortida.
- No exposar secrets.
- No confiar en URLs generades.
- Revisar accions amb impacte.
- Registrar decisions.

---

## 7. Cerca de productes i preus

### Ordre de preferència

1. API oficial.
2. Feed de productes.
3. Programa d’afiliació.
4. Integració amb proveïdor.
5. Importació de CSV.
6. Navegació o extracció automatitzada només si és legal i sostenible.

### No dependre del scraping com a únic sistema

Problemes:

- Canvis de HTML.
- Bloquejos.
- CAPTCHA.
- Termes d’ús.
- Preus regionals.
- Estoc local.
- Cost de manteniment.
- Dades incompletes.

### Normalització

Separar:

```text
Producte canònic
→ Variant
→ Oferta de botiga
→ Preu observat
→ Estoc observat
```

### Frescor

Cada dada tindrà:

- `observed_at`.
- `expires_at`.
- `source`.
- `confidence`.
- `region`.
- `store_id`.
- `delivery_context`.

No mostrar un preu antic com a actual.

---

## 8. Optimitzador de compra

### Problema

Seleccionar una oferta per cada material respectant:

- Compatibilitat.
- Quantitat.
- Estoc.
- Pressupost.
- Enviament.
- Distància.
- Nombre de botigues.
- Preferències.

### Primera versió

- Heurística.
- Ordenació ponderada.
- Penalització per botiga addicional.
- Límits de distància.
- Eliminació d’ofertes incompatibles.

### Versió avançada

- Programació lineal o entera.
- OR-Tools.
- Multiobjectiu.
- Restriccions.
- Pareto front.
- Explicació del resultat.

### Exemple de puntuació

```text
score =
  cost_total * pes_cost
  + nombre_botigues * penalitzacio_botiga
  + km * pes_distancia
  + dies_entrega * pes_temps
  - qualitat * pes_qualitat
```

No amagar els pesos. L’usuari ha de poder canviar prioritats.

---

## 9. Processos asíncrons i cues

Necessaris per:

- Analitzar moltes fotos.
- Importar catàlegs.
- Actualitzar preus.
- Generar PDF.
- Enviar correus.
- Optimització pesada.
- Crear embeddings.
- Processar factures.

Opcions:

- Trigger.dev.
- Inngest.
- Upstash QStash.
- Supabase Queues.
- Worker propi.

Requisits:

- Retries.
- Backoff.
- Idempotència.
- Dead-letter queue.
- Estat del treball.
- Cancel·lació.
- Observabilitat.
- Límit de concurrència.

---

## 10. Offline i sincronització

### Web

- Service worker.
- Cache de recursos.
- Projectes recents.
- Llista de compra.
- Formularis temporals.
- Indicador offline.

### Mòbil

- SQLite.
- Cua local de canvis.
- Sincronització quan torna la connexió.
- Resolució de conflictes.
- Identificador idempotent.
- Xifrat de dades sensibles quan sigui possible.

### Conflictes

Política per tipus:

- Comentaris: fusionar.
- Caselles: últim canvi.
- Mesures: demanar resolució.
- Pressupostos: versions.
- Receptes: mai editar des del client.

---

## 11. Autenticació i autorització

### Autenticació

- Correu i contrasenya.
- Magic link.
- Google.
- Apple per iOS quan correspongui.
- MFA per professionals i administradors.
- Recuperació segura.
- Sessions revocables.

### Autorització

- RLS.
- Organitzacions.
- Membres.
- Rols.
- Permisos.
- Polítiques per fila.
- Comprovacions al servidor.

Mai confiar només en ocultar botons.

### Rols inicials

```text
user
professional
organization_owner
organization_admin
organization_member
catalog_editor
knowledge_reviewer
support
platform_admin
```

Els rols administratius interns han d’estar especialment protegits.

---

## 12. Seguretat

## 12.1 Principis

- Mínim privilegi.
- Denegar per defecte.
- Secrets només al servidor.
- Xifrat en trànsit.
- Xifrat en repòs del proveïdor.
- Rotació de claus.
- Logs sense dades sensibles.
- Dependències actualitzades.
- Revisió periòdica.

## 12.2 RLS

- Activar RLS a totes les taules exposades.
- Polítiques per organització i usuari.
- Tests automàtics.
- No utilitzar `service_role` al client.
- Funcions `SECURITY DEFINER` mínimes i amb `search_path` segur.

## 12.3 Web

- CSP.
- HSTS.
- Cookies Secure, HttpOnly i SameSite.
- CSRF quan correspongui.
- Validació.
- Escapat.
- Protecció XSS.
- Protecció SSRF.
- Rate limiting.
- WAF.
- No exposar source maps sensibles.
- Headers de seguretat.

## 12.4 API

- JWT verificat.
- Autorització per recurs.
- Idempotency keys.
- Límits de mida.
- Timeout.
- Rate limit.
- Protecció d’abús.
- Esquemes de validació.
- Errors sense stack traces públics.

## 12.5 Mòbil

- No incloure claus secretes.
- SecureStore.
- Certificate pinning només si es pot mantenir correctament.
- Detecció de versió obsoleta.
- Deep links validats.
- Protecció de dades locals.
- No confiar en el dispositiu.
- Attestation opcional per accions sensibles.

## 12.6 Fitxers

- Signatures temporals.
- Validació de contingut.
- Escaneig.
- Noms aleatoris.
- No executar.
- Processament aïllat.
- Quarantena.
- Límits.

## 12.7 Webhooks

- Verificar signatures.
- Guardar event ID.
- Idempotència.
- Rebutjar timestamps antics.
- Processar en cua.
- No confiar en payloads sense validar.

---

## 13. Privacitat i protecció de dades

### Dades possibles

- Identitat.
- Correu.
- Ubicació.
- Fotografies de l’habitatge.
- Plànols.
- Factures.
- Pressupostos.
- Dades de professionals.
- Preferències.

### Principis

- Minimització.
- Finalitat clara.
- Consentiment.
- Retenció.
- Dret d’accés.
- Eliminació.
- Exportació.
- Registre de tractaments.
- Contractes amb encarregats.
- Regió de dades adequada.
- Política específica d’imatges.

### Fotografies

- Privades per defecte.
- No entrenar models sense consentiment explícit.
- Permetre eliminació immediata.
- Esborrar EXIF.
- Difuminar informació sensible.
- Explicar quan s’envien a un proveïdor d’IA.

Es recomana assessorament legal abans del llançament.

---

## 14. Observabilitat

### Logs

- JSON estructurat.
- Request ID.
- Usuari pseudonimitzat.
- Projecte.
- Acció.
- Durada.
- Error.
- Proveïdor.

### Errors

- Sentry o equivalent.
- Source maps protegits.
- Alertes.
- Errors web i mòbil.
- Breadcrumbs sense secrets.

### Mètriques

- Latència.
- Errors.
- Cost IA.
- Cost de cerca.
- Treballs en cua.
- Cache hit.
- Preus caducats.
- Projectes completats.
- Conversió.

### Traces

- OpenTelemetry.
- API.
- Base de dades.
- IA.
- Worker.
- Integracions.

---

## 15. Testing

### Unitari

- Fórmules.
- Unitats.
- Compatibilitats.
- Optimitzador.
- Validacions.
- Domini.

### Integració

- Base de dades.
- RLS.
- Storage.
- API.
- Cues.
- Proveïdors.

### Contracte

- APIs de botigues.
- IA.
- Webhooks.
- Clients.

### End-to-end

- Playwright per web.
- Maestro o Detox per mòbil.
- Fluxos crítics.

### Seguretat

- Tests de permisos.
- RLS.
- Uploads.
- Rate limit.
- Prompt injection.
- Dependències.
- SAST.
- Secrets.

### Casos daurats

Mantenir projectes reals amb resultats esperats:

- Bany petit.
- Parets amb obertures.
- Plat de dutxa.
- Pladur humit.
- Pintura.
- Instal·lació bàsica.

Cada canvi del motor s’ha de comparar amb aquests casos.

---

## 15.1 Configuració Expo i EAS

### `app.config.ts`

Responsabilitats:

- Nom de l’app.
- Slug.
- Bundle identifier d’iOS.
- Package name d’Android.
- Icones.
- Splash.
- Esquemes de deep linking.
- Plugins.
- Permisos.
- Variables públiques.

Exemple orientatiu:

```ts
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MaterialFlow",
  slug: "materialflow",
  scheme: "materialflow",
  version: "1.0.0",
  ios: {
    bundleIdentifier: "com.digitaistudios.materialflow",
    supportsTablet: true,
  },
  android: {
    package: "com.digitaistudios.materialflow",
  },
  plugins: ["expo-router", "expo-secure-store", "expo-notifications"],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
};

export default config;
```

### `eas.json`

Perfils:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Identificadors definitius

Abans de publicar s’han de reservar:

- Nom comercial.
- Domini.
- Package name Android.
- Bundle identifier iOS.
- Compte Expo.
- Project ID d’EAS.

Aquests identificadors no s’han de canviar sense una migració planificada.

### Variables d’entorn

Exemples:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
SENTRY_AUTH_TOKEN
```

Les variables amb prefix `EXPO_PUBLIC_` formen part de l’app distribuïda i no poden contenir secrets.

Secrets com claus privades, `service_role`, credencials de proveïdors o claus d’IA han de residir exclusivament al backend.

## 16. CI/CD

### Pull request

- Format.
- Lint.
- Typecheck.
- Tests.
- Build.
- Migracions verificades.
- Escaneig de secrets.
- Dependències.
- Preview de Vercel.

### Branca principal

- Desplegament a producció.
- Migracions controlades.
- Smoke tests.
- Sentry release.
- Notes de versió.

### Mòbil

- Lint, typecheck i tests abans de compilar.
- Development builds.
- Preview builds per testers.
- Production builds.
- EAS Build.
- EAS Submit.
- Credencials i signatura gestionades de forma segura.
- Google Play Internal Testing.
- TestFlight.
- Desplegament gradual.
- Rollback d’actualitzacions compatibles.
- Aprovació manual abans de publicar a producció.

Flux recomanat:

```text
Pull request
→ tests
→ preview web
→ preview build mòbil opcional

Merge a main
→ staging
→ EAS preview o production candidate
→ TestFlight / Internal Testing
→ aprovació manual
→ producció
```

### Entorns

```text
local
test
preview
staging
production
```

No reutilitzar dades de producció en desenvolupament sense anonimitzar.

---

## 17. Desplegament

### Web

- Vercel.
- Domini.
- CDN.
- WAF.
- Preview deployments.
- Variables per entorn.
- Cron mínim.
- Regions pròximes a la base de dades.

### Base de dades

- Supabase.
- Backups.
- Point-in-time recovery segons el pla.
- Migrations.
- Pooling.
- Índexs.
- Alertes.

### Worker

- Plataforma de jobs o contenidors.
- Escalat independent.
- Secrets.
- Cues.
- Xarxa controlada.

### Mòbil

#### Android

- EAS Build genera l’AAB.
- EAS Submit l’envia a Google Play Console.
- Primer desplegament al canal Internal Testing.
- Després Closed Testing o Open Testing.
- Finalment producció gradual.
- Fitxa, captures, classificació d’edat i política de privacitat.

#### iOS

- EAS Build genera l’IPA al núvol.
- EAS Submit l’envia a App Store Connect.
- Proves mitjançant TestFlight.
- Revisió d’Apple.
- Publicació manual o automàtica.
- Fitxa, captures, privacitat i declaracions d’ús de dades.

#### Actualitzacions

EAS Update només s’utilitzarà per canvis compatibles amb el binari instal·lat:

- Textos.
- JavaScript.
- Estils.
- Lògica no nativa.

Els canvis en permisos, plugins o codi natiu requereixen una nova build i una nova versió de botiga.

---

## 18. Rendiment

### Web

- Server Components.
- Streaming.
- Imatges optimitzades.
- Lazy loading.
- Paginació.
- Evitar grans bundles.
- Cache control.
- CDN.
- Virtualització en llistes llargues.

### API

- Índexs.
- Queries mesurades.
- Seleccionar només camps necessaris.
- Pooling.
- Cache.
- Evitar N+1.
- Paginació cursor.

### IA

- Context mínim.
- Imatges redimensionades.
- Respostes estructurades.
- Cache.
- Timeouts.
- Fallbacks.

### Mòbil

- Llistes virtualitzades.
- Imatges comprimides.
- Sync incremental.
- Evitar renders.
- Persistència limitada.

---

## 19. Accessibilitat i internacionalització

### Accessibilitat

- WCAG 2.2 AA com a objectiu.
- Teclat.
- Focus.
- Etiquetes.
- Contrast.
- Errors comprensibles.
- Lectors de pantalla.
- Botons grans en obra.
- No dependre només del color.

### Idiomes

Inicialment:

- Català.
- Castellà.

Després:

- Anglès.
- Francès.
- Portuguès.

Separar:

- Text de la interfície.
- Contingut tècnic.
- Catàlegs.
- Unitats.
- Moneda.
- Normativa per país.

---

## 20. Disseny del sistema de permisos

Exemple de permisos:

```text
project.read
project.update
project.delete
project.share
budget.read
budget.edit
budget.export
catalog.manage
recipe.review
organization.manage_members
billing.manage
```

Els rols agrupen permisos. Evitar condicions disperses a la interfície.

---

## 21. Versionat

Versionar:

- Receptes.
- Regles.
- Fórmules.
- Compatibilitats.
- Prompts.
- Models.
- API.
- Documents.
- Pressupostos.
- Plans de compra.

Cada resultat ha de registrar amb quines versions es va generar.

---

## 22. Estratègia de cache

Cachejar:

- Productes.
- Fitxes.
- Categories.
- Preus amb TTL curt.
- Estoc amb TTL molt curt.
- Resums d’IA.
- Resultats idèntics.
- Geocodificació.

No cachejar incorrectament:

- Dades privades.
- Autorització.
- Preus personalitzats.
- Informació sensible.
- Respostes entre organitzacions.

Les claus de cache han d’incloure l’àmbit corresponent.

---

## 23. Gestió d’errors i degradació

Quan falla la IA:

- Permetre formulari manual.
- Reintentar amb límit.
- Canviar de model.
- Guardar l’entrada.
- Informar sense perdre dades.

Quan fallen els preus:

- Mostrar l’última data.
- Marcar-los com a no verificats.
- Permetre entrada manual.
- No inventar.

Quan falla l’optimitzador:

- Mostrar una selecció simple.
- Conservar les ofertes.
- Registrar l’error.

---

## 24. Costos i control financer

Costos principals:

- Vercel.
- Supabase.
- IA.
- Cerca o integracions.
- Mapes.
- Emmagatzematge.
- Imatges.
- Correus.
- Observabilitat.
- Builds mòbils.
- Comissions de botigues d’apps.
- Manteniment de catàleg.

### Cost per projecte

Registrar:

```text
cost_ai
+ cost_search
+ cost_images
+ cost_maps
+ cost_storage
+ cost_jobs
```

Definir:

- Cost màxim gratuït.
- Cost màxim per pla.
- Alertes.
- Tall automàtic.
- Degradació a model econòmic.
- Quota d’imatges.
- Quota d’actualització de preus.

---

## 25. Full de ruta tècnic

### Etapa 1

- Monorepo.
- Next.js.
- Supabase.
- Auth.
- Projectes.
- RLS.
- Receptes.
- Motor de càlcul.
- PDF.
- Tests.

### Etapa 2

- IA estructurada.
- Fotografies.
- Cost tracking.
- Catàleg.
- Ofertes manuals.
- Optimitzador simple.

### Etapa 3

- Integracions de botigues.
- Cues.
- Worker.
- Observabilitat.
- Històric.

### Etapa 4

- Expo.
- Offline.
- Notificacions.
- Escàner.
- Tiquets.

### Etapa 5

- Professionals.
- Equips.
- Facturació.
- Marketplace.
- Proveïdors.

---

## 26. Decisions tècniques finals recomanades

| Àrea            | Decisió                      |
| --------------- | ---------------------------- |
| Repositori      | GitHub monorepo              |
| Gestor          | pnpm                         |
| Builds          | Turborepo                    |
| Web             | Next.js App Router           |
| Mòbil           | Expo + React Native + EAS    |
| Escriptori      | Web responsive/PWA           |
| Backend inicial | Next.js + Supabase           |
| Base de dades   | PostgreSQL                   |
| Auth            | Supabase Auth                |
| Fitxers         | Supabase Storage             |
| Autorització    | RLS + servidor               |
| Validació       | Zod                          |
| Formularis      | React Hook Form              |
| API             | Route Handlers + OpenAPI     |
| Jobs            | Cua gestionada o worker      |
| IA              | Capa multimodel pròpia       |
| Càlcul          | TypeScript determinista      |
| Optimització    | Heurística, després OR-Tools |
| Web deploy      | Vercel                       |
| Mobile build    | EAS                          |
| Errors          | Sentry                       |
| Traces          | OpenTelemetry                |
| Tests web       | Vitest + Playwright          |
| Tests mòbil     | Maestro o Detox              |
| CI              | GitHub Actions               |

---

## 27. Resposta directa: web app o aplicacions separades?

La millor decisió és:

> **Començar amb una web app responsive i PWA per validar el negoci. Preparar des del primer dia un backend i paquets compartits. Quan el producte tingui ús real, crear una app Expo per a Android i iOS.**

No convé:

- Crear web, Android i iOS de forma separada des del primer dia.
- Intentar compartir el 100% de la interfície.
- Construir una app d’escriptori.
- Afegir microserveis prematurament.
- Dependre d’un únic proveïdor d’IA.
- Fer càlculs crítics amb prompts.

Sí convé:

- Compartir domini i lògica.
- Dissenyar l’API per mòbil des del principi.
- Fer una PWA inicial.
- Afegir Expo quan càmera, offline i notificacions aportin valor.
- Mantenir una arquitectura modular.

---

## 28. Referències tècniques oficials

- Next.js Documentation — App Router.
- Expo Documentation — aplicacions universals Android, iOS i web.
- Supabase Documentation — Auth, PostgreSQL, Storage i Row Level Security.
- Vercel Documentation — monorepos i Turborepo.
- OWASP Application Security Verification Standard.
- OWASP Mobile Application Security.
- PostgreSQL Documentation.
- OpenTelemetry Documentation.

Les versions i preus concrets s’han de revisar abans de començar cada fase.
