import { db } from "@/db";
import { alertConfigs, alertLogs, type AlertConfig, type AlertLog } from "@/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import type {
  DispatchAlertParams,
  DispatchAlertResult,
  AlertFilterOptions,
  AlertSeverity,
} from "@/types/alerts";

let mockAlertLogs: AlertLog[] = [];
let mockConfigs = new Map<number, Partial<AlertConfig>>();
let mockLogIdCounter = 1;

export function getMockAlertLogs(): AlertLog[] {
  return [...mockAlertLogs];
}

export function resetMockAlertLogs(): void {
  mockAlertLogs = [];
  mockLogIdCounter = 1;
}

export function setMockAlertConfig(empresaId: number, config: Partial<AlertConfig>): void {
  mockConfigs.set(empresaId, { ...mockConfigs.get(empresaId), ...config });
}

export function resetMockAlertConfigs(): void {
  mockConfigs.clear();
}

function isDbAvailable(): boolean {
  // In test environment without explicit DATABASE_URL, skip unmocked TCP connection attempts to prevent timeouts
  if ((process.env.NODE_ENV === "test" || process.env.VITEST) && !process.env.DATABASE_URL) {
    const isMocked =
      typeof (db?.select as any)?._isMockFunction === "boolean" ||
      typeof (db?.select as any)?.mock === "object";
    return isMocked;
  }
  return true;
}

