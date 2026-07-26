/**
 * @file packages/domain/src/index.ts
 * @description Defines framework-independent product concepts.
 */
export const locales = ["ca", "es", "en"] as const;
export type Locale = (typeof locales)[number];
export const projectStatuses = ["draft", "active", "completed", "archived"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
export type User = { id: string; preferredLocale: Locale };
export type Organization = { id: string; name: string; slug: string };
export type OrganizationRole = "owner" | "admin" | "member";
export type OrganizationMember = { organizationId: string; userId: string; role: OrganizationRole };
export type Project = {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
};
export type Room = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
};
export type SurfaceKind = "wall" | "floor" | "ceiling" | "other";
export type Surface = {
  id: string;
  roomId: string;
  name: string;
  kind: SurfaceKind;
  widthM: number;
  heightM: number;
  grossAreaM2: number;
};
export type MeasurementOperation = "add" | "subtract";
export type SurfaceMeasurement = {
  id: string;
  surfaceId: string;
  label: string;
  operation: MeasurementOperation;
  widthM: number;
  heightM: number;
  areaM2: number;
};
