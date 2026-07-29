import { describe, expect, it, vi } from "vitest";
import type { BuildingSpaceDraft } from "@obrametrik/domain";
import {
  SupabaseBuildingModelRepository,
  type BuildingSpacesGateway,
  type BuildingSpaceRow,
} from "./building-model-repository";

const polygonVertices = [
  { x: 0, y: 0 },
  { x: 3000, y: 0 },
  { x: 3000, y: 1800 },
  { x: 0, y: 1800 },
] as const;

const draft: BuildingSpaceDraft = {
  projectId: "project-1",
  levelId: "level-1",
  name: "Bany en L",
  kind: "bathroom",
  footprint: {
    kind: "polygon",
    vertices: polygonVertices,
  },
  clearHeightMm: 2500,
  transform: {
    position: { x: 100, y: 200, z: 0 },
    rotationDegrees: { x: 1.5, y: 0, z: 90 },
  },
  geometrySource: "manual",
  confirmation: "confirmed",
};

const row: BuildingSpaceRow = {
  id: "space-1",
  project_id: "project-1",
  level_id: "level-1",
  created_by: "user-1",
  name: "Bany en L",
  kind: "bathroom",
  footprint_kind: "polygon",
  rectangle_width_mm: null,
  rectangle_depth_mm: null,
  polygon_vertices: [...polygonVertices],
  clear_height_mm: 2500,
  origin_x_mm: 100,
  origin_y_mm: 200,
  origin_z_mm: 0,
  rotation_x_millidegrees: 1500,
  rotation_y_millidegrees: 0,
  rotation_z_millidegrees: 90000,
  geometry_source: "manual",
  confirmation: "confirmed",
  created_at: "2026-07-26T10:00:00.000Z",
  updated_at: "2026-07-26T10:00:00.000Z",
};

describe("SupabaseBuildingModelRepository", () => {
  it("delegates CAD replacement to one atomic gateway operation", async () => {
    const gateway: BuildingSpacesGateway = {
      getAuthenticatedUserId: vi.fn(),
      insertSpace: vi.fn(),
      findSpacesByProject: vi.fn(),
      findFirstLevel: vi.fn(),
      insertLevel: vi.fn(),
      insertElement: vi.fn(),
      findElementsByProject: vi.fn(),
      saveCadPlan: vi.fn().mockResolvedValue({
        spaceId: "space-1",
        updatedAt: "2026-07-27T06:00:00Z",
      }),
    };
    const plan = {
      projectId: "project-1",
      name: "Bany",
      kind: "bathroom" as const,
      vertices: polygonVertices,
      clearHeightMm: 2500,
      components: [],
    };

    await new SupabaseBuildingModelRepository(gateway).saveCadPlan(plan, "space-1");

    expect(gateway.saveCadPlan).toHaveBeenCalledWith(plan, "space-1");
  });

  it("maps the domain draft to an authenticated database insert", async () => {
    const gateway: BuildingSpacesGateway = {
      getAuthenticatedUserId: vi.fn().mockResolvedValue("user-1"),
      insertSpace: vi.fn().mockResolvedValue(row),
      findSpacesByProject: vi.fn(),
      findFirstLevel: vi.fn(),
      insertLevel: vi.fn(),
      insertElement: vi.fn(),
      findElementsByProject: vi.fn(),
      saveCadPlan: vi.fn(),
    };

    const result = await new SupabaseBuildingModelRepository(gateway).createSpace(draft);

    expect(gateway.insertSpace).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "project-1",
        created_by: "user-1",
        footprint_kind: "polygon",
        polygon_vertices: polygonVertices,
        rotation_x_millidegrees: 1500,
        rotation_z_millidegrees: 90000,
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: "space-1", footprint: draft.footprint }));
  });

  it("propagates persistence failures without returning a false success", async () => {
    const failure = new Error("RLS rejected insert");
    const gateway: BuildingSpacesGateway = {
      getAuthenticatedUserId: vi.fn().mockResolvedValue("user-1"),
      insertSpace: vi.fn().mockRejectedValue(failure),
      findSpacesByProject: vi.fn(),
      findFirstLevel: vi.fn(),
      insertLevel: vi.fn(),
      insertElement: vi.fn(),
      findElementsByProject: vi.fn(),
      saveCadPlan: vi.fn(),
    };

    await expect(new SupabaseBuildingModelRepository(gateway).createSpace(draft)).rejects.toBe(
      failure,
    );
  });
});