function parseEnabledModules(modulosHabilitados: string | string[] | undefined | null): string[] {
  if (!modulosHabilitados) return [];
  if (Array.isArray(modulosHabilitados)) return modulosHabilitados;
  try {
    const parsed = JSON.parse(modulosHabilitados);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getCompanyAlertConfig(empresaId: number): Promise<Partial<AlertConfig>> {
  if (mockConfigs.has(empresaId)) {
    return mockConfigs.get(empresaId)!;
  }

  if (isDbAvailable()) {
    try {
      const [row] = await db
        .select()
        .from(alertConfigs)
        .where(eq(alertConfigs.empresaId, empresaId))
        .limit(1);

      if (row) {
        return row;
      }
    } catch {
      // Database connection or table unavailable, fall back to default
    }
  }

  return {
    id: empresaId,
    empresaId,
    canalEmail: 1,
    canalWhatsapp: 0,
    emailDestino: "alertas@flota.com",
    telefonoWhatsapp: null,
    toleranciaKm: 500,
    toleranciaDias: 15,
    modulosHabilitados: '["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS","SISTEMA"]',
    activo: 1,
  };
}

export function formatAlertConsoleLog(
  params: DispatchAlertParams,
  info: { emailDest?: string | null; phoneDest?: string | null; severidad: string }
): string {
  const lines = [
    "══════════════════════════════════════════════════════════════",
    `🚨 [ALERT DISPATCH ENGINE] - MÓDULO: ${params.modulo} | SEVERIDAD: ${info.severidad}`,
  ];
  if (params.patente) {
    lines.push(`🚗 Vehículo: ${params.patente}${params.vehiculoId ? ` (ID: ${params.vehiculoId})` : ""}`);
  }
  lines.push(`📋 Título: ${params.titulo}`);
  lines.push(`📝 Mensaje: ${params.mensaje}`);
  if (info.emailDest) {
    lines.push(`✉️  EMAIL    -> Destino: [${info.emailDest}]`);
  }
  if (info.phoneDest) {
    lines.push(`📱 WHATSAPP -> Destino: [${info.phoneDest}]`);
  }
  lines.push("══════════════════════════════════════════════════════════════");
  return lines.join("\n");
}

function filterMockAlertLogs(logs: AlertLog[], filters?: AlertFilterOptions): AlertLog[] {
  if (!filters) return [...logs];
  return logs.filter((log) => {
    if (filters.empresaId !== undefined && log.empresaId !== filters.empresaId) {
      return false;
    }
    if (filters.patente && (!log.patente || log.patente.toUpperCase() !== filters.patente.toUpperCase())) {
      return false;
    }
    if (filters.modulo && log.modulo !== filters.modulo) {
      return false;
    }
    if (filters.severidad && log.severidad !== filters.severidad) {
      return false;
    }
    if (filters.canal && log.canal !== filters.canal) {
      return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const match =
        (log.titulo && log.titulo.toLowerCase().includes(s)) ||
        (log.mensaje && log.mensaje.toLowerCase().includes(s)) ||
        (log.patente && log.patente.toLowerCase().includes(s)) ||
        (log.destinatarioEmail && log.destinatarioEmail.toLowerCase().includes(s)) ||
        (log.destinatarioWhatsapp && log.destinatarioWhatsapp.toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });
}

export async function dispatchAlert(params: DispatchAlertParams): Promise<DispatchAlertResult> {
  const config = await getCompanyAlertConfig(params.empresaId);

  // 1. Verify global alert system active
  if (config.activo !== 1) {
    return {
      success: false,
      reason: "ALERTS_SYSTEM_DISABLED",
      dispatchedChannels: [],
    };
  }

  // 2. Verify module enabled
  const enabledModules = parseEnabledModules(config.modulosHabilitados);
  if (!enabledModules.includes(params.modulo)) {
    return {
      success: false,
      reason: "MODULE_DISABLED",
      dispatchedChannels: [],
    };
  }

  // 3. Check channel activation
  const dispatchedChannels: ("EMAIL" | "WHATSAPP")[] = [];
  let emailDest: string | null = null;
  let phoneDest: string | null = null;

  if (config.canalEmail === 1) {
    const dest = params.overrideEmail || config.emailDestino;
    if (dest && dest.trim().length > 0) {
      dispatchedChannels.push("EMAIL");
      emailDest = dest.trim();
    }
  }

  if (config.canalWhatsapp === 1) {
    const dest = params.overrideWhatsapp || config.telefonoWhatsapp;
    if (dest && dest.trim().length > 0) {
      dispatchedChannels.push("WHATSAPP");
      phoneDest = dest.trim();
    }
  }

  if (dispatchedChannels.length === 0) {
    return {
      success: false,
      reason: "NO_ACTIVE_CHANNELS",
      dispatchedChannels: [],
    };
  }

  const severidad: AlertSeverity = params.severidad || "MEDIA";

  // 4. Formatted console logging
  const formattedLog = formatAlertConsoleLog(params, { emailDest, phoneDest, severidad });
  console.log(formattedLog);

  // 5. Persist record
  const canalStr = dispatchedChannels.length === 2 ? "AMBOS" : dispatchedChannels[0];
  const now = new Date();
  let logId = mockLogIdCounter++;

  const newLog: AlertLog = {
    id: logId,
    empresaId: params.empresaId,
    modulo: params.modulo,
    tipo: params.tipo,
    severidad,
    titulo: params.titulo,
    mensaje: params.mensaje,
    canal: canalStr,
    destinatarioEmail: emailDest,
    destinatarioWhatsapp: phoneDest,
    vehiculoId: params.vehiculoId ?? null,
    patente: params.patente ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    estado: "MOCK_DISPATCHED",
    createdAt: now,
  };

  if (isDbAvailable()) {
    try {
      const [inserted] = await db
        .insert(alertLogs)
        .values({
          empresaId: params.empresaId,
          modulo: params.modulo,
          tipo: params.tipo,
          severidad,
          titulo: params.titulo,
          mensaje: params.mensaje,
          canal: canalStr,
          destinatarioEmail: emailDest,
          destinatarioWhatsapp: phoneDest,
          vehiculoId: params.vehiculoId ?? null,
          patente: params.patente ?? null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          estado: "MOCK_DISPATCHED",
        })
        .returning();

      if (inserted) {
        newLog.id = inserted.id;
        newLog.createdAt = inserted.createdAt;
      }
    } catch {
      // Database connection or table unavailable, fallback to mockAlertLogs
    }
  }

  mockAlertLogs.unshift(newLog);

  return {
    success: true,
    dispatchedChannels,
    destinatarioEmail: emailDest,
    destinatarioWhatsapp: phoneDest,
    logId: newLog.id,
    loggedAt: newLog.createdAt,
  };
}

export async function getAlertLogs(filters?: AlertFilterOptions): Promise<AlertLog[]> {
  if (isDbAvailable()) {
    try {
      const conditions = [];
      if (filters?.empresaId) {
        conditions.push(eq(alertLogs.empresaId, filters.empresaId));
      }
      if (filters?.patente) {
        conditions.push(eq(alertLogs.patente, filters.patente));
      }
      if (filters?.modulo) {
        conditions.push(eq(alertLogs.modulo, filters.modulo));
      }
      if (filters?.severidad) {
        conditions.push(eq(alertLogs.severidad, filters.severidad));
      }
      if (filters?.canal) {
        conditions.push(eq(alertLogs.canal, filters.canal));
      }
      if (filters?.search) {
        const s = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(alertLogs.titulo, s),
            ilike(alertLogs.mensaje, s),
            ilike(alertLogs.patente, s),
            ilike(alertLogs.destinatarioEmail, s),
            ilike(alertLogs.destinatarioWhatsapp, s)
          )
        );
      }

      const rows = await db
        .select()
        .from(alertLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alertLogs.createdAt));

      if (rows && rows.length > 0) {
        return rows;
      }
      return filterMockAlertLogs(mockAlertLogs, filters);
    } catch {
      return filterMockAlertLogs(mockAlertLogs, filters);
    }
  }

  return filterMockAlertLogs(mockAlertLogs, filters);
}
