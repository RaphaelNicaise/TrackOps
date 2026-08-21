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
  mockDelete,
  mockDeleteWhere,
  mockDeleteReturning,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
  const mockValues = vi.fn().mockImplementation(() => ({
    returning: mockInsertReturning,
    then: (resolve: any) => Promise.resolve([{ id: 1 }]).then(resolve),
  }));
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

  const mockUpdateReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
  const mockUpdateWhere = vi.fn().mockImplementation(() => ({
    returning: mockUpdateReturning,
    then: (resolve: any) => Promise.resolve([{ id: 1 }]).then(resolve),
  }));
  const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  const mockDeleteReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
  const mockDeleteWhere = vi.fn().mockImplementation(() => ({
    returning: mockDeleteReturning,
    then: (resolve: any) => Promise.resolve([{ id: 1 }]).then(resolve),
  }));
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

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
    mockDelete,
    mockDeleteWhere,
    mockDeleteReturning,
  };
});

vi.mock("@/db", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_123"),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue("hashed_password_123"),
  compare: vi.fn().mockResolvedValue(true),
}));

import {
  getChoferes,
  createChofer,
  updateChofer,
  deleteChofer,
  getSitios,
  createSitio,
  updateSitio,
  deleteSitio,
  getViajes,
  createViaje,
  iniciarViajeChofer,
  finalizarViajeChofer,
  cancelarViaje,
} from "@/lib/flota-actions";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type {
  CreateChoferInput,
  UpdateChoferInput,
  CreateSitioInput,
  UpdateSitioInput,
  CreateViajeInput,
} from "@/types/flota-viajes";

