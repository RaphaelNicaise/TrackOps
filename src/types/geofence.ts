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
  opacidad: number;
  coordenadas?: [number, number][];
  centro?: [number, number];
  radio?: number;
  activa: boolean;
  targetType: GeofenceTargetType;
  targetVehicles?: number[];
  targetCategories?: string[];
  targetGroups?: string[];
  alertEvents: GeofenceAlertEvent[];
  speedLimit?: number;
  actionTypes?: string[];
  emailRecipients?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeofenceFormData extends Omit<Geofence, "id"> {
  id?: number;
}
