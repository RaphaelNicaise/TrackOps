export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeSlot {
  start: string; // "HH:mm" ej. "08:00"
  end: string;   // "HH:mm" ej. "18:00"
}

export interface DayScheduleConfig {
  active: boolean;
  slots: TimeSlot[];
}

export type WeeklyScheduleConfig = Record<DayOfWeek, DayScheduleConfig>;

export type ScheduleTargetType = "ALL" | "CATEGORY" | "GROUP" | "VEHICLES";
export type ScheduleAlertChannel = "UI" | "EMAIL" | "WHATSAPP";

export interface Schedule {
  id: number;
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  color: string;
  activo: boolean;
  diasConfig: WeeklyScheduleConfig;
  toleranciaMinutos: number;
  targetType: ScheduleTargetType;
  targetVehicles?: number[];
  targetCategories?: string[];
  targetGroups?: string[];
  alertChannels: ScheduleAlertChannel[];
  emailRecipients?: string;
  whatsappRecipients?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleGroup {
  id: number;
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  vehicleIds: number[];
  createdAt?: string;
}

export interface ScheduleViolation {
  id: number;
  empresaId?: number;
  scheduleId?: number;
  scheduleNombre?: string;
  vehicleId: number;
  patente: string;
  fechaInicio: string;
  fechaFin?: string;
  duracionMinutos: number;
  velocidadMaxima: number;
  lat?: number;
  lng?: number;
  notificadoEmail: boolean;
  notificadoWhatsapp: boolean;
  createdAt: string;
}

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "monday", label: "Lunes", short: "L" },
  { key: "tuesday", label: "Martes", short: "M" },
  { key: "wednesday", label: "Miércoles", short: "M" },
  { key: "thursday", label: "Jueves", short: "J" },
  { key: "friday", label: "Viernes", short: "V" },
  { key: "saturday", label: "Sábado", short: "S" },
  { key: "sunday", label: "Domingo", short: "D" },
];

export const PRESET_SCHEDULE_COLORS = [
  { hex: "#F2B705", label: "Ámbar TrackOps" },
  { hex: "#3B82F6", label: "Azul" },
  { hex: "#10B981", label: "Esmeralda" },
  { hex: "#8B5CF6", label: "Púrpura" },
  { hex: "#EF4444", label: "Rojo" },
  { hex: "#F97316", label: "Naranja" },
  { hex: "#06B6D4", label: "Cian" },
  { hex: "#EC4899", label: "Rosa" },
] as const;

export const DEFAULT_WEEKLY_CONFIG: WeeklyScheduleConfig = {
  monday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  tuesday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  wednesday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  thursday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  friday: { active: true, slots: [{ start: "08:00", end: "18:00" }] },
  saturday: { active: false, slots: [{ start: "08:00", end: "13:00" }] },
  sunday: { active: false, slots: [] },
};
