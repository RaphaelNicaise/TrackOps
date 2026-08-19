import {
  Schedule,
  ScheduleViolation,
  WeeklyScheduleConfig,
  DayScheduleConfig,
  ScheduleTargetType,
  ScheduleAlertChannel,
} from "@/types/schedule";

export const DEFAULT_WEEKLY_CONFIG: WeeklyScheduleConfig = {
  monday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  tuesday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  wednesday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  thursday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  friday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  saturday: { active: false, slots: [{ start: "08:00", end: "13:00" }] },
  sunday: { active: false, slots: [] },
};

export const INITIAL_MOCK_SCHEDULES: Schedule[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Horario Comercial Central",
    descripcion: "Horario estándar comercial de lunes a viernes con tolerancia operativa",
    color: "#F2B705",
    activo: true,
    diasConfig: {
      monday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
      tuesday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
      wednesday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
      thursday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
      friday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
      saturday: { active: false, slots: [] },
      sunday: { active: false, slots: [] },
    },
    toleranciaMinutos: 10,
    targetType: "GROUP",
    targetGroups: ["Logística Urbana"],
    alertChannels: ["UI", "EMAIL"],
    emailRecipients: "operaciones@pradaflota.com",
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Turno Mañana Reparto",
    descripcion: "Ventana de entrega temprana matutina de lunes a sábados",
    color: "#10B981",
    activo: true,
    diasConfig: {
      monday: { active: true, slots: [{ start: "06:00", end: "14:00" }] },
      tuesday: { active: true, slots: [{ start: "06:00", end: "14:00" }] },
      wednesday: { active: true, slots: [{ start: "06:00", end: "14:00" }] },
      thursday: { active: true, slots: [{ start: "06:00", end: "14:00" }] },
      friday: { active: true, slots: [{ start: "06:00", end: "14:00" }] },
      saturday: { active: true, slots: [{ start: "06:00", end: "14:00" }] },
      sunday: { active: false, slots: [] },
    },
    toleranciaMinutos: 5,
    targetType: "GROUP",
    targetGroups: ["Reparto Turno Mañana"],
    alertChannels: ["UI", "EMAIL", "WHATSAPP"],
    emailRecipients: "logistica@pradaflota.com",
    whatsappRecipients: "+5491145678901",
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Guardias Técnicas y Soporte",
    descripcion: "Cobertura de servicios técnicos con esquema de horario cortado toda la semana",
    color: "#3B82F6",
    activo: true,
    diasConfig: {
      monday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
      tuesday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
      wednesday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
      thursday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
      friday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
      saturday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
      sunday: {
        active: true,
        slots: [
          { start: "08:00", end: "13:00" },
          { start: "16:00", end: "21:00" },
        ],
      },
    },
    toleranciaMinutos: 15,
    targetType: "GROUP",
    targetGroups: ["Mantenimiento & Técnica"],
    alertChannels: ["UI"],
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: 4,
    empresaId: 1,
    nombre: "Flota Ejecutiva y Administración",
    descripcion: "Control de uso corporativo para vehículos de administración y gerencia",
    color: "#8B5CF6",
    activo: false,
    diasConfig: {
      monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
      tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
      wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
      thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
      friday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
      saturday: { active: false, slots: [] },
      sunday: { active: false, slots: [] },
    },
    toleranciaMinutos: 5,
    targetType: "CATEGORY",
    targetCategories: ["Auto"],
    alertChannels: ["UI", "EMAIL"],
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
  },
];

