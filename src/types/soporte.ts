export type TicketOrigen = "PANEL" | "WEB";

export type TicketTipo =
  | "PROBLEMA_TECNICO"
  | "DISPOSITIVO_GPS"
  | "FACTURACION"
  | "QUEJA_RECLAMO"
  | "CONSULTA_GENERAL"
  | "OTRO";

export type TicketPrioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export type TicketEstado = "PENDIENTE" | "EN_REVISION" | "RESUELTO" | "DESCARTADO";

export type PreferenciaRespuesta = "EMAIL" | "WHATSAPP";

export interface TicketSoporteRow {
  id: number;
  origen: TicketOrigen;
  empresaId: number | null;
  empresaNombre?: string | null;
  userId: string | null;
  userName?: string | null;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string | null;
  empresaNombreManual: string | null;
  tipo: TicketTipo;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  asunto: string;
  mensaje: string;
  preferenciaRespuesta: PreferenciaRespuesta | null;
  notasInternas: string | null;
  resueltoPor: string | null;
  resueltoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketInput {
  origen?: TicketOrigen;
  empresaId?: number | null;
  userId?: string | null;
  nombreContacto: string;
  emailContacto?: string | null;
  telefonoContacto?: string | null;
  empresaNombreManual?: string | null;
  tipo: TicketTipo;
  prioridad?: TicketPrioridad;
  asunto: string;
  mensaje: string;
  preferenciaRespuesta?: PreferenciaRespuesta;
}

export interface TicketFilters {
  estado?: TicketEstado | string;
  prioridad?: TicketPrioridad | string;
  tipo?: TicketTipo | string;
  origen?: TicketOrigen | string;
  empresaId?: number;
  search?: string;
}