describe("Flota Server Actions (flota-actions.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock auth session
    (auth as any).mockResolvedValue({
      user: {
        id: "usr-admin-1",
        name: "Admin Logistica",
        email: "admin@transportes.com",
        role: "ADMIN_EMPRESA",
        empresaId: 10,
      },
    });

    // Default Drizzle builders reset
    mockInsertReturning.mockReset();
    mockInsertReturning.mockResolvedValue([{ id: 1 }]);
    mockValues.mockImplementation(() => ({
      returning: mockInsertReturning,
      then: (resolve: any) => Promise.resolve([{ id: 1 }]).then(resolve),
    }));
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
      leftJoin: mockLeftJoin,
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));
    mockOrderBy.mockReset();
    mockOrderBy.mockResolvedValue([]);
    mockSelect.mockReturnValue({ from: mockFrom });

    mockUpdateReturning.mockReset();
    mockUpdateReturning.mockResolvedValue([{ id: 1 }]);
    mockUpdateWhere.mockImplementation(() => ({
      returning: mockUpdateReturning,
      then: (resolve: any) => Promise.resolve([{ id: 1 }]).then(resolve),
    }));
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });

    mockDeleteReturning.mockReset();
    mockDeleteReturning.mockResolvedValue([{ id: 1 }]);
    mockDeleteWhere.mockImplementation(() => ({
      returning: mockDeleteReturning,
      then: (resolve: any) => Promise.resolve([{ id: 1 }]).then(resolve),
    }));
    mockDelete.mockReturnValue({ where: mockDeleteWhere });
  });

  // ═══════════════════════════════════════════════════════════
  // 1. CHOFERES ACTIONS
  // ═══════════════════════════════════════════════════════════
  describe("Choferes Actions", () => {
    describe("getChoferes", () => {
      it("should return unauthorized if no session", async () => {
        (auth as any).mockResolvedValueOnce({ user: null });
        const res = await getChoferes();
        expect(res.success).toBe(false);
        expect(res.error).toBe("No autorizado");
      });

      it("should fetch choferes joining vehicles and filter by empresaId", async () => {
        const mockData = [
          {
            id: 1,
            empresaId: 10,
            nombre: "Juan",
            apellido: "Pérez",
            dni: "30111222",
            estado: "ACTIVO",
            vehiculoHabitualPatente: "AA123BB",
            vehiculoHabitualModelo: "Scania R450",
          },
        ];
        mockOrderBy.mockResolvedValueOnce(mockData);

        const res = await getChoferes({ estado: "ACTIVO", search: "Pérez" });

        expect(res.success).toBe(true);
        expect(res.data).toEqual(mockData);
        expect(mockSelect).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
        expect(mockLeftJoin).toHaveBeenCalled();
      });
    });

    describe("createChofer", () => {
      it("should return unauthorized if no session", async () => {
        (auth as any).mockResolvedValueOnce({ user: null });
        const res = await createChofer({
          nombre: "Juan",
          apellido: "Pérez",
          dni: "30111222",
        });
        expect(res.success).toBe(false);
        expect(res.error).toBe("No autorizado");
      });

      it("should fail validation when required fields are missing", async () => {
        const res = await createChofer({
          nombre: "",
          apellido: "Pérez",
          dni: "",
        });
        expect(res.success).toBe(false);
        expect(res.error).toContain("obligatorios");
      });

      it("should fail if DNI already exists in the company", async () => {
        mockWhere.mockImplementationOnce(() => ({
          then: (resolve: any) => Promise.resolve([{ id: 99, dni: "30111222" }]).then(resolve),
        }));

        const res = await createChofer({
          nombre: "Juan",
          apellido: "Pérez",
          dni: "30111222",
        });

        expect(res.success).toBe(false);
        expect(res.error).toContain("DNI");
      });

      it("should create chofer successfully without creating login user", async () => {
        // Uniqueness check returns empty
        mockWhere.mockImplementationOnce(() => ({
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }));

        const createdChofer = {
          id: 5,
          empresaId: 10,
          nombre: "Juan",
          apellido: "Pérez",
          dni: "30111222",
          estado: "ACTIVO",
        };
        mockInsertReturning.mockResolvedValueOnce([createdChofer]);

        const input: CreateChoferInput = {
          nombre: "Juan",
          apellido: "Pérez",
          dni: "30111222",
          telefono: "+5491100001111",
          email: "juan@empresa.com",
          licenciaNumero: "B1-30111222",
          licenciaCategoria: "B1",
          licenciaVencimiento: new Date("2028-05-10"),
        };

        const res = await createChofer(input);

        expect(res.success).toBe(true);
        expect(res.data).toEqual(createdChofer);
        expect(mockInsert).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/choferes");
      });

      it("should create user account with bcrypt hash when createLoginUser is true", async () => {
        // DNI check returns empty
        mockWhere.mockImplementationOnce(() => ({
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }));
        // User check returns empty
        mockWhere.mockImplementationOnce(() => ({
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }));

        // 1st insert for users, 2nd insert for choferes
        mockInsertReturning
          .mockResolvedValueOnce([{ id: "user-new-chofer" }])
          .mockResolvedValueOnce([
            {
              id: 6,
              empresaId: 10,
              userId: "user-new-chofer",
              nombre: "Carlos",
              apellido: "Gómez",
              dni: "28333444",
            },
          ]);

        const input: CreateChoferInput = {
          nombre: "Carlos",
          apellido: "Gómez",
          dni: "28333444",
          email: "carlos.gomez@empresa.com",
        };

        const res = await createChofer(input, true, "secret123");

        expect(res.success).toBe(true);
        expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
        expect(mockInsert).toHaveBeenCalledTimes(2);
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/choferes");
      });
    });

    describe("updateChofer", () => {
      it("should return unauthorized if no session", async () => {
        (auth as any).mockResolvedValueOnce({ user: null });
        const res = await updateChofer(1, { id: 1, nombre: "Juan Modificado" });
        expect(res.success).toBe(false);
        expect(res.error).toBe("No autorizado");
      });

      it("should update chofer and revalidate paths", async () => {
        const updatedChofer = {
          id: 1,
          nombre: "Juan Modificado",
          apellido: "Pérez",
          dni: "30111222",
        };
        mockUpdateReturning.mockResolvedValueOnce([updatedChofer]);

        const input: UpdateChoferInput = {
          id: 1,
          nombre: "Juan Modificado",
          telefono: "+5491122223333",
        };

        const res = await updateChofer(1, input);

        expect(res.success).toBe(true);
        expect(res.data).toEqual(updatedChofer);
        expect(mockUpdate).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/choferes");
      });
    });

    describe("deleteChofer", () => {
      it("should delete chofer and revalidate paths", async () => {
        const res = await deleteChofer(1);

        expect(res.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/choferes");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. SITIOS ACTIONS
  // ═══════════════════════════════════════════════════════════
  describe("Sitios Actions", () => {
    describe("getSitios", () => {
      it("should return unauthorized if not logged in", async () => {
        (auth as any).mockResolvedValueOnce({ user: null });
        const res = await getSitios();
        expect(res.success).toBe(false);
        expect(res.error).toBe("No autorizado");
      });

      it("should fetch sitios filtered by empresaId, tipo, search, and activo", async () => {
        const mockSitios = [
          {
            id: 1,
            empresaId: 10,
            nombre: "Planta Zárate",
            tipo: "PLANTA",
            direccion: "Ruta 9 Km 85",
            lat: -34.09,
            lng: -59.02,
            activo: 1,
          },
        ];
        mockOrderBy.mockResolvedValueOnce(mockSitios);

        const res = await getSitios({ tipo: "PLANTA", search: "Zárate", activo: 1 });

        expect(res.success).toBe(true);
        expect(res.data).toEqual(mockSitios);
        expect(mockSelect).toHaveBeenCalled();
      });
    });

    describe("createSitio", () => {
      it("should validate required fields: nombre, direccion, lat, lng", async () => {
        const res = await createSitio({
          nombre: "",
          direccion: "",
          lat: 0,
          lng: 0,
        });
        expect(res.success).toBe(false);
        expect(res.error).toContain("obligatorios");
      });

      it("should create sitio and revalidate path", async () => {
        const createdSitio = {
          id: 1,
          empresaId: 10,
          nombre: "Depósito Central",
          tipo: "DEPOSITO",
          direccion: "Av. Corrientes 1000",
          lat: -34.6037,
          lng: -58.3816,
          radioMetros: 120,
          activo: 1,
        };
        mockInsertReturning.mockResolvedValueOnce([createdSitio]);

        const input: CreateSitioInput = {
          nombre: "Depósito Central",
          tipo: "DEPOSITO",
          direccion: "Av. Corrientes 1000",
          lat: -34.6037,
          lng: -58.3816,
          radioMetros: 120,
        };

        const res = await createSitio(input);

        expect(res.success).toBe(true);
        expect(res.data).toEqual(createdSitio);
        expect(mockInsert).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/sitios");
      });
    });

    describe("updateSitio", () => {
      it("should update sitio and revalidate path", async () => {
        const updatedSitio = {
          id: 1,
          nombre: "Depósito Central Modificado",
          lat: -34.6037,
          lng: -58.3816,
        };
        mockUpdateReturning.mockResolvedValueOnce([updatedSitio]);

        const input: UpdateSitioInput = {
          id: 1,
          nombre: "Depósito Central Modificado",
        };

        const res = await updateSitio(1, input);

        expect(res.success).toBe(true);
        expect(res.data).toEqual(updatedSitio);
        expect(mockUpdate).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/sitios");
      });
    });

    describe("deleteSitio", () => {
      it("should delete sitio and revalidate path", async () => {
        const res = await deleteSitio(1);

        expect(res.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/sitios");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. VIAJES ACTIONS
  // ═══════════════════════════════════════════════════════════
  describe("Viajes Actions", () => {
    describe("getViajes", () => {
      it("should return unauthorized if not logged in", async () => {
        (auth as any).mockResolvedValueOnce({ user: null });
        const res = await getViajes();
        expect(res.success).toBe(false);
        expect(res.error).toBe("No autorizado");
      });

      it("should fetch viajes with joins to choferes and vehicles", async () => {
        const mockViajes = [
          {
            id: 1,
            empresaId: 10,
            codigo: "VIA-1001",
            choferNombre: "Juan Pérez",
            vehiculoPatente: "AA123BB",
            estado: "PLANIFICADO",
          },
        ];
        mockOrderBy.mockResolvedValueOnce(mockViajes);

        const res = await getViajes({ estado: "PLANIFICADO" });

        expect(res.success).toBe(true);
        expect(res.data).toEqual(mockViajes);
        expect(mockSelect).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
      });
    });

    describe("createViaje", () => {
      it("should validate required origin, destination and scheduled date", async () => {
        const res = await createViaje({
          origenNombre: "",
          origenDireccion: "",
          origenLat: 0,
          origenLng: 0,
          destinoNombre: "",
          destinoDireccion: "",
          destinoLat: 0,
          destinoLng: 0,
          fechaSalidaProgramada: "",
        });

        expect(res.success).toBe(false);
        expect(res.error).toContain("obligatorios");
      });

      it("should generate auto-code VIA-XXXXX if not provided and insert viaje", async () => {
        const createdViaje = {
          id: 1,
          empresaId: 10,
          codigo: "VIA-98765",
          origenNombre: "Centro",
          origenDireccion: "Calle 1",
          origenLat: -34.6,
          origenLng: -58.4,
          destinoNombre: "Planta",
          destinoDireccion: "Calle 2",
          destinoLat: -34.1,
          destinoLng: -59.0,
          estado: "PLANIFICADO",
        };
        mockInsertReturning.mockResolvedValueOnce([createdViaje]);

        const input: CreateViajeInput = {
          origenNombre: "Centro",
          origenDireccion: "Calle 1",
          origenLat: -34.6,
          origenLng: -58.4,
          destinoNombre: "Planta",
          destinoDireccion: "Calle 2",
          destinoLat: -34.1,
          destinoLng: -59.0,
          fechaSalidaProgramada: new Date("2026-08-25T10:00:00Z"),
        };

        const res = await createViaje(input);

        expect(res.success).toBe(true);
        expect(res.data).toEqual(createdViaje);
        expect(mockInsert).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/viajes");
        expect(revalidatePath).toHaveBeenCalledWith("/panel/chofer");
      });
    });

    describe("iniciarViajeChofer", () => {
      it("should update viaje status to EN_CURSO, set kmInicio and update vehicle odometer", async () => {
        const viajeData = {
          id: 1,
          vehiculoId: 5,
          estado: "EN_CURSO",
          kmInicio: 125000,
        };
        // Update for viajes returning
        mockUpdateReturning.mockResolvedValueOnce([viajeData]);

        const res = await iniciarViajeChofer(1, 125000);

        expect(res.success).toBe(true);
        expect(res.data).toEqual(viajeData);
        expect(mockUpdate).toHaveBeenCalledTimes(2);
        expect(revalidatePath).toHaveBeenCalledWith("/panel/chofer");
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/viajes");
      });
    });

    describe("finalizarViajeChofer", () => {
      it("should update viaje status to COMPLETADO, set kmFin and update vehicle odometer", async () => {
        const viajeData = {
          id: 1,
          vehiculoId: 5,
          estado: "COMPLETADO",
          kmFin: 125350,
          notas: "Llegada sin novedades",
        };
        // Update for viajes returning
        mockUpdateReturning.mockResolvedValueOnce([viajeData]);

        const res = await finalizarViajeChofer(1, 125350, "Llegada sin novedades");

        expect(res.success).toBe(true);
        expect(res.data).toEqual(viajeData);
        expect(mockUpdate).toHaveBeenCalledTimes(2);
        expect(revalidatePath).toHaveBeenCalledWith("/panel/chofer");
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/viajes");
      });
    });

    describe("cancelarViaje", () => {
      it("should cancel viaje and revalidate paths", async () => {
        const viajeData = {
          id: 1,
          estado: "CANCELADO",
          notas: "Cancelado por mal tiempo",
        };
        mockUpdateReturning.mockResolvedValueOnce([viajeData]);

        const res = await cancelarViaje(1, "Cancelado por mal tiempo");

        expect(res.success).toBe(true);
        expect(res.data).toEqual(viajeData);
        expect(mockUpdate).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/panel/control-flota/viajes");
        expect(revalidatePath).toHaveBeenCalledWith("/panel/chofer");
      });
    });
  });
});