export const INITIAL_MOCK_VIOLATIONS: ScheduleViolation[] = [
  {
    id: 1,
    empresaId: 1,
    scheduleId: 1,
    scheduleNombre: "Horario Comercial Central",
    vehicleId: 1,
    patente: "AB 123 CD",
    fechaInicio: "2026-08-18T23:45:00.000Z",
    fechaFin: "2026-08-19T00:17:00.000Z",
    duracionMinutos: 32,
    velocidadMaxima: 68,
    lat: -38.715,
    lng: -62.265,
    notificadoEmail: true,
    notificadoWhatsapp: false,
    createdAt: "2026-08-18T23:45:00.000Z",
  },
  {
    id: 2,
    empresaId: 1,
    scheduleId: 4,
    scheduleNombre: "Flota Ejecutiva y Administración",
    vehicleId: 2,
    patente: "EF 456 GH",
    fechaInicio: "2026-08-17T15:20:00.000Z",
    fechaFin: "2026-08-17T15:38:00.000Z",
    duracionMinutos: 18,
    velocidadMaxima: 45,
    lat: -38.72,
    lng: -62.27,
    notificadoEmail: false,
    notificadoWhatsapp: false,
    createdAt: "2026-08-17T15:20:00.000Z",
  },
  {
    id: 3,
    empresaId: 1,
    scheduleId: 2,
    scheduleNombre: "Turno Mañana Reparto",
    vehicleId: 4,
    patente: "JK 012 LM",
    fechaInicio: "2026-08-18T04:10:00.000Z",
    fechaFin: "2026-08-18T04:55:00.000Z",
    duracionMinutos: 45,
    velocidadMaxima: 82,
    lat: -38.725,
    lng: -62.255,
    notificadoEmail: true,
    notificadoWhatsapp: true,
    createdAt: "2026-08-18T04:10:00.000Z",
  },
  {
    id: 4,
    empresaId: 1,
    scheduleId: 1,
    scheduleNombre: "Horario Comercial Central",
    vehicleId: 5,
    patente: "NO 345 PQ",
    fechaInicio: "2026-08-16T20:15:00.000Z",
    fechaFin: "2026-08-16T20:27:00.000Z",
    duracionMinutos: 12,
    velocidadMaxima: 50,
    lat: -38.718,
    lng: -62.28,
    notificadoEmail: false,
    notificadoWhatsapp: false,
    createdAt: "2026-08-16T20:15:00.000Z",
  },
];

export let mockSchedules: Schedule[] = JSON.parse(JSON.stringify(INITIAL_MOCK_SCHEDULES));
export let mockScheduleViolations: ScheduleViolation[] = JSON.parse(
  JSON.stringify(INITIAL_MOCK_VIOLATIONS)
);

export function resetMockSchedules(): void {
  mockSchedules = JSON.parse(JSON.stringify(INITIAL_MOCK_SCHEDULES));
}

export function resetMockViolations(): void {
  mockScheduleViolations = JSON.parse(JSON.stringify(INITIAL_MOCK_VIOLATIONS));
}

export function getMockSchedules(empresaId: number = 1): Schedule[] {
  return mockSchedules.filter((s) => (s.empresaId ? s.empresaId === empresaId : true));
}

export function getMockSchedule(id: number): Schedule | undefined {
  return mockSchedules.find((s) => s.id === id);
}

export function createMockSchedule(
  data: Omit<Schedule, "id" | "createdAt" | "updatedAt">
): Schedule {
  const maxId = mockSchedules.reduce((max, s) => (s.id > max ? s.id : max), 0);
  const now = new Date().toISOString();

  const newSchedule: Schedule = {
    ...data,
    id: maxId + 1,
    empresaId: data.empresaId ?? 1,
    activo: data.activo !== undefined ? data.activo : true,
    toleranciaMinutos: data.toleranciaMinutos ?? 5,
    targetType: data.targetType || "ALL",
    alertChannels: data.alertChannels || ["UI"],
    createdAt: now,
    updatedAt: now,
  };

  mockSchedules.push(newSchedule);
  return newSchedule;
}

export function updateMockSchedule(
  id: number,
  data: Partial<Omit<Schedule, "id" | "createdAt">>
): Schedule | null {
  const index = mockSchedules.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const existing = mockSchedules[index];
  const updated: Schedule = {
    ...existing,
    ...data,
    id: existing.id,
    empresaId: data.empresaId ?? existing.empresaId,
    updatedAt: new Date().toISOString(),
  };

  mockSchedules[index] = updated;
  return updated;
}

