import {
  assertValidSpaceDraft,
  type BuildingSpace,
  type BuildingSpaceDraft,
} from "@obrametrik/domain";
import type { BuildingSpaceWriter } from "../ports/building-model-repository";

export class CreateBuildingSpaceUseCase {
  constructor(private readonly repository: BuildingSpaceWriter) {}

  async execute(space: BuildingSpaceDraft): Promise<BuildingSpace> {
    assertValidSpaceDraft(space);
    return this.repository.createSpace(space);
  }
}
