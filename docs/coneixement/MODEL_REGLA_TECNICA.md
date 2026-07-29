# Model comú de regla tècnica i escandall

## Objectiu

Definir com es transforma el coneixement dels oficis en dades verificables,
càlculs deterministes, avisos explicables i materials auditables.

## Entitats

### Font

```ts
type TechnicalSource = {
  id: string;
  jurisdiction: string;
  title: string;
  provisionId?: string;
  section: string;
  officialUrl?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  checkedAt: string;
};
```

### Regla

```ts
type TechnicalRule = {
  id: string;
  trade: string;
  topic: string;
  kind:
    | "regulatory"
    | "calculation"
    | "compatibility"
    | "best_practice"
    | "default"
    | "question";
  appliesWhen: unknown;
  requiredInputs: string[];
  evaluation: unknown;
  result: unknown;
  sourceIds: string[];
  ruleVersion: string;
  reviewStatus: "draft" | "reviewed" | "published" | "withdrawn";
  reviewedBy?: string;
};
```

### Resultat

```ts
type RuleResult = {
  ruleId: string;
  status:
    | "pass"
    | "warning"
    | "blocking"
    | "insufficient_data"
    | "professional_review"
    | "not_applicable";
  entityIds: string[];
  inputs: Record<string, unknown>;
  explanationKey: string;
  sourceIds: string[];
};
```

## Pipeline de càlcul

```text
model espacial confirmat
→ components i xarxes
→ preguntes pendents
→ validació normativa i de compatibilitat
→ amidaments nets
→ rendiments i marges
→ unitats comercials
→ escandall
→ revisió de l'usuari
```

No es genera una quantitat definitiva si falta una entrada obligatòria.

## Línia d'escandall

Cada material conserva:

```ts
type MaterialTakeoffLine = {
  categoryId: string;
  specification: Record<string, unknown>;
  sourceEntityIds: string[];
  quantityBase: number;
  unit: string;
  wasteFactor: number;
  quantityWithWaste: number;
  packageSize?: number;
  packages?: number;
  roundingRule: string;
  calculationRuleId: string;
  assumptions: string[];
  confidence: "confirmed" | "estimated" | "pending";
};
```

## Exemple: cable

Entrades:

- Circuit.
- Longitud geomètrica de cada tram.
- Nombre de conductors actius.
- Conductor de protecció.
- Retorns o viatgers.
- Reserva als extrems i quadre.
- Secció i tipus confirmats per la regla aplicable.

Fórmula conceptual:

```text
longitud_conductors =
Σ(longitud_tram × nombre_conductors_del_tram)
+ reserves_extrems
+ reserva_quadre
```

El marge de compra s'aplica després i queda separat:

```text
longitud_compra =
arrodonir_unitat_comercial(longitud_conductors × factor_marge)
```

No és correcte multiplicar tota la ruta per tres de forma fixa: un tram
d'interruptors commutats, un circuit trifàsic o una canalització compartida
poden tenir composicions diferents.

## Exemple: tub o canalització

Entrades:

- Trams físics únics.
- Nombre i secció exterior dels conductors.
- Sistema d'instal·lació.
- Ocupació admissible.
- Diàmetre mínim reglamentari o calculat.
- Accessoris i canvis de direcció.

L'escandall separa:

- Metres de tub.
- Corbes.
- Maneguets.
- Caixes.
- Fixacions.
- Passos i segellats.

## Arrodoniment

L'arrodoniment mai s'oculta:

- Longitud contínua: segons format comercial.
- Peces: enter superior.
- Caixes o paquets: enter superior respecte al rendiment.
- Reserva: percentatge o quantitat fixa identificada.

## Preguntes abans de calcular

Cada ofici manté un conjunt mínim de preguntes. Exemples:

- És instal·lació nova, ampliació o substitució?
- Quin ús i jurisdicció té l'immoble?
- Quins elements es mantenen?
- Quins recorreguts estan confirmats?
- Quin suport o sistema constructiu hi ha?
- Hi ha dades de fabricant?
- Cal projecte, memòria o instal·lador habilitat?

## Tests obligatoris

- Cas mínim vàlid.
- Límit exacte.
- Superació de límit.
- Dada obligatòria absent.
- Regla no aplicable.
- Canvi de jurisdicció o vigència.
- Arrodoniment comercial.
- Traçabilitat fins a entitats i fonts.
