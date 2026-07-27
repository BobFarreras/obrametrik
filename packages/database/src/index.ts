import type { Project } from "@obrametrik/domain";
export {
  createSupabaseBuildingModelRepository,
  mapBuildingSpaceRow,
  mapSpaceDraftToInsert,
  SupabaseBuildingModelRepository,
} from "./building-model-repository";
export type { Database, Json } from "./database.types";

export interface ProjectRepository {
  findByOrganization(organizationId: string): Promise<readonly Project[]>;
  create(project: Project): Promise<Project>;
}
