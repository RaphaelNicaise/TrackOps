import { ReactNode } from "react";
import { Role, hasRole } from "@/lib/use-permissions";

interface RequireRoleProps {
  userRole: string | undefined | null;
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ userRole, allowedRoles, children, fallback = null }: RequireRoleProps) {
  if (hasRole(userRole, allowedRoles)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
