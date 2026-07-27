import type {
  BuildingElement,
  BuildingElementDraft,
  BuildingSpace,
  BuildingSpaceDraft,
} from "@obrametrik/domain";

export interface BuildingSpaceWriter {
  createSpace(space: BuildingSpaceDraft): Promise<BuildingSpace>;
}

export interface DefaultBuildingLevelProvider {
  ensureDefaultLevel(projectId: string): Promise<{ id: string; projectId: string }>;
}

export interface BuildingSpaceReader {
  findSpacesByProject(projectId: string): Promise<readonly BuildingSpace[]>;
}

export interface BuildingElementWriter {
  createElement(element: BuildingElementDraft): Promise<BuildingElement>;
}

export interface BuildingElementReader {
  findElementsByProject(projectId: string): Promise<readonly BuildingElement[]>;
}

/**
 * Application port. Infrastructure adapters implement persistence and rely on
 * their own authorization mechanism; callers never depend on Supabase here.
 */
export interface BuildingModelRepository
  extends
    BuildingSpaceWriter,
    DefaultBuildingLevelProvider,
    BuildingSpaceReader,
    BuildingElementWriter,
    BuildingElementReader {}
