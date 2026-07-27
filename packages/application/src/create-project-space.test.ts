import { describe, expect, it, vi } from "vitest";
import type {
  BuildingSpaceWriter,
  DefaultBuildingLevelProvider,
} from "./ports/building-model-repository";
import { CreateProjectSpaceUseCase } from "./use-cases/create-project-space";

describe("CreateProjectSpaceUseCase", () => {
  it("resolves the default level before persisting a valid space", async () => {
    const repository: BuildingSpaceWriter & DefaultBuildingLevelProvider = {
      ensureDefaultLevel: vi.fn().mockResolvedValue({ id: "level-1", projectId: "project-1" }),
      createSpace: vi.fn().mockImplementation(async (space) => ({ ...space, id: "space-1" })),
    };

    const result = await new CreateProjectSpaceUseCase(repository).execute({
      projectId: "project-1",
      name: "Bany principal",
      kind: "bathroom",
      footprint: { kind: "rectangle", widthMm: 3000, depthMm: 2400 },
      clearHeightMm: 2500,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      geometrySource: "manual",
      confirmation: "confirmed",
    });

    expect(repository.ensureDefaultLevel).toHaveBeenCalledWith("project-1");
    expect(repository.createSpace).toHaveBeenCalledWith(
      expect.objectContaining({ levelId: "level-1" }),
    );
    expect(result.id).toBe("space-1");
  });
});
