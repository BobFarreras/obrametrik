import type {
  BuildingModelRepository,
  CadPlanSaver,
  CadPlanDraft,
  SavedCadPlan,
} from "@obrametrik/application";
import {
  assertValidSpaceDraft,
  type BuildingElement,
  type BuildingElementDraft,
  type BuildingSpace,
  type BuildingSpaceDraft,
  type Point2Mm,
  type SpaceFootprint,
} from "@obrametrik/domain";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types";

export type BuildingSpaceRow = Database["public"]["Tables"]["building_spaces"]["Row"];
export type BuildingSpaceInsert = Database["public"]["Tables"]["building_spaces"]["Insert"];
type BuildingLevelRow = Database["public"]["Tables"]["building_levels"]["Row"];
type BuildingLevelInsert = Database["public"]["Tables"]["building_levels"]["Insert"];
type BuildingElementRow = Database["public"]["Tables"]["building_elements"]["Row"];
type BuildingElementInsert = Database["public"]["Tables"]["building_elements"]["Insert"];

export interface BuildingSpacesGateway {
  getAuthenticatedUserId(): Promise<string>;
  insertSpace(space: BuildingSpaceInsert): Promise<BuildingSpaceRow>;
  findSpacesByProject(projectId: string): Promise<readonly BuildingSpaceRow[]>;
  findFirstLevel(projectId: string): Promise<BuildingLevelRow | null>;
  insertLevel(level: BuildingLevelInsert): Promise<BuildingLevelRow>;
  insertElement(element: BuildingElementInsert): Promise<BuildingElementRow>;
  findElementsByProject(projectId: string): Promise<readonly BuildingElementRow[]>;
  saveCadPlan(plan: CadPlanDraft, spaceId?: string): Promise<SavedCadPlan>;
}

function toPolygonJson(vertices: readonly Point2Mm[]): Json {
  return vertices.map((vertex) => ({ x: vertex.x, y: vertex.y }));
}

function parsePolygonVertices(value: Json | null): readonly Point2Mm[] {
  if (!Array.isArray(value)) throw new TypeError("Persisted polygon vertices are invalid");
  return value.map((vertex) => {
    if (
      vertex === null ||
      Array.isArray(vertex) ||
      typeof vertex !== "object" ||
      typeof vertex.x !== "number" ||
      typeof vertex.y !== "number"
    ) {
      throw new TypeError("Persisted polygon vertex is invalid");
    }
    return { x: vertex.x, y: vertex.y };
  });
}

export function mapSpaceDraftToInsert(
  space: BuildingSpaceDraft,
  createdBy: string,
): BuildingSpaceInsert {
  const footprint =
    space.footprint.kind === "rectangle"
      ? {
          footprint_kind: "rectangle" as const,
          rectangle_width_mm: space.footprint.widthMm,
          rectangle_depth_mm: space.footprint.depthMm,
          polygon_vertices: null,
        }
      : {
          footprint_kind: "polygon" as const,
          rectangle_width_mm: null,
          rectangle_depth_mm: null,
          polygon_vertices: toPolygonJson(space.footprint.vertices),
        };

  return {
    project_id: space.projectId,
    level_id: space.levelId,
    created_by: createdBy,
    name: space.name,
    kind: space.kind,
    ...footprint,
    clear_height_mm: space.clearHeightMm,
    origin_x_mm: space.transform.position.x,
    origin_y_mm: space.transform.position.y,
    origin_z_mm: space.transform.position.z,
    rotation_x_millidegrees: space.transform.rotationDegrees.x * 1000,
    rotation_y_millidegrees: space.transform.rotationDegrees.y * 1000,
    rotation_z_millidegrees: space.transform.rotationDegrees.z * 1000,
    geometry_source: space.geometrySource,
    confirmation: space.confirmation,
  };
}

export function mapBuildingSpaceRow(row: BuildingSpaceRow): BuildingSpace {
  let footprint: SpaceFootprint;
  if (row.footprint_kind === "rectangle") {
    if (row.rectangle_width_mm === null || row.rectangle_depth_mm === null) {
      throw new TypeError("Persisted rectangle dimensions are invalid");
    }
    footprint = {
      kind: "rectangle",
      widthMm: row.rectangle_width_mm,
      depthMm: row.rectangle_depth_mm,
    };
  } else {
    footprint = {
      kind: "polygon",
      vertices: parsePolygonVertices(row.polygon_vertices),
    };
  }

  const space: BuildingSpace = {
    id: row.id,
    projectId: row.project_id,
    levelId: row.level_id,
    name: row.name,
    kind: row.kind,
    footprint,
    clearHeightMm: row.clear_height_mm,
    transform: {
      position: {
        x: row.origin_x_mm,
        y: row.origin_y_mm,
        z: row.origin_z_mm,
      },
      rotationDegrees: {
        x: row.rotation_x_millidegrees / 1000,
        y: row.rotation_y_millidegrees / 1000,
        z: row.rotation_z_millidegrees / 1000,
      },
    },
    geometrySource: row.geometry_source,
    confirmation: row.confirmation,
  };
  assertValidSpaceDraft(space);
  return space;
}

