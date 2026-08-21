import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAlertConfigAction,
  saveAlertConfigAction,
  sendTestAlertAction,
} from "@/lib/alert-config-actions";
import type { AlertConfigFormValues } from "@/types/alerts";
import { GET as getAlertConfigRoute, POST as postAlertConfigRoute, PUT as putAlertConfigRoute } from "@/app/api/alerts/config/route";
import { auth } from "@/auth";
import { db } from "@/db";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { resetMockAlertLogs, resetMockAlertConfigs } from "@/lib/alerts/dispatcher";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/db", () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
});

describe("Alert Configuration Server Actions & API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAlertLogs();
    resetMockAlertConfigs();
  });

  describe("getAlertConfigAction", () => {
    it("should return default config when company has no existing configuration", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const config = await getAlertConfigAction();

      expect(config).toBeDefined();
      expect(config.empresaId).toBe(1);
      expect(config.canalEmail).toBe(1);
      expect(config.canalWhatsapp).toBe(0);
      expect(config.toleranciaKm).toBe(500);
      expect(config.toleranciaDias).toBe(15);
      expect(config.activo).toBe(1);
      expect(Array.isArray(config.modulosHabilitados)).toBe(true);
      expect(config.modulosHabilitados).toContain("MANTENIMIENTO");
      expect(config.modulosHabilitados).toContain("DOCUMENTACION");
    });

    it("should return persisted company alert config when existing in DB", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 2 },
      } as any);

      const dbRow = {
        id: 10,
        empresaId: 2,
        canalEmail: 1,
        canalWhatsapp: 1,
        emailDestino: "supervisora@transporte.com",
        telefonoWhatsapp: "+5491133334444",
        toleranciaKm: 1000,
        toleranciaDias: 30,
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "GEOCERCAS"]),
        activo: 1,
        createdAt: new Date("2026-08-01"),
      };

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([dbRow]),
          }),
        }),
      });

      const config = await getAlertConfigAction();

      expect(config.id).toBe(10);
      expect(config.empresaId).toBe(2);
      expect(config.canalWhatsapp).toBe(1);
      expect(config.emailDestino).toBe("supervisora@transporte.com");
      expect(config.telefonoWhatsapp).toBe("+5491133334444");
      expect(config.toleranciaKm).toBe(1000);
      expect(config.toleranciaDias).toBe(30);
      expect(config.modulosHabilitados).toEqual(["MANTENIMIENTO", "GEOCERCAS"]);
    });

    it("should allow SUPER_ADMIN to query targetEmpresaId config", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "admin-master", email: "master@prada.com", role: "SUPER_ADMIN", empresaId: null },
      } as any);

      const dbRow = {
        id: 99,
        empresaId: 5,
        canalEmail: 1,
        canalWhatsapp: 0,
        emailDestino: "cliente5@prada.com",
        telefonoWhatsapp: null,
        toleranciaKm: 800,
        toleranciaDias: 20,
        modulosHabilitados: '["HORARIOS"]',
        activo: 1,
        createdAt: new Date(),
      };

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([dbRow]),
          }),
        }),
      });

      const config = await getAlertConfigAction(5);

      expect(config.empresaId).toBe(5);
      expect(config.emailDestino).toBe("cliente5@prada.com");
      expect(config.modulosHabilitados).toEqual(["HORARIOS"]);
    });
  });

  describe("saveAlertConfigAction", () => {
    it("should insert a new config row when none exists and log audit CREATE", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      const createdRow = {
        id: 101,
        empresaId: 1,
        canalEmail: 1,
        canalWhatsapp: 1,
        emailDestino: "notificaciones@empresa.com",
        telefonoWhatsapp: "+5491122223333",
        toleranciaKm: 600,
        toleranciaDias: 10,
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "DOCUMENTACION", "HORARIOS"]),
        activo: 1,
        createdAt: new Date(),
      };

      (db.insert as any).mockReturnValueOnce({
        values: () => ({
          returning: vi.fn().mockResolvedValueOnce([createdRow]),
        }),
      });

      const input: AlertConfigFormValues = {
        canalEmail: true,
        canalWhatsapp: true,
        emailDestino: "notificaciones@empresa.com",
        telefonoWhatsapp: "+5491122223333",
        toleranciaKm: 600,
        toleranciaDias: 10,
        modulosHabilitados: ["MANTENIMIENTO", "DOCUMENTACION", "HORARIOS"],
        activo: true,
      };

      const result = await saveAlertConfigAction(input);

      expect(result.success).toBe(true);
      expect(result.config.emailDestino).toBe("notificaciones@empresa.com");
      expect(result.config.telefonoWhatsapp).toBe("+5491122223333");
      expect(result.config.modulosHabilitados).toEqual(["MANTENIMIENTO", "DOCUMENTACION", "HORARIOS"]);
      expect(logAudit).toHaveBeenCalledWith("CREATE", "alertConfig", 101, expect.any(Object));
      expect(revalidatePath).toHaveBeenCalledWith("/panel/administracion/configuracion");
      expect(revalidatePath).toHaveBeenCalledWith("/panel/monitoreo/alertas");
    });

    it("should update existing config row and log audit UPDATE", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const existing = [{ id: 50, empresaId: 1 }];
      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce(existing),
        }),
      });

      const updatedRow = {
        id: 50,
        empresaId: 1,
        canalEmail: 1,
        canalWhatsapp: 0,
        emailDestino: "nuevo-email@empresa.com",
        telefonoWhatsapp: null,
        toleranciaKm: 300,
        toleranciaDias: 7,
        modulosHabilitados: JSON.stringify(["GEOCERCAS"]),
        activo: 1,
        createdAt: new Date(),
      };

      (db.update as any).mockReturnValueOnce({
        set: () => ({
          where: () => ({
            returning: vi.fn().mockResolvedValueOnce([updatedRow]),
          }),
        }),
      });

      const input: AlertConfigFormValues = {
        canalEmail: 1,
        canalWhatsapp: 0,
        emailDestino: "nuevo-email@empresa.com",
        telefonoWhatsapp: "",
        toleranciaKm: 300,
        toleranciaDias: 7,
        modulosHabilitados: ["GEOCERCAS"],
        activo: 1,
      };

      const result = await saveAlertConfigAction(input);

      expect(result.success).toBe(true);
      expect(result.config.emailDestino).toBe("nuevo-email@empresa.com");
      expect(result.config.telefonoWhatsapp).toBeNull();
      expect(result.config.modulosHabilitados).toEqual(["GEOCERCAS"]);
      expect(logAudit).toHaveBeenCalledWith("UPDATE", "alertConfig", 50, expect.any(Object));
      expect(revalidatePath).toHaveBeenCalledWith("/panel/administracion/configuracion");
      expect(revalidatePath).toHaveBeenCalledWith("/panel/monitoreo/alertas");
    });

    it("should support FormData input directly", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ id: 70, empresaId: 1 }]),
        }),
      });

      (db.update as any).mockReturnValueOnce({
        set: () => ({
          where: () => ({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 70,
                empresaId: 1,
                canalEmail: 1,
                canalWhatsapp: 1,
                emailDestino: "form@empresa.com",
                telefonoWhatsapp: "+5491177778888",
                toleranciaKm: 450,
                toleranciaDias: 12,
                modulosHabilitados: JSON.stringify(["DOCUMENTACION", "HORARIOS"]),
                activo: 1,
              },
            ]),
          }),
        }),
      });

      const formData = new FormData();
      formData.append("canalEmail", "on");
      formData.append("canalWhatsapp", "on");
      formData.append("emailDestino", "form@empresa.com");
      formData.append("telefonoWhatsapp", "+5491177778888");
      formData.append("toleranciaKm", "450");
      formData.append("toleranciaDias", "12");
      formData.append("modulosHabilitados", JSON.stringify(["DOCUMENTACION", "HORARIOS"]));
      formData.append("activo", "on");

      const result = await saveAlertConfigAction(formData);

      expect(result.success).toBe(true);
      expect(result.config.emailDestino).toBe("form@empresa.com");
      expect(result.config.modulosHabilitados).toEqual(["DOCUMENTACION", "HORARIOS"]);
    });
  });

  describe("sendTestAlertAction", () => {
    it("should dispatch test alert with default message and metadata", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      // Save a mock config first so dispatcher knows active channels
      (db.select as any).mockReturnValue({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([
              {
                id: 1,
                empresaId: 1,
                canalEmail: 1,
                canalWhatsapp: 1,
                emailDestino: "test@flota.com",
                telefonoWhatsapp: "+5491100001111",
                activo: 1,
                modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS", "SISTEMA"]),
              },
            ]),
          }),
        }),
      });

      const result = await sendTestAlertAction({
        testChannel: "AMBOS",
      });

      expect(result.success).toBe(true);
      expect(result.dispatchResult).toBeDefined();
      expect(result.dispatchResult.success).toBe(true);
      expect(result.dispatchResult.dispatchedChannels).toEqual(["EMAIL", "WHATSAPP"]);
      expect(result.dispatchResult.destinatarioEmail).toBe("test@flota.com");
      expect(result.dispatchResult.destinatarioWhatsapp).toBe("+5491100001111");
    });

    it("should respect overrideEmail and overrideWhatsapp in sendTestAlertAction", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      (db.select as any).mockReturnValue({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([
              {
                id: 1,
                empresaId: 1,
                canalEmail: 1,
                canalWhatsapp: 1,
                emailDestino: "default@flota.com",
                telefonoWhatsapp: "+5491100000000",
                activo: 1,
                modulosHabilitados: JSON.stringify(["SISTEMA"]),
              },
            ]),
          }),
        }),
      });

      const result = await sendTestAlertAction({
        overrideEmail: "custom-test@flota.com",
        overrideWhatsapp: "+5491199998888",
        titulo: "Alerta de Simulación Personalizada",
      });

      expect(result.success).toBe(true);
      expect(result.dispatchResult.destinatarioEmail).toBe("custom-test@flota.com");
      expect(result.dispatchResult.destinatarioWhatsapp).toBe("+5491199998888");
    });
  });

  describe("API Route: /api/alerts/config", () => {
    it("should return config on GET for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([
              {
                id: 1,
                empresaId: 1,
                canalEmail: 1,
                canalWhatsapp: 0,
                emailDestino: "api@flota.com",
                telefonoWhatsapp: null,
                toleranciaKm: 500,
                toleranciaDias: 15,
                modulosHabilitados: JSON.stringify(["MANTENIMIENTO"]),
                activo: 1,
              },
            ]),
          }),
        }),
      });

      const req = new Request("http://localhost/api/alerts/config");
      const res = await getAlertConfigRoute(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.emailDestino).toBe("api@flota.com");
      expect(data.modulosHabilitados).toEqual(["MANTENIMIENTO"]);
    });

    it("should return 401 on GET when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const req = new Request("http://localhost/api/alerts/config");
      const res = await getAlertConfigRoute(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should save and return config on POST / PUT", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ id: 1, empresaId: 1 }]),
        }),
      });

      (db.update as any).mockReturnValueOnce({
        set: () => ({
          where: () => ({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 1,
                empresaId: 1,
                canalEmail: 1,
                canalWhatsapp: 1,
                emailDestino: "updated-via-api@flota.com",
                telefonoWhatsapp: "+5491144445555",
                toleranciaKm: 750,
                toleranciaDias: 20,
                modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS"]),
                activo: 1,
              },
            ]),
          }),
        }),
      });

      const payload: AlertConfigFormValues = {
        canalEmail: true,
        canalWhatsapp: true,
        emailDestino: "updated-via-api@flota.com",
        telefonoWhatsapp: "+5491144445555",
        toleranciaKm: 750,
        toleranciaDias: 20,
        modulosHabilitados: ["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS"],
        activo: true,
      };

      const req = new Request("http://localhost/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await postAlertConfigRoute(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.config.emailDestino).toBe("updated-via-api@flota.com");
      expect(data.config.modulosHabilitados).toEqual(["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS"]);
    });
  });
});