export function toggleMockSchedule(id: number): Schedule | null {
  const index = mockSchedules.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const existing = mockSchedules[index];
  const updated: Schedule = {
    ...existing,
    activo: !existing.activo,
    updatedAt: new Date().toISOString(),
  };

  mockSchedules[index] = updated;
  return updated;
}

export function deleteMockSchedule(id: number): boolean {
  const index = mockSchedules.findIndex((s) => s.id === id);
  if (index === -1) return false;
  mockSchedules.splice(index, 1);
  return true;
}

export function getMockScheduleViolations(filters?: {
  empresaId?: number;
  scheduleId?: number;
  vehicleId?: number;
}): ScheduleViolation[] {
  return mockScheduleViolations.filter((v) => {
    if (filters?.empresaId && v.empresaId && v.empresaId !== filters.empresaId) return false;
    if (filters?.scheduleId && v.scheduleId !== filters.scheduleId) return false;
    if (filters?.vehicleId && v.vehicleId !== filters.vehicleId) return false;
    return true;
  });
}

export function addMockScheduleViolation(
  data: Omit<ScheduleViolation, "id" | "createdAt">
): ScheduleViolation {
  const maxId = mockScheduleViolations.reduce((max, v) => (v.id > max ? v.id : max), 0);
  const now = new Date().toISOString();

  const newViolation: ScheduleViolation = {
    ...data,
    id: maxId + 1,
    empresaId: data.empresaId ?? 1,
    createdAt: now,
  };

  mockScheduleViolations.unshift(newViolation);
  return newViolation;
}

/**
 * Helper to safely deserialize a DB row into a Schedule object.
 */
export function dbRowToSchedule(row: any): Schedule {
  let diasConfig: WeeklyScheduleConfig = DEFAULT_WEEKLY_CONFIG;
  if (row.diasConfig) {
    try {
      diasConfig =
        typeof row.diasConfig === "string" ? JSON.parse(row.diasConfig) : row.diasConfig;
    } catch {
      diasConfig = DEFAULT_WEEKLY_CONFIG;
    }
  }

  let targetVehicles: number[] | undefined = undefined;
  if (row.targetVehicles) {
    try {
      targetVehicles =
        typeof row.targetVehicles === "string"
          ? JSON.parse(row.targetVehicles)
          : row.targetVehicles;
    } catch {
      targetVehicles = undefined;
    }
  }

  let targetCategories: string[] | undefined = undefined;
  if (row.targetCategories) {
    try {
      targetCategories =
        typeof row.targetCategories === "string"
          ? JSON.parse(row.targetCategories)
          : row.targetCategories;
    } catch {
      targetCategories = undefined;
    }
  }

  let targetGroups: string[] | undefined = undefined;
  if (row.targetGroups) {
    try {
      targetGroups =
        typeof row.targetGroups === "string"
          ? JSON.parse(row.targetGroups)
          : row.targetGroups;
    } catch {
      targetGroups = undefined;
    }
  }

  let alertChannels: ScheduleAlertChannel[] = ["UI"];
  if (row.alertChannels) {
    try {
      alertChannels =
        typeof row.alertChannels === "string"
          ? JSON.parse(row.alertChannels)
          : row.alertChannels;
    } catch {
      alertChannels = ["UI"];
    }
  }

  return {
    id: row.id,
    empresaId: row.empresaId,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    color: row.color || "#F2B705",
    activo: row.activo === 1 || row.activo === true,
    diasConfig,
    toleranciaMinutos: Number(row.toleranciaMinutos ?? 5),
    targetType: (row.targetType || "ALL") as ScheduleTargetType,
    targetVehicles,
    targetCategories,
    targetGroups,
    alertChannels: Array.isArray(alertChannels) ? alertChannels : ["UI"],
    emailRecipients: row.emailRecipients ?? undefined,
    whatsappRecipients: row.whatsappRecipients ?? undefined,
    createdAt: row.createdAt
      ? row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString()
      : undefined,
    updatedAt: row.updatedAt
      ? row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString()
      : undefined,
  };
}

/**
 * Helper to serialize Schedule into DB columns.
 */
