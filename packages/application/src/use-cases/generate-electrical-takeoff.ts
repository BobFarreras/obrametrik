import {
  calculateElectricalTakeoff,
  type ElectricalTakeoffInput,
  type ElectricalTakeoffResult,
} from "@obrametrik/calculations";

export class GenerateElectricalTakeoffUseCase {
  execute(input: ElectricalTakeoffInput): ElectricalTakeoffResult {
    return calculateElectricalTakeoff(input);
  }
}
