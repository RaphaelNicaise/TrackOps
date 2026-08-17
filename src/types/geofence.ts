export type GeofenceType = "Polígono" | "Círculo";

export type GeofenceTargetType = "ALL" | "CATEGORY" | "VEHICLES" | "GROUP";

export type GeofenceAlertEvent = "EXIT" | "ENTER" | "SPEED_LIMIT" | "SCHEDULE";

export type DrawingMode = "none" | "draw_polygon" | "draw_circle" | "edit_vertices";

export interface Geofence {
  id: number;
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  tipo: GeofenceType;
  color: string;
  opacidad?: number;
  coordenadas?: [number, number][];
  centro?: [number, number];
  radio?: number;
  activa: boolean;
  targetType?: GeofenceTargetType;
  targetVehicles?: number[];
  targetCategories?: string[];
  targetGroups?: string[];
  alertEvents?: GeofenceAlertEvent[];
  speedLimit?: number;
  actionTypes?: string[];
  emailRecipients?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeofenceFormData extends Omit<Geofence, "id"> {
  id?: number;
}

export const PRESET_GEOFENCE_COLORS = [
  { hex: "#3B82F6", label: "Azul" },
  { hex: "#10B981", label: "Esmeralda" },
  { hex: "#F2B705", label: "Ámbar TrackOps" },
  { hex: "#EF4444", label: "Rojo" },
  { hex: "#8B5CF6", label: "Violeta" },
  { hex: "#06B6D4", label: "Cian" },
  { hex: "#F97316", label: "Naranja" },
  { hex: "#EC4899", label: "Rosa" },
  { hex: "#475569", label: "Grafito" },
] as const;

export const PRESET_FLEET_GROUPS_LIST = [
  {
    id: "Logística Urbana",
    label: "Logística Urbana",
    description: "Reparto local, paquetería y mensajería urbana",
  },
  {
    id: "Reparto Turno Mañana",
    label: "Reparto Turno Mañana",
    description: "Distribución matutina de primera necesidad",
  },
  {
    id: "Mantenimiento & Técnica",
    label: "Mantenimiento & Técnica",
    description: "Móviles de auxilio, técnicos de soporte y taller",
  },
  {
    id: "Larga Distancia",
    label: "Larga Distancia",
    description: "Transporte pesado e interurbano de cargas",
  },
  {
    id: "Supervisión & Control",
    label: "Supervisión & Control",
    description: "Patrullaje, inspección de rutas y gestión operativa",
  },
] as const;

