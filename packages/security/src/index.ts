export const permissions = [
  "project.read",
  "project.create",
  "project.update",
  "project.delete",
  "organization.manage_members",
] as const;
export type Permission = (typeof permissions)[number];
const rolePermissions = {
  owner: permissions,
  admin: permissions.filter((permission) => permission !== "project.delete"),
  member: ["project.read", "project.create", "project.update"],
} as const satisfies Record<string, readonly Permission[]>;
export function hasPermission(role: keyof typeof rolePermissions, permission: Permission): boolean {
  return rolePermissions[role].includes(permission as never);
}
