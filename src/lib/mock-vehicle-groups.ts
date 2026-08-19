import { VehicleGroup } from "@/types/schedule";

export const INITIAL_MOCK_GROUPS: VehicleGroup[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Logística Urbana",
    descripcion: "Reparto local, paquetería y mensajería urbana",
    color: "#3B82F6",
    icono: "truck",
    vehicleIds: [1, 3, 5],
    createdAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Reparto Turno Mañana",
    descripcion: "Distribución matutina de primera necesidad",
    color: "#10B981",
    icono: "layers",
    vehicleIds: [2, 4],
    createdAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Mantenimiento & Técnica",
    descripcion: "Móviles de auxilio, técnicos de soporte y taller",
    color: "#F2B705",
    icono: "wrench",
    vehicleIds: [1, 6],
    createdAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 4,
    empresaId: 1,
    nombre: "Larga Distancia",
    descripcion: "Transporte pesado e interurbano de cargas",
    color: "#8B5CF6",
    icono: "navigation",
    vehicleIds: [3, 4, 5],
    createdAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 5,
    empresaId: 1,
    nombre: "Supervisión & Control",
    descripcion: "Patrullaje, inspección de rutas y gestión operativa",
    color: "#EC4899",
    icono: "shield",
    vehicleIds: [2, 6],
    createdAt: "2026-08-17T10:00:00.000Z",
  },
];

export let mockVehicleGroups: VehicleGroup[] = JSON.parse(JSON.stringify(INITIAL_MOCK_GROUPS));

export function resetMockVehicleGroups(): void {
  mockVehicleGroups = JSON.parse(JSON.stringify(INITIAL_MOCK_GROUPS));
}

export function getMockVehicleGroups(empresaId: number = 1): VehicleGroup[] {
  return mockVehicleGroups.filter((g) => (g.empresaId ? g.empresaId === empresaId : true));
}

export function getMockVehicleGroup(id: number): VehicleGroup | undefined {
  return mockVehicleGroups.find((g) => g.id === id);
}

export function createMockVehicleGroup(data: {
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  vehicleIds?: number[];
}): VehicleGroup {
  const maxId = mockVehicleGroups.reduce((max, g) => (g.id > max ? g.id : max), 0);
  const now = new Date().toISOString();

  const newGroup: VehicleGroup = {
    id: maxId + 1,
    empresaId: data.empresaId ?? 1,
    nombre: data.nombre,
    descripcion: data.descripcion ?? "",
    color: data.color || "#3B82F6",
    icono: data.icono || "truck",
    vehicleIds: data.vehicleIds || [],
    createdAt: now,
  };

  mockVehicleGroups.push(newGroup);
  return newGroup;
}

export function updateMockVehicleGroup(
  id: number,
  data: Partial<Omit<VehicleGroup, "id" | "createdAt">>
): VehicleGroup | null {
  const index = mockVehicleGroups.findIndex((g) => g.id === id);
  if (index === -1) return null;

  const existing = mockVehicleGroups[index];
  const updated: VehicleGroup = {
    ...existing,
    ...data,
    id: existing.id,
    empresaId: data.empresaId ?? existing.empresaId,
  };

  mockVehicleGroups[index] = updated;
  return updated;
}

export function deleteMockVehicleGroup(id: number): boolean {
  const index = mockVehicleGroups.findIndex((g) => g.id === id);
  if (index === -1) return false;
  mockVehicleGroups.splice(index, 1);
  return true;
}

/**
 * Helper to deserialize DB row into a VehicleGroup object.
 */
export function dbRowToVehicleGroup(row: any, memberVehicleIds: number[] = []): VehicleGroup {
  return {
    id: row.id,
    empresaId: row.empresaId,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    color: row.color || "#3B82F6",
    icono: row.icono || "truck",
    vehicleIds: memberVehicleIds,
    createdAt: row.createdAt
      ? row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString()
      : undefined,
  };
}

/**
 * Helper to serialize VehicleGroup into DB values.
 */
export function vehicleGroupToDbValues(data: Partial<VehicleGroup> & { empresaId?: number }) {
  const values: Record<string, any> = {};
  if (data.empresaId !== undefined) values.empresaId = data.empresaId;
  if (data.nombre !== undefined) values.nombre = data.nombre;
  if (data.descripcion !== undefined) values.descripcion = data.descripcion;
  if (data.color !== undefined) values.color = data.color;
  if (data.icono !== undefined) values.icono = data.icono;
  return values;
}
