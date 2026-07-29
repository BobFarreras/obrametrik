import {
  calculateElectricalPlanBill,
  type ElectricalPlanBillResult,
} from "@obrametrik/calculations";
import type { BuildingElement } from "@obrametrik/domain";

export class GenerateElectricalPlanBillUseCase {
  execute(elements: readonly BuildingElement[]): ElectricalPlanBillResult {
    return calculateElectricalPlanBill({
      components: elements
        .filter(
          (element) =>
            element.kind === "terminal" &&
            element.lifecycle !== "to_remove" &&
            element.confirmation === "confirmed",
        )
        .map((element) => ({
          id: element.id,
          kind:
            typeof element.specification.terminalKind === "string"
              ? element.specification.terminalKind
              : element.name,
          variant:
            typeof element.specification.variant === "string"
              ? element.specification.variant
              : undefined,
        })),
    });
  }
}
