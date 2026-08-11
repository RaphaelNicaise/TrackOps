export type Role = "SUPER_ADMIN" | "ADMIN_EMPRESA" | "CHOFER" | "VENDEDOR_INSTALADOR";

export function hasRole(userRole: string | undefined | null, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as Role);
}
