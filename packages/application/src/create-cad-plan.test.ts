import type { BuildingElement, BuildingElementDraft, BuildingSpace } from "@obrametrik/domain";
import { describe, expect, it, vi } from "vitest";
import { CreateCadPlanUseCase } from "./use-cases/create-cad-plan";

describe("CreateCadPlanUseCase", () => {
  it("persists a wall per edge and attaches components to their selected wall", async () => {
    const space: BuildingSpace = {
      id: "space-1",
      projectId: "project-1",
      levelId: "level-1",
      name: "Bany",
      kind: "bathroom",
      footprint: {
        kind: "polygon",
        vertices: [
          { x: 0, y: 0 },
          { x: 3000, y: 0 },
          { x: 3000, y: 2000 },
          { x: 0, y: 2000 },
        ],
      },
      clearHeightMm: 2500,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      geometrySource: "manual",
      confirmation: "confirmed",
    };
    const createdElements: BuildingElementDraft[] = [];
    const repository = {
      ensureDefaultLevel: vi.fn().mockResolvedValue({ id: "level-1", projectId: "project-1" }),
      createSpace: vi.fn().mockResolvedValue(space),
      createElement: vi.fn(async (draft: BuildingElementDraft): Promise<BuildingElement> => {
        createdElements.push(draft);
        return { id: `element-${createdElements.length}`, ...draft };
      }),
    };

    await new CreateCadPlanUseCase(repository).execute({
      projectId: "project-1",
      name: "Bany",
      kind: "bathroom",
      vertices: space.footprint.kind === "polygon" ? space.footprint.vertices : [],
      clearHeightMm: 2500,
      components: [{ kind: "socket", point: { x: 1500, y: 0 }, wallIndex: 0 }],
    });

    expect(createdElements.filter((element) => element.kind === "wall")).toHaveLength(4);
    expect(createdElements[0]?.dimensionsMm.width).toBe(3000);
    expect(createdElements[4]).toEqual(
      expect.objectContaining({
        kind: "terminal",
        hostElementId: "element-1",
        dimensionsMm: { width: 100, height: 100, depth: 50 },
        specification: { source: "cad", terminalKind: "socket" },
      }),
    );
  });

  it("persists dimensions and system identity for water and drainage terminals", async () => {
    const createdElements: BuildingElementDraft[] = [];
    const repository = {
      ensureDefaultLevel: vi.fn().mockResolvedValue({ id: "level-1", projectId: "project-1" }),
      createSpace: vi.fn().mockImplementation(async (draft) => ({
        id: "space-1",
        levelId: "level-1",
        ...draft,
      })),
      createElement: vi.fn(async (draft: BuildingElementDraft): Promise<BuildingElement> => {
        createdElements.push(draft);
        return { id: `element-${createdElements.length}`, ...draft };
      }),
    };

    await new CreateCadPlanUseCase(repository).execute({
      projectId: "project-1",
      name: "Bany",
      kind: "bathroom",
      vertices: [
        { x: 0, y: 0 },
        { x: 3000, y: 0 },
        { x: 3000, y: 2000 },
        { x: 0, y: 2000 },
      ],
      clearHeightMm: 2500,
      components: [
        {
          kind: "hot_water",
          point: { x: 1000, y: 0 },
          wallIndex: 0,
          widthMm: 80,
          heightMm: 80,
          elevationMm: 600,
        },
        {
          kind: "drain",
          point: { x: 1500, y: 0 },
          wallIndex: 0,
          widthMm: 110,
          heightMm: 110,
          elevationMm: 150,
        },
      ],
    });

    expect(createdElements[4]?.specification).toEqual({
      source: "cad",
      terminalKind: "hot_water",
    });
    expect(createdElements[4]?.transform.position.z).toBe(600);
    expect(createdElements[5]?.specification).toEqual({
      source: "cad",
      terminalKind: "drain",
    });
  });

  it("rejects a component that references a wall outside the polygon", async () => {
    const repository = {
      ensureDefaultLevel: vi.fn().mockResolvedValue({ id: "level-1", projectId: "project-1" }),
      createSpace: vi
        .fn()
        .mockImplementation(async (draft) => ({ id: "space-1", levelId: "level-1", ...draft })),
      createElement: vi
        .fn()
        .mockImplementation(async (draft) => ({ id: crypto.randomUUID(), ...draft })),
    };

    await expect(
      new CreateCadPlanUseCase(repository).execute({
        projectId: "project-1",
        name: "Bany",
        kind: "bathroom",
        vertices: [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 1000 },
        ],
        clearHeightMm: 2500,
        components: [{ kind: "door", point: { x: 0, y: 0 }, wallIndex: 8 }],
      }),
    ).rejects.toThrow("unknown wall");
  });

  it("rejects an opening that does not fit completely inside its wall", async () => {
    const repository = {
      ensureDefaultLevel: vi.fn(),
      createSpace: vi.fn(),
      createElement: vi.fn(),
    };

    await expect(
      new CreateCadPlanUseCase(repository).execute({
        projectId: "project-1",
        name: "Bany",
        kind: "bathroom",
        vertices: [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 1000 },
        ],
        clearHeightMm: 2500,
        components: [
          {
            kind: "door",
            point: { x: 100, y: 0 },
            wallIndex: 0,
            widthMm: 900,
          },
        ],
      }),
    ).rejects.toThrow("fit inside");
    expect(repository.createSpace).not.toHaveBeenCalled();
  });

  it("rejects overlapping openings before persisting the space", async () => {
    const repository = {
      ensureDefaultLevel: vi.fn(),
      createSpace: vi.fn(),
      createElement: vi.fn(),
    };
    const base = {
      projectId: "project-1",
      name: "Bany",
      kind: "bathroom" as const,
      vertices: [
        { x: 0, y: 0 },
        { x: 3000, y: 0 },
        { x: 3000, y: 2000 },
      ],
      clearHeightMm: 2500,
    };

    await expect(
      new CreateCadPlanUseCase(repository).execute({
        ...base,
        components: [
          { kind: "door", point: { x: 1200, y: 0 }, wallIndex: 0, widthMm: 900 },
          { kind: "window", point: { x: 1600, y: 0 }, wallIndex: 0, widthMm: 1000 },
        ],
      }),
    ).rejects.toThrow("overlap");
    expect(repository.createSpace).not.toHaveBeenCalled();
  });
});
