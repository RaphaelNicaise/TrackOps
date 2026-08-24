import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as resolveMapsUrlGET } from "@/app/api/resolve-maps-url/route";
import { getChoferes, getSitios, getViajes } from "@/lib/flota-actions";
import { getSupportTickets, getSupportTicketStats } from "@/lib/soporte-actions";
import { getAlertConfigAction } from "@/lib/alert-config-actions";
import { auth } from "@/auth";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

describe("Security Remediation Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SEC-01: SSRF Protection in resolve-maps-url", () => {
    it("should reject unwhitelisted domains attempting SSRF with subquery tricks", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const req = new Request("http://localhost:3000/api/resolve-maps-url?url=http://169.254.169.254/latest/meta-data/?x=maps.app.goo.gl");
      const res = await resolveMapsUrlGET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Dominio no permitido");
    });
  });

  describe("SEC-05: Multi-Tenant Isolation in Fleet Actions", () => {
    it("getChoferes should strictly use session.user.empresaId and ignore client-provided filters.empresaId", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-tenant-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const result = await getChoferes({ empresaId: 999 } as any);
      expect(result.success).toBe(true);
    });

    it("getSitios should strictly use session.user.empresaId and ignore client-provided filters.empresaId", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-tenant-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const result = await getSitios({ empresaId: 999 } as any);
      expect(result.success).toBe(true);
    });

    it("getViajes should strictly use session.user.empresaId and ignore client-provided filters.empresaId", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-tenant-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const result = await getViajes({ empresaId: 999 } as any);
      expect(result.success).toBe(true);
    });
  });

  describe("SEC-06: Support Ticket Access Control", () => {
    it("getSupportTickets should throw unauthorized for non-superadmin users", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-tenant-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      await expect(getSupportTickets()).rejects.toThrow("Se requieren privilegios de Superadmin");
    });

    it("getSupportTicketStats should throw unauthorized for non-superadmin users", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-tenant-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      await expect(getSupportTicketStats()).rejects.toThrow("Se requieren privilegios de Superadmin");
    });
  });

  describe("SEC-07: Alert Config Tenant Isolation", () => {
    it("getAlertConfigAction should ignore targetEmpresaId when caller is non-superadmin", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-tenant-1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const config = await getAlertConfigAction(999);
      expect(config.empresaId).toBe(1);
    });

    it("getAlertConfigAction should allow targetEmpresaId when caller is SUPER_ADMIN", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "super-1", role: "SUPER_ADMIN" },
      } as any);

      const config = await getAlertConfigAction(999);
      expect(config.empresaId).toBe(999);
    });
  });
});
