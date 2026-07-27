import type { BuildingSpace, BuildingSpaceDraft } from "@obrametrik/domain";
import type {
  BuildingSpaceWriter,
  DefaultBuildingLevelProvider,
} from "../ports/building-model-repository";
import { CreateBuildingSpaceUseCase } from "./create-building-space";

type SpaceWithoutLevel = Omit<BuildingSpaceDraft, "levelId">;
type ProjectSpaceRepository = BuildingSpaceWriter & DefaultBuildingLevelProvider;

export class CreateProjectSpaceUseCase {
  constructor(private readonly repository: ProjectSpaceRepository) {}

  async execute(space: SpaceWithoutLevel): Promise<BuildingSpace> {
    const level = await this.repository.ensureDefaultLevel(space.projectId);
    return new CreateBuildingSpaceUseCase(this.repository).execute({
      ...space,
      levelId: level.id,
    });
  }
}
