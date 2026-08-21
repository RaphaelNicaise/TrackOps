export const IMPERSONATE_COOKIE = "trackops_impersonate_tenant_id";

export interface EffectiveTenantContext {
  empresaId: number | null;
  empresaNombre: string | null;
  isImpersonating: boolean;
  superadminUser: any | null;
}
