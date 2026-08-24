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

function safeParseJsonArray<T>(val: any, fallback: T[] = []): T[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      let parsed = JSON.parse(val);
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {}
      }
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Helper to safely deserialize a DB row into a Geofence object.
 */
export function dbRowToGeofence(row: any): Geofence {
  let coordenadas: [number, number][] | undefined = undefined;
  if (row.coordenadas) {
    try {
      let parsed = typeof row.coordenadas === "string" ? JSON.parse(row.coordenadas) : row.coordenadas;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {}
      }
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((p) => Array.isArray(p) && p.length === 2 && !isNaN(Number(p[0])) && !isNaN(Number(p[1])))
      ) {
        coordenadas = parsed.map((p) => [Number(p[0]), Number(p[1])]);
      }
    } catch {
      coordenadas = undefined;
    }
  }

  let centro: [number, number] | undefined = undefined;
  if (row.centroLat != null && row.centroLng != null) {
    const lat = Number(row.centroLat);
    const lng = Number(row.centroLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      centro = [lat, lng];
    }
  } else if (row.centro) {
    const parsedCentro = safeParseJsonArray<number>(row.centro);
    if (parsedCentro.length === 2 && !isNaN(Number(parsedCentro[0])) && !isNaN(Number(parsedCentro[1]))) {
      centro = [Number(parsedCentro[0]), Number(parsedCentro[1])];
    }
  }

  const targetVehicles = safeParseJsonArray<number>(row.targetVehicles, []);
  const targetCategories = safeParseJsonArray<string>(row.targetCategories, []);
  const targetGroups = safeParseJsonArray<string>(row.targetGroups, []);
  const rawAlertEvents = safeParseJsonArray<GeofenceAlertEvent>(row.alertEvents, ["EXIT"]);
  const alertEvents = rawAlertEvents.length > 0 ? rawAlertEvents : (["EXIT"] as GeofenceAlertEvent[]);
  const actionTypes = safeParseJsonArray<string>(row.actionTypes, ["UI"]);

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
    targetVehicles: targetVehicles.length > 0 ? targetVehicles : undefined,
    targetCategories: targetCategories.length > 0 ? targetCategories : undefined,
    targetGroups: targetGroups.length > 0 ? targetGroups : undefined,
    alertEvents,
    speedLimit: row.speedLimit != null ? Number(row.speedLimit) : undefined,
    actionTypes: actionTypes.length > 0 ? actionTypes : undefined,
    emailRecipients: row.emailRecipients ?? undefined,
    createdAt: row.createdAt ? (row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString()) : undefined,
    updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString()) : undefined,
  };
}

/**
 * Helper to serialize Geofence FormData into DB columns.
 */
export function geofenceToDbValues(data: Partial<GeofenceFormData> & { empresaId?: number; centroLat?: number; centroLng?: number }) {
  const values: Record<string, any> = {};
  if (data.empresaId !== undefined) values.empresaId = data.empresaId;
  if (data.nombre !== undefined) values.nombre = data.nombre;
  if (data.descripcion !== undefined) values.descripcion = data.descripcion;
  if (data.tipo !== undefined) values.tipo = data.tipo;
  if (data.color !== undefined) values.color = data.color;
  if (data.opacidad !== undefined) values.opacidad = typeof data.opacidad === "number" ? data.opacidad : parseFloat(data.opacidad as any) || 0.25;

  if (data.coordenadas !== undefined) {
    if (data.coordenadas == null) {
      values.coordenadas = null;
    } else if (typeof data.coordenadas === "string") {
      values.coordenadas = data.coordenadas;
    } else if (Array.isArray(data.coordenadas)) {
      values.coordenadas = JSON.stringify(data.coordenadas);
    }
  }

  if (data.centro !== undefined) {
    values.centroLat = data.centro ? Number(data.centro[0]) : null;
    values.centroLng = data.centro ? Number(data.centro[1]) : null;
  } else {
    if (data.centroLat !== undefined) values.centroLat = data.centroLat != null ? Number(data.centroLat) : null;
    if (data.centroLng !== undefined) values.centroLng = data.centroLng != null ? Number(data.centroLng) : null;
  }

  if (data.radio !== undefined) values.radio = data.radio != null ? Number(data.radio) : null;
  if (data.activa !== undefined) values.activa = data.activa ? 1 : 0;
  if (data.targetType !== undefined) values.targetType = data.targetType || "ALL";

  if (data.targetVehicles !== undefined) {
    values.targetVehicles = data.targetVehicles == null ? null : (typeof data.targetVehicles === "string" ? data.targetVehicles : JSON.stringify(data.targetVehicles));
  }
  if (data.targetCategories !== undefined) {
    values.targetCategories = data.targetCategories == null ? null : (typeof data.targetCategories === "string" ? data.targetCategories : JSON.stringify(data.targetCategories));
  }
  if (data.targetGroups !== undefined) {
    values.targetGroups = data.targetGroups == null ? null : (typeof data.targetGroups === "string" ? data.targetGroups : JSON.stringify(data.targetGroups));
  }
  if (data.alertEvents !== undefined) {
    values.alertEvents = data.alertEvents == null ? null : (typeof data.alertEvents === "string" ? data.alertEvents : JSON.stringify(data.alertEvents));
  }
  if (data.speedLimit !== undefined) values.speedLimit = data.speedLimit != null ? Number(data.speedLimit) : null;
  if (data.actionTypes !== undefined) {
    values.actionTypes = data.actionTypes == null ? null : (typeof data.actionTypes === "string" ? data.actionTypes : JSON.stringify(data.actionTypes));
  }
  if (data.emailRecipients !== undefined) values.emailRecipients = data.emailRecipients;
  values.updatedAt = new Date();
  return values;
}
