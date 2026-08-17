import {
  Geofence,
  GeofenceFormData,
  GeofenceType,
  GeofenceTargetType,
  GeofenceAlertEvent,
} from "@/types/geofence";

export const INITIAL_MOCK_GEOFENCES: Geofence[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Base Operativa Central",
    descripcion: "Sede principal, oficinas centrales y estacionamiento de flota",
    tipo: "Polígono",
    color: "#3B82F6",
    opacidad: 0.25,
    coordenadas: [
      [-38.7150, -62.2630],
      [-38.7150, -62.2690],
      [-38.7210, -62.2690],
      [-38.7210, -62.2630],
    ],
    activa: true,
    targetType: "ALL",
    alertEvents: ["EXIT"],
    speedLimit: 30,
    actionTypes: ["UI", "EMAIL"],
    emailRecipients: "alertas@trackops.com",
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Zona de Carga Sur",
    descripcion: "Área logística de carga y descarga de mercadería pesada",
    tipo: "Círculo",
    color: "#10B981",
    opacidad: 0.25,
    centro: [-38.7300, -62.2800],
    radio: 800,
    activa: true,
    targetType: "CATEGORY",
    targetCategories: ["Camión", "Camioneta"],
    alertEvents: ["EXIT", "SPEED_LIMIT"],
    speedLimit: 40,
    actionTypes: ["UI"],
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Depósito Industrial Norte",
    descripcion: "Sector restringido de almacenamiento y logística",
    tipo: "Polígono",
    color: "#8B5CF6",
    opacidad: 0.25,
    coordenadas: [
      [-38.7020, -62.2520],
      [-38.7020, -62.2580],
      [-38.7080, -62.2580],
      [-38.7080, -62.2520],
    ],
    activa: true,
    targetType: "VEHICLES",
    targetVehicles: [1, 4],
    alertEvents: ["EXIT", "ENTER"],
    speedLimit: 25,
    actionTypes: ["UI", "EMAIL"],
    emailRecipients: "logistica@trackops.com",
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 4,
    empresaId: 1,
    nombre: "Taller & Mantenimiento",
    descripcion: "Zona técnica de reparaciones mecánicas y preventivas",
    tipo: "Polígono",
    color: "#F59E0B",
    opacidad: 0.25,
    coordenadas: [
      [-38.7080, -62.2420],
      [-38.7080, -62.2480],
      [-38.7120, -62.2480],
      [-38.7120, -62.2420],
    ],
    activa: false,
    targetType: "ALL",
    alertEvents: ["ENTER"],
    actionTypes: ["UI"],
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
];

export let mockGeofences: Geofence[] = JSON.parse(JSON.stringify(INITIAL_MOCK_GEOFENCES));

export function resetMockGeofences(): void {
  mockGeofences = JSON.parse(JSON.stringify(INITIAL_MOCK_GEOFENCES));
}

export function getMockGeofences(): Geofence[] {
  return [...mockGeofences];
}

export function getMockGeofence(id: number): Geofence | undefined {
  return mockGeofences.find((g) => g.id === id);
}

export function createMockGeofence(data: GeofenceFormData): Geofence {
  const maxId = mockGeofences.reduce((max, g) => (g.id > max ? g.id : max), 0);
  const now = new Date().toISOString();

  const newGeofence: Geofence = {
    ...data,
    id: maxId + 1,
    empresaId: data.empresaId ?? 1,
    opacidad: data.opacidad ?? 0.25,
    activa: data.activa !== undefined ? data.activa : true,
    alertEvents: data.alertEvents || ["EXIT"],
    targetType: data.targetType || "ALL",
    createdAt: now,
    updatedAt: now,
  };

  mockGeofences.push(newGeofence);
  return newGeofence;
}

export function updateMockGeofence(
  id: number,
  data: Partial<GeofenceFormData>
): Geofence | null {
  const index = mockGeofences.findIndex((g) => g.id === id);
  if (index === -1) return null;

  const existing = mockGeofences[index];
  const updated: Geofence = {
    ...existing,
    ...data,
    id: existing.id,
    empresaId: data.empresaId ?? existing.empresaId,
    updatedAt: new Date().toISOString(),
  };

  mockGeofences[index] = updated;
  return updated;
}

export function deleteMockGeofence(id: number): boolean {
  const index = mockGeofences.findIndex((g) => g.id === id);
  if (index === -1) return false;
  mockGeofences.splice(index, 1);
  return true;
}

export function toggleMockGeofence(id: number): Geofence | null {
  const index = mockGeofences.findIndex((g) => g.id === id);
  if (index === -1) return null;

  const existing = mockGeofences[index];
  const updated: Geofence = {
    ...existing,
    activa: !existing.activa,
    updatedAt: new Date().toISOString(),
  };

  mockGeofences[index] = updated;
  return updated;
}

/**
 * Helper to safely deserialize a DB row into a Geofence object.
 */
