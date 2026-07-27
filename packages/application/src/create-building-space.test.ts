import { describe, expect, it, vi } from "vitest";
import type { BuildingModelRepository } from "./ports/building-model-repository";
import { CreateBuildingSpaceUseCase } from "./use-cases/create-building-space";

describe("CreateBuildingSpaceUseCase", () => {
  it("validates the command before calling the repository", async () => {
    const repository: BuildingModelRepository = {
      createSpace: vi.fn(),
      createElement: vi.fn(),
      ensureDefaultLevel: vi.fn(),
      findSpacesByProject: vi.fn(),
      findElementsByProject: vi.fn(),
    };
    const useCase = new CreateBuildingSpaceUseCase(repository);

    await expect(
      useCase.execute({
        projectId: "project-1",
        levelId: "level-1",
        name: "Bany",
        kind: "bathroom",
        footprint: { kind: "rectangle", widthMm: 3000, depthMm: 0 },
        clearHeightMm: 2500,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotationDegrees: { x: 0, y: 0, z: 0 },
        },
        geometrySource: "manual",
        confirmation: "confirmed",
      }),
    ).rejects.toThrow("dimensions");
    expect(repository.createSpace).not.toHaveBeenCalled();
  });

  it("returns the space created by the injected repository", async () => {
    const created = {
      id: "space-1",
      projectId: "project-1",
      levelId: "level-1",
      name: "Bany",
      kind: "bathroom" as const,
      footprint: { kind: "rectangle" as const, widthMm: 3000, depthMm: 2400 },
      clearHeightMm: 2500,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      geometrySource: "manual" as const,
      confirmation: "confirmed" as const,
    };
    const repository: BuildingModelRepository = {
      createSpace: vi.fn().mockResolvedValue(created),
      createElement: vi.fn(),
      ensureDefaultLevel: vi.fn(),
      findSpacesByProject: vi.fn(),
      findElementsByProject: vi.fn(),
    };
    const { id: _id, ...draft } = created;

    await expect(new CreateBuildingSpaceUseCase(repository).execute(draft)).resolves.toEqual(
      created,
    );
  });
});
