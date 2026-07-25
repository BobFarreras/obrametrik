import type { Project } from "@obrametrik/domain";
export interface ProjectRepository {
  findByOrganization(organizationId: string): Promise<readonly Project[]>;
  create(project: Project): Promise<Project>;
}
