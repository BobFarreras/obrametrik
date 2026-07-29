import {
  calculateElectricalProjectTakeoff,
  type ElectricalProjectCircuit,
  type ElectricalProjectTakeoffResult,
} from "@obrametrik/calculations";
import type { BuildingElement } from "@obrametrik/domain";

export class GenerateElectricalProjectTakeoffUseCase {
  execute(input: {
    elements: readonly BuildingElement[];
    circuits: readonly ElectricalProjectCircuit[];
  }): ElectricalProjectTakeoffResult {
    return calculateElectricalProjectTakeoff({
      components: input.elements
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
            typeof element.specification.componentVariant === "string"
              ? element.specification.componentVariant
              : undefined,
        })),
      circuits: input.circuits,
    });
  }
}
