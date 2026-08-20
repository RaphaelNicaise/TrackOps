export type AlertModule = "MANTENIMIENTO" | "DOCUMENTACION" | "GEOCERCAS" | "HORARIOS" | "SISTEMA";
export type AlertSeverity = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
export type AlertChannel = "EMAIL" | "WHATSAPP" | "AMBOS" | "SISTEMA";
export type AlertStatus = "MOCK_DISPATCHED" | "ENVIADO" | "FALLIDO";

export interface DispatchAlertParams {
  empresaId: number;
  modulo: AlertModule;
  tipo: string;
  severidad?: AlertSeverity;
  titulo: string;
  mensaje: string;
  vehiculoId?: number;
  patente?: string;
  metadata?: Record<string, any>;
  overrideEmail?: string;
  overrideWhatsapp?: string;
}

export interface DispatchAlertResult {
  success: boolean;
  reason?: string;
  dispatchedChannels: ("EMAIL" | "WHATSAPP")[];
  destinatarioEmail?: string | null;
  destinatarioWhatsapp?: string | null;
  logId?: number;
  loggedAt?: Date;
}

export interface AlertFilterOptions {
  empresaId?: number;
  patente?: string;
  modulo?: string;
  severidad?: string;
  canal?: string;
  search?: string;
}
