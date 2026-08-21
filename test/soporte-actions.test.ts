import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks for Drizzle ORM
const {
  mockInsert,
  mockValues,
  mockInsertReturning,
  mockSelect,
  mockFrom,
  mockLeftJoin,
  mockWhere,
  mockOrderBy,
  mockUpdate,
  mockSet,
  mockUpdateWhere,
  mockUpdateReturning,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockImplementation(() => ({
    orderBy: mockOrderBy,
    then: (resolve: any) => Promise.resolve([]).then(resolve),
  }));
  const mockLeftJoin = vi.fn();
  const mockFrom = vi.fn();

  const queryBuilder: any = {
    leftJoin: mockLeftJoin,
    where: mockWhere,
    orderBy: mockOrderBy,
    then: (resolve: any) => Promise.resolve([]).then(resolve),
  };

  mockLeftJoin.mockReturnValue(queryBuilder);
  mockFrom.mockReturnValue(queryBuilder);
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  const mockUpdateReturning = vi.fn().mockResolvedValue([{ id: 1, estado: "RESUELTO" }]);
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  return {
    mockInsert,
    mockValues,
    mockInsertReturning,
    mockSelect,
    mockFrom,
    mockLeftJoin,
    mockWhere,
    mockOrderBy,
    mockUpdate,
    mockSet,
    mockUpdateWhere,
    mockUpdateReturning,
  };
});