function mapElementDraftToInsert(
  element: BuildingElementDraft,
  createdBy: string,
): BuildingElementInsert {
  return {
    project_id: element.projectId,
    space_id: element.spaceId,
    host_element_id: element.hostElementId,
    host_face: element.hostFace,
    created_by: createdBy,
    name: element.name,
    kind: element.kind,
    position_x_mm: element.transform.position.x,
    position_y_mm: element.transform.position.y,
    position_z_mm: element.transform.position.z,
    rotation_x_millidegrees: element.transform.rotationDegrees.x * 1000,
    rotation_y_millidegrees: element.transform.rotationDegrees.y * 1000,
    rotation_z_millidegrees: element.transform.rotationDegrees.z * 1000,
    width_mm: element.dimensionsMm.width,
    height_mm: element.dimensionsMm.height,
    depth_mm: element.dimensionsMm.depth,
    specification: element.specification as Json,
    lifecycle: element.lifecycle,
    confirmation: element.confirmation,
  };
}

function mapBuildingElementRow(row: BuildingElementRow): BuildingElement {
  return {
    id: row.id,
    projectId: row.project_id,
    spaceId: row.space_id,
    hostElementId: row.host_element_id,
    hostFace: row.host_face,
    kind: row.kind,
    name: row.name,
    transform: {
      position: { x: row.position_x_mm, y: row.position_y_mm, z: row.position_z_mm },
      rotationDegrees: {
        x: row.rotation_x_millidegrees / 1000,
        y: row.rotation_y_millidegrees / 1000,
        z: row.rotation_z_millidegrees / 1000,
      },
    },
    dimensionsMm: {
      width: row.width_mm,
      height: row.height_mm,
      depth: row.depth_mm,
    },
    specification:
      row.specification !== null &&
      !Array.isArray(row.specification) &&
      typeof row.specification === "object"
        ? row.specification
        : {},
    lifecycle: row.lifecycle,
    confirmation: row.confirmation,
  };
}

export class SupabaseBuildingModelRepository implements BuildingModelRepository, CadPlanSaver {
  constructor(private readonly gateway: BuildingSpacesGateway) {}

  async createSpace(space: BuildingSpaceDraft): Promise<BuildingSpace> {
    const userId = await this.gateway.getAuthenticatedUserId();
    const row = await this.gateway.insertSpace(mapSpaceDraftToInsert(space, userId));
    return mapBuildingSpaceRow(row);
  }

  async findSpacesByProject(projectId: string): Promise<readonly BuildingSpace[]> {
    const rows = await this.gateway.findSpacesByProject(projectId);
    return rows.map(mapBuildingSpaceRow);
  }

  async createElement(element: BuildingElementDraft): Promise<BuildingElement> {
    const userId = await this.gateway.getAuthenticatedUserId();
    return mapBuildingElementRow(
      await this.gateway.insertElement(mapElementDraftToInsert(element, userId)),
    );
  }

  async findElementsByProject(projectId: string): Promise<readonly BuildingElement[]> {
    return (await this.gateway.findElementsByProject(projectId)).map(mapBuildingElementRow);
  }

  async ensureDefaultLevel(projectId: string): Promise<{ id: string; projectId: string }> {
    const existing = await this.gateway.findFirstLevel(projectId);
    if (existing) return { id: existing.id, projectId: existing.project_id };

    const userId = await this.gateway.getAuthenticatedUserId();
    const created = await this.gateway.insertLevel({
      project_id: projectId,
      created_by: userId,
      name: "default",
      elevation_mm: 0,
      display_order: 0,
    });
    return { id: created.id, projectId: created.project_id };
  }

  async saveCadPlan(plan: CadPlanDraft, spaceId?: string): Promise<SavedCadPlan> {
    return this.gateway.saveCadPlan(plan, spaceId);
  }
}

class SupabaseBuildingSpacesGateway implements BuildingSpacesGateway {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAuthenticatedUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Authenticated user is required");
    return data.user.id;
  }

  async insertSpace(space: BuildingSpaceInsert): Promise<BuildingSpaceRow> {
    const { data, error } = await this.client
      .from("building_spaces")
      .insert(space)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async findSpacesByProject(projectId: string): Promise<readonly BuildingSpaceRow[]> {
    const { data, error } = await this.client
      .from("building_spaces")
      .select()
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async findFirstLevel(projectId: string): Promise<BuildingLevelRow | null> {
    const { data, error } = await this.client
      .from("building_levels")
      .select()
      .eq("project_id", projectId)
      .order("display_order")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async insertLevel(level: BuildingLevelInsert): Promise<BuildingLevelRow> {
    const { data, error } = await this.client
      .from("building_levels")
      .insert(level)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async insertElement(element: BuildingElementInsert): Promise<BuildingElementRow> {
    const { data, error } = await this.client
      .from("building_elements")
      .insert(element)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async findElementsByProject(projectId: string): Promise<readonly BuildingElementRow[]> {
    const { data, error } = await this.client
      .from("building_elements")
      .select()
      .eq("project_id", projectId)
      .order("created_at");
    if (error) throw error;
    return data;
  }

  async saveCadPlan(plan: CadPlanDraft, spaceId?: string): Promise<SavedCadPlan> {
    const { data, error } = await this.client.rpc("save_cad_plan", {
      p_plan: plan as unknown as Json,
      p_space_id: spaceId ?? null,
    });
    if (error) throw error;
    const saved = data[0];
    if (!saved) throw new Error("CAD plan persistence returned no result");
    return { spaceId: saved.space_id, updatedAt: saved.updated_at };
  }
}

export function createSupabaseBuildingModelRepository(
  client: SupabaseClient<Database>,
): BuildingModelRepository & CadPlanSaver {
  return new SupabaseBuildingModelRepository(new SupabaseBuildingSpacesGateway(client));
}
