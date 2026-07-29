export type ElectricalPlanComponentKind = "light" | "switch" | "socket";

export type ElectricalPlanComponent = Readonly<{
  id: string;
  kind: string;
  variant?: string | undefined;
}>;

export type ElectricalPlanBillLine = Readonly<{
  kind: "material" | "tool";
  categoryId: string;
  specification: Readonly<Record<string, string>>;
  sourceEntityIds: readonly string[];
  quantityBase: number;
  reserveQuantity: number;
  unit: "unit";
  wasteFactor: number;
  quantityWithWaste: number;
  purchaseQuantity: number;
  commercialIncrement: number;
  roundingRule: string;
  calculationRuleId: string;
  sourceIds: readonly string[];
  assumptions: readonly string[];
  confidence: "confirmed";
  formula: string;
}>;

export type ElectricalPlanBillResult = Readonly<{
  status: "insufficient_data" | "professional_review";
  sourceComponentCount: number;
  lines: readonly ElectricalPlanBillLine[];
  missingInputs: readonly string[];
  warnings: readonly Readonly<{
    ruleId: string;
    status: "insufficient_data" | "professional_review";
    entityIds: readonly string[];
    explanationKey: string;
  }>[];
  ruleVersion: "electrical-plan-components@1";
}>;

type RecipeItem = Readonly<{
  kind: "material" | "tool";
  categoryId: string;
  appliesTo?: readonly ElectricalPlanComponentKind[];
  groupByVariant?: boolean;
}>;

const COMPONENT_KINDS = new Set<ElectricalPlanComponentKind>(["light", "switch", "socket"]);
const RECIPE_SOURCE = "OBRAMETRIK:ELECTRICAL-COMPONENT-RECIPE@1";

const RECIPES: readonly RecipeItem[] = [
  {
    kind: "material",
    categoryId: "electrical.device.light",
    appliesTo: ["light"],
    groupByVariant: true,
  },
  {
    kind: "material",
    categoryId: "electrical.device.switch",
    appliesTo: ["switch"],
    groupByVariant: true,
  },
  {
    kind: "material",
    categoryId: "electrical.device.socket",
    appliesTo: ["socket"],
    groupByVariant: true,
  },
  { kind: "material", categoryId: "electrical.box.flush", appliesTo: ["switch", "socket"] },
  { kind: "material", categoryId: "electrical.frame", appliesTo: ["switch", "socket"] },
  { kind: "material", categoryId: "electrical.connector", appliesTo: ["light"] },
  { kind: "tool", categoryId: "tool.insulated_screwdriver" },
  { kind: "tool", categoryId: "tool.wire_stripper" },
  { kind: "tool", categoryId: "tool.voltage_tester" },
];

function isElectricalComponent(
  component: ElectricalPlanComponent,
): component is ElectricalPlanComponent & { kind: ElectricalPlanComponentKind } {
  return COMPONENT_KINDS.has(component.kind as ElectricalPlanComponentKind);
}

export function calculateElectricalPlanBill(input: {
  components: readonly ElectricalPlanComponent[];
}): ElectricalPlanBillResult {
  const components = input.components.filter(isElectricalComponent);
  if (components.length === 0) {
    return {
      status: "insufficient_data",
      sourceComponentCount: 0,
      lines: [],
      missingInputs: ["electrical.components"],
      warnings: [
        {
          ruleId: "ELEC-PLAN-SOURCE-001",
          status: "insufficient_data",
          entityIds: [],
          explanationKey: "electricalPlanNoComponents",
        },
      ],
      ruleVersion: "electrical-plan-components@1",
    };
  }

  const lines = RECIPES.flatMap((recipe): ElectricalPlanBillLine[] => {
    const sources =
      recipe.kind === "tool"
        ? components
        : components.filter((component) => recipe.appliesTo?.includes(component.kind));
    if (sources.length === 0) return [];

    const groups = recipe.groupByVariant
      ? [
          ...sources
            .reduce((grouped, source) => {
              const key = source.variant ?? "default";
              grouped.set(key, [...(grouped.get(key) ?? []), source]);
              return grouped;
            }, new Map<string, ElectricalPlanComponent[]>())
            .values(),
        ]
      : [sources];

    return groups.map((group) => {
      const quantity = recipe.kind === "tool" ? 1 : group.length;
      const variant = recipe.groupByVariant ? (group[0]?.variant ?? "default") : undefined;
      const specification: Record<string, string> =
        recipe.kind === "tool"
          ? { scope: "electrical_installation" }
          : variant
            ? { variant }
            : { implementation: "standard" };
      return {
        kind: recipe.kind,
        categoryId: recipe.categoryId,
        specification,
        sourceEntityIds: group.map((source) => source.id),
        quantityBase: quantity,
        reserveQuantity: 0,
        unit: "unit",
        wasteFactor: 1,
        quantityWithWaste: quantity,
        purchaseQuantity: quantity,
        commercialIncrement: 1,
        roundingRule: "exact plan count",
        calculationRuleId: `ELEC-PLAN-${recipe.categoryId.toUpperCase().replaceAll(".", "-")}-001`,
        sourceIds: [RECIPE_SOURCE],
        assumptions: [
          recipe.kind === "tool"
            ? "Reusable tool counted once per project run"
            : "One recipe unit per matching confirmed CAD component",
        ],
        confidence: "confirmed",
        formula:
          recipe.kind === "tool"
            ? "required = electricalObjects > 0 ? 1 : 0"
            : "quantity = count(sourceEntityIds)",
      };
    });
  });

  return {
    status: "professional_review",
    sourceComponentCount: components.length,
    lines,
    missingInputs: ["electrical.routes"],
    warnings: [
      {
        ruleId: "ELEC-PLAN-ROUTES-001",
        status: "insufficient_data",
        entityIds: components.map((component) => component.id),
        explanationKey: "electricalRoutesRequired",
      },
      {
        ruleId: "ELEC-PLAN-PROFESSIONAL-REVIEW-001",
        status: "professional_review",
        entityIds: components.map((component) => component.id),
        explanationKey: "electricalProfessionalReviewRequired",
      },
    ],
    ruleVersion: "electrical-plan-components@1",
  };
}