vi.mock("@/db", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import {
  createSupportTicket,
  getSupportTickets,
  getSupportTicketStats,
  updateTicketStatus,
  updateTicketPriority,
  saveTicketInternalNotes,
} from "@/lib/soporte-actions";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { CreateTicketInput, TicketFilters } from "@/types/soporte";

describe("Support Center Server Actions (soporte-actions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock responses
    mockInsertReturning.mockResolvedValue([{ id: 101 }]);
    mockValues.mockReturnValue({ returning: mockInsertReturning });
    mockInsert.mockReturnValue({ values: mockValues });

    const queryBuilder: any = {
      leftJoin: mockLeftJoin,
      where: mockWhere,
      orderBy: mockOrderBy,
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    };
    mockLeftJoin.mockReturnValue(queryBuilder);
    mockFrom.mockReturnValue(queryBuilder);
    mockWhere.mockImplementation(() => ({
      orderBy: mockOrderBy,
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));
    mockOrderBy.mockResolvedValue([]);
    mockSelect.mockReturnValue({ from: mockFrom });

    mockUpdateReturning.mockResolvedValue([{ id: 101, estado: "RESUELTO" }]);
    mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });

    (auth as any).mockResolvedValue({
      user: {
        id: "usr-admin-1",
        name: "Admin Support",
        email: "superadmin@trackops.com",
        role: "SUPER_ADMIN",
        empresaId: null,
      },
    });
  });

  describe("createSupportTicket", () => {
    it("should validate required fields and fail when name is missing", async () => {
      (auth as any).mockResolvedValueOnce({ user: null });
      const input = {
        nombreContacto: "",
        emailContacto: "test@example.com",
        tipo: "PROBLEMA_TECNICO",
        asunto: "Falla de señal",
        mensaje: "El vehículo no reporta",
      } as CreateTicketInput;

      const result = await createSupportTicket(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("obligatorios");
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should validate required fields and fail when email is missing", async () => {
      (auth as any).mockResolvedValueOnce({ user: null });
      const input = {
        nombreContacto: "Juan Perez",
        emailContacto: "",
        tipo: "PROBLEMA_TECNICO",
        asunto: "Falla de señal",
        mensaje: "El vehículo no reporta",
      } as CreateTicketInput;

      const result = await createSupportTicket(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("obligatorios");
    });

    it("should validate required fields and fail when message is missing", async () => {
      (auth as any).mockResolvedValueOnce({ user: null });
      const input = {
        nombreContacto: "Juan Perez",
        emailContacto: "juan@example.com",
        tipo: "PROBLEMA_TECNICO",
        asunto: "Falla de señal",
        mensaje: "   ",
      } as CreateTicketInput;

      const result = await createSupportTicket(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("obligatorios");
    });

    it("should auto-fill authenticated user info when fields are not provided", async () => {
      (auth as any).mockResolvedValueOnce({
        user: {
          id: "usr-123",
          name: "Carlos Admin",
          email: "carlos@transportes.com",
          role: "ADMIN_EMPRESA",
          empresaId: 4,
        },
      });

      const input: CreateTicketInput = {
        nombreContacto: "",
        emailContacto: "",
        tipo: "DISPOSITIVO_GPS",
        asunto: "GPS desconectado",
        mensaje: "El móvil 104 no transmite",
      };

      const result = await createSupportTicket(input);

      expect(result.success).toBe(true);
      expect(result.ticketId).toBe(101);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "usr-123",
          empresaId: 4,
          nombreContacto: "Carlos Admin",
          emailContacto: "carlos@transportes.com",
          origen: "PANEL",
          prioridad: "MEDIA",
          estado: "PENDIENTE",
          asunto: "GPS desconectado",
          mensaje: "El móvil 104 no transmite",
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/panel/superadmin/soporte");
    });

    it("should create ticket successfully with explicit values and revalidate path", async () => {
      const input: CreateTicketInput = {
        origen: "WEB",
        nombreContacto: "Visitante Web",
        emailContacto: "visitante@gmail.com",
        telefonoContacto: "+541155554444",
        empresaNombreManual: "Empresa Externa SA",
        tipo: "FACTURACION",
        prioridad: "URGENTE",
        asunto: "Error en pago con tarjeta",
        mensaje: "El cobro se duplicó en la tarjeta.",
        preferenciaRespuesta: "WHATSAPP",
      };

      const result = await createSupportTicket(input);

      expect(result.success).toBe(true);
      expect(result.ticketId).toBe(101);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          origen: "WEB",
          nombreContacto: "Visitante Web",
          emailContacto: "visitante@gmail.com",
          telefonoContacto: "+541155554444",
          empresaNombreManual: "Empresa Externa SA",
          tipo: "FACTURACION",
          prioridad: "URGENTE",
          estado: "PENDIENTE",
          asunto: "Error en pago con tarjeta",
          mensaje: "El cobro se duplicó en la tarjeta.",
          preferenciaRespuesta: "WHATSAPP",
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/panel/superadmin/soporte");
    });

    it("should return error if DB insert fails", async () => {
      mockInsertReturning.mockRejectedValueOnce(new Error("Database write error"));

      const input: CreateTicketInput = {
        nombreContacto: "Laura",
        emailContacto: "laura@example.com",
        tipo: "CONSULTA_GENERAL",
        asunto: "Consulta horarios",
        mensaje: "Cuales son los horarios de atención?",
      };

      const result = await createSupportTicket(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database write error");
    });
  });

  describe("getSupportTickets", () => {
    it("should fetch tickets joining empresas and users ordered by createdAt DESC", async () => {
      const mockRows = [
        {
          id: 1,
          origen: "PANEL",
          empresaId: 2,
          empresaNombre: "Logística SA",
          userId: "u1",
          userName: "Usuario Uno",
          nombreContacto: "Contacto 1",
          emailContacto: "c1@test.com",
          telefonoContacto: null,
          empresaNombreManual: null,
          tipo: "PROBLEMA_TECNICO",
          prioridad: "ALTA",
          estado: "PENDIENTE",
          asunto: "Problema 1",
          mensaje: "Detalle 1",
          preferenciaRespuesta: "EMAIL",
          notasInternas: null,
          resueltoPor: null,
          resueltoAt: null,
          createdAt: new Date("2026-08-21T02:00:00Z"),
          updatedAt: new Date("2026-08-21T02:00:00Z"),
        },
      ];

      mockOrderBy.mockResolvedValueOnce(mockRows);

      const result = await getSupportTickets();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRows);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockLeftJoin).toHaveBeenCalledTimes(2);
      expect(mockOrderBy).toHaveBeenCalled();
    });

    it("should apply filters when provided", async () => {
      const filters: TicketFilters = {
        estado: "PENDIENTE",
        prioridad: "URGENTE",
        tipo: "DISPOSITIVO_GPS",
        origen: "PANEL",
        empresaId: 5,
        search: "GPS offline",
      };

      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getSupportTickets(filters);

      expect(result.success).toBe(true);
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should ignore ALL filters", async () => {
      const filters: TicketFilters = {
        estado: "ALL",
        prioridad: "ALL",
        tipo: "ALL",
        origen: "ALL",
      };

      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getSupportTickets(filters);

      expect(result.success).toBe(true);
      // When all filters are "ALL", mockWhere should not be called with conditions
      expect(mockWhere).not.toHaveBeenCalled();
    });
  });

  describe("getSupportTicketStats", () => {
    it("should calculate correct counts for each metric", async () => {
      const mockTickets = [
        { estado: "PENDIENTE", prioridad: "URGENTE" },
        { estado: "PENDIENTE", prioridad: "MEDIA" },
        { estado: "EN_REVISION", prioridad: "ALTA" },
        { estado: "RESUELTO", prioridad: "BAJA" },
        { estado: "RESUELTO", prioridad: "URGENTE" },
        { estado: "DESCARTADO", prioridad: "BAJA" },
      ];

      mockFrom.mockImplementationOnce(() => ({
        then: (resolve: any) => Promise.resolve(mockTickets).then(resolve),
      }));

      const stats = await getSupportTicketStats();

      expect(stats).toEqual({
        total: 6,
        pendientes: 2,
        enRevision: 1,
        resueltos: 2,
        urgentes: 2,
      });
    });
  });

  describe("updateTicketStatus", () => {
    it("should throw error if user is not SUPER_ADMIN", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { role: "ADMIN_EMPRESA", email: "admin@empresa.com" },
      });

      await expect(updateTicketStatus(1, "RESUELTO")).rejects.toThrow("Unauthorized");
    });

    it("should update status and set resolution data when resolved", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { role: "SUPER_ADMIN", email: "superadmin@trackops.com" },
      });

      mockUpdateReturning.mockResolvedValueOnce([
        {
          id: 10,
          estado: "RESUELTO",
          resueltoPor: "superadmin@trackops.com",
          notasInternas: "Problema resuelto vía reinicio de equipo",
        },
      ]);

      const res = await updateTicketStatus(
        10,
        "RESUELTO",
        "Problema resuelto vía reinicio de equipo"
      );

      expect(res.success).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: "RESUELTO",
          resueltoPor: "superadmin@trackops.com",
          notasInternas: "Problema resuelto vía reinicio de equipo",
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/panel/superadmin/soporte");
    });
  });

  describe("updateTicketPriority", () => {
    it("should throw error if user is not SUPER_ADMIN", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { role: "CHOFER", email: "chofer@empresa.com" },
      });

      await expect(updateTicketPriority(1, "URGENTE")).rejects.toThrow("Unauthorized");
    });

    it("should update priority and revalidate path", async () => {
      mockUpdateReturning.mockResolvedValueOnce([{ id: 5, prioridad: "URGENTE" }]);

      const res = await updateTicketPriority(5, "URGENTE");

      expect(res.success).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          prioridad: "URGENTE",
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/panel/superadmin/soporte");
    });
  });

  describe("saveTicketInternalNotes", () => {
    it("should throw error if user is not SUPER_ADMIN", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { role: "CHOFER", email: "chofer@empresa.com" },
      });

      await expect(saveTicketInternalNotes(1, "Notas")).rejects.toThrow("Unauthorized");
    });

    it("should update internal notes and revalidate path", async () => {
      mockUpdateReturning.mockResolvedValueOnce([{ id: 5, notasInternas: "Nueva nota técnica" }]);

      const res = await saveTicketInternalNotes(5, "Nueva nota técnica");

      expect(res.success).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          notasInternas: "Nueva nota técnica",
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/panel/superadmin/soporte");
    });
  });
});
