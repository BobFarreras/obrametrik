import type { CadPlanSaver, SavedCadPlan } from "../ports/building-model-repository";
import type { CadPlanDraft } from "../models/cad-plan";
import { assertValidCadPlan } from "./create-cad-plan";

export class SaveCadPlanUseCase {
  constructor(private readonly saver: CadPlanSaver) {}

  async execute(plan: CadPlanDraft, spaceId?: string): Promise<SavedCadPlan> {
    assertValidCadPlan(plan);
    return this.saver.saveCadPlan(plan, spaceId);
  }
}