export function dbRowToGeofence(row: any): Geofence {
  let coordenadas: [number, number][] | undefined = undefined;
  if (row.coordenadas) {
    try {
      coordenadas = typeof row.coordenadas === "string" ? JSON.parse(row.coordenadas) : row.coordenadas;
    } catch {
      coordenadas = undefined;
    }
  }

  let centro: [number, number] | undefined = undefined;
  if (row.centroLat != null && row.centroLng != null) {
    centro = [Number(row.centroLat), Number(row.centroLng)];
  }

  let targetVehicles: number[] | undefined = undefined;
  if (row.targetVehicles) {
    try {
      targetVehicles = typeof row.targetVehicles === "string" ? JSON.parse(row.targetVehicles) : row.targetVehicles;
    } catch {
      targetVehicles = undefined;
    }
  }

  let targetCategories: string[] | undefined = undefined;
  if (row.targetCategories) {
    try {
      targetCategories = typeof row.targetCategories === "string" ? JSON.parse(row.targetCategories) : row.targetCategories;
    } catch {
      targetCategories = undefined;
    }
  }

  let targetGroups: string[] | undefined = undefined;
  if (row.targetGroups) {
    try {
      targetGroups = typeof row.targetGroups === "string" ? JSON.parse(row.targetGroups) : row.targetGroups;
    } catch {
      targetGroups = undefined;
    }
  }

  let alertEvents: GeofenceAlertEvent[] = ["EXIT"];
  if (row.alertEvents) {
    try {
      alertEvents = typeof row.alertEvents === "string" ? JSON.parse(row.alertEvents) : row.alertEvents;
    } catch {
      alertEvents = ["EXIT"];
    }
  }

  let actionTypes: string[] | undefined = undefined;
  if (row.actionTypes) {
    try {
      actionTypes = typeof row.actionTypes === "string" ? JSON.parse(row.actionTypes) : row.actionTypes;
    } catch {
      actionTypes = undefined;
    }
  }

  return {
    id: row.id,
    empresaId: row.empresaId,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    tipo: (row.tipo || "Polígono") as GeofenceType,
    color: row.color || "#3b82f6",
    opacidad: typeof row.opacidad === "number" ? row.opacidad : (parseFloat(row.opacidad) || 0.25),
    coordenadas,
    centro,
    radio: row.radio != null ? Number(row.radio) : undefined,
    activa: row.activa === 1 || row.activa === true,
    targetType: (row.targetType || "ALL") as GeofenceTargetType,
    targetVehicles,
    targetCategories,
    targetGroups,
    alertEvents: Array.isArray(alertEvents) ? alertEvents : ["EXIT"],
    speedLimit: row.speedLimit != null ? Number(row.speedLimit) : undefined,
    actionTypes,
    emailRecipients: row.emailRecipients ?? undefined,
    createdAt: row.createdAt ? (row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString()) : undefined,
    updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString()) : undefined,
  };
}

/**
 * Helper to serialize Geofence FormData into DB columns.
 */
export function geofenceToDbValues(data: Partial<GeofenceFormData> & { empresaId?: number }) {
  const values: Record<string, any> = {};
  if (data.empresaId !== undefined) values.empresaId = data.empresaId;
  if (data.nombre !== undefined) values.nombre = data.nombre;
  if (data.descripcion !== undefined) values.descripcion = data.descripcion;
  if (data.tipo !== undefined) values.tipo = data.tipo;
  if (data.color !== undefined) values.color = data.color;
  if (data.opacidad !== undefined) values.opacidad = data.opacidad;
  if (data.coordenadas !== undefined) values.coordenadas = data.coordenadas ? JSON.stringify(data.coordenadas) : null;
  if (data.centro !== undefined) {
    values.centroLat = data.centro ? data.centro[0] : null;
    values.centroLng = data.centro ? data.centro[1] : null;
  }
  if (data.radio !== undefined) values.radio = data.radio;
  if (data.activa !== undefined) values.activa = data.activa ? 1 : 0;
  if (data.targetType !== undefined) values.targetType = data.targetType;
  if (data.targetVehicles !== undefined) values.targetVehicles = data.targetVehicles ? JSON.stringify(data.targetVehicles) : null;
  if (data.targetCategories !== undefined) values.targetCategories = data.targetCategories ? JSON.stringify(data.targetCategories) : null;
  if (data.targetGroups !== undefined) values.targetGroups = data.targetGroups ? JSON.stringify(data.targetGroups) : null;
  if (data.alertEvents !== undefined) values.alertEvents = data.alertEvents ? JSON.stringify(data.alertEvents) : null;
  if (data.speedLimit !== undefined) values.speedLimit = data.speedLimit;
  if (data.actionTypes !== undefined) values.actionTypes = data.actionTypes ? JSON.stringify(data.actionTypes) : null;
  if (data.emailRecipients !== undefined) values.emailRecipients = data.emailRecipients;
  values.updatedAt = new Date();
  return values;
}