export function scheduleToDbValues(data: Partial<Schedule> & { empresaId?: number }) {
  const values: Record<string, any> = {};
  if (data.empresaId !== undefined) values.empresaId = data.empresaId;
  if (data.nombre !== undefined) values.nombre = data.nombre;
  if (data.descripcion !== undefined) values.descripcion = data.descripcion;
  if (data.color !== undefined) values.color = data.color;
  if (data.activo !== undefined) values.activo = data.activo ? 1 : 0;
  if (data.diasConfig !== undefined) values.diasConfig = JSON.stringify(data.diasConfig);
  if (data.toleranciaMinutos !== undefined) values.toleranciaMinutos = data.toleranciaMinutos;
  if (data.targetType !== undefined) values.targetType = data.targetType;
  if (data.targetVehicles !== undefined) {
    values.targetVehicles = data.targetVehicles ? JSON.stringify(data.targetVehicles) : null;
  }
  if (data.targetCategories !== undefined) {
    values.targetCategories = data.targetCategories ? JSON.stringify(data.targetCategories) : null;
  }
  if (data.targetGroups !== undefined) {
    values.targetGroups = data.targetGroups ? JSON.stringify(data.targetGroups) : null;
  }
  if (data.alertChannels !== undefined) {
    values.alertChannels = JSON.stringify(data.alertChannels);
  }
  if (data.emailRecipients !== undefined) values.emailRecipients = data.emailRecipients;
  if (data.whatsappRecipients !== undefined) values.whatsappRecipients = data.whatsappRecipients;
  values.updatedAt = new Date();
  return values;
}

/**
 * Helper to safely deserialize a DB row into a ScheduleViolation object.
 */
export function dbRowToViolation(row: any): ScheduleViolation {
  return {
    id: row.id,
    empresaId: row.empresaId,
    scheduleId: row.scheduleId ?? undefined,
    scheduleNombre: row.scheduleNombre ?? undefined,
    vehicleId: row.vehicleId,
    patente: row.patente,
    fechaInicio:
      row.fechaInicio instanceof Date
        ? row.fechaInicio.toISOString()
        : new Date(row.fechaInicio).toISOString(),
    fechaFin: row.fechaFin
      ? row.fechaFin instanceof Date
        ? row.fechaFin.toISOString()
        : new Date(row.fechaFin).toISOString()
      : undefined,
    duracionMinutos: Number(row.duracionMinutos ?? 0),
    velocidadMaxima: Number(row.velocidadMaxima ?? 0),
    lat: row.lat != null ? Number(row.lat) : undefined,
    lng: row.lng != null ? Number(row.lng) : undefined,
    notificadoEmail: row.notificadoEmail === 1 || row.notificadoEmail === true,
    notificadoWhatsapp: row.notificadoWhatsapp === 1 || row.notificadoWhatsapp === true,
    createdAt: row.createdAt
      ? row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Helper to serialize ScheduleViolation into DB columns.
 */
export function violationToDbValues(
  data: Partial<ScheduleViolation> & { empresaId?: number }
) {
  const values: Record<string, any> = {};
  if (data.empresaId !== undefined) values.empresaId = data.empresaId;
  if (data.scheduleId !== undefined) values.scheduleId = data.scheduleId;
  if (data.vehicleId !== undefined) values.vehicleId = data.vehicleId;
  if (data.patente !== undefined) values.patente = data.patente;
  if (data.fechaInicio !== undefined) values.fechaInicio = new Date(data.fechaInicio);
  if (data.fechaFin !== undefined) {
    values.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
  }
  if (data.duracionMinutos !== undefined) values.duracionMinutos = data.duracionMinutos;
  if (data.velocidadMaxima !== undefined) values.velocidadMaxima = data.velocidadMaxima;
  if (data.lat !== undefined) values.lat = data.lat;
  if (data.lng !== undefined) values.lng = data.lng;
  if (data.notificadoEmail !== undefined) {
    values.notificadoEmail = data.notificadoEmail ? 1 : 0;
  }
  if (data.notificadoWhatsapp !== undefined) {
    values.notificadoWhatsapp = data.notificadoWhatsapp ? 1 : 0;
  }
  return values;
}
