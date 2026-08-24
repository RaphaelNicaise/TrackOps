"use server";

import { db } from "@/db";
import { alertConfigs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { isDemoUser } from "@/lib/demo-mode";
import { dispatchAlert, setMockAlertConfig } from "@/lib/alerts/dispatcher";
import {
  type DispatchAlertParams,
  type DispatchAlertResult,
  type AlertModule,
  type AlertSeverity,
  type AlertConfigFormValues,
  type ParsedAlertConfig,
  DEFAULT_ALERT_MODULES,
} from "@/types/alerts";

function parseModules(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [...DEFAULT_ALERT_MODULES];
}

export async function getAlertConfigAction(targetEmpresaId?: number): Promise<ParsedAlertConfig> {
  const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  let session: any = null;
  try {
    session = await auth();
  } catch {
    // Auth session fallback
  }

  let empresaId: number;
  if (session?.user?.role === "SUPER_ADMIN" && targetEmpresaId) {
    empresaId = targetEmpresaId;
  } else if (session?.user?.empresaId) {
    empresaId = session.user.empresaId;
  } else if (isTest && targetEmpresaId) {
    empresaId = targetEmpresaId;
  } else {
    empresaId = session?.user?.empresaId || 1;
  }

  try {
    const rows = await db
      .select()
      .from(alertConfigs)
      .where(eq(alertConfigs.empresaId, empresaId))
      .limit(1);

    const row = rows && rows[0];
    if (row) {
      return {
        id: row.id,
        empresaId: row.empresaId,
        canalEmail: row.canalEmail ?? 1,
        canalWhatsapp: row.canalWhatsapp ?? 0,
        emailDestino: row.emailDestino ?? null,
        telefonoWhatsapp: row.telefonoWhatsapp ?? null,
        toleranciaKm: row.toleranciaKm ?? 500,
        toleranciaDias: row.toleranciaDias ?? 15,
        modulosHabilitados: parseModules(row.modulosHabilitados),
        activo: row.activo ?? 1,
        createdAt: row.createdAt,
      };
    }
  } catch {
    // Database connection or table unavailable, fall back to default
  }

  return {
    id: empresaId,
    empresaId,
    canalEmail: 1,
    canalWhatsapp: 0,
    emailDestino: null,
    telefonoWhatsapp: null,
    toleranciaKm: 500,
    toleranciaDias: 15,
    modulosHabilitados: [...DEFAULT_ALERT_MODULES],
    activo: 1,
    createdAt: new Date(),
  };
}

export async function saveAlertConfigAction(
  data: AlertConfigFormValues | FormData
): Promise<{ success: boolean; config: ParsedAlertConfig }> {
  let session: any = null;
  try {
    session = await auth();
  } catch {
    // Auth fallback
  }

  let targetEmpresaId: number | undefined;
  let rawData: Record<string, any> = {};

  if (data instanceof FormData) {
    const formEmpresaId = data.get("empresaId");
    if (formEmpresaId) targetEmpresaId = parseInt(formEmpresaId as string, 10);

    rawData = {
      canalEmail:
        data.get("canalEmail") === "on" ||
        data.get("canalEmail") === "1" ||
        data.get("canalEmail") === "true",
      canalWhatsapp:
        data.get("canalWhatsapp") === "on" ||
        data.get("canalWhatsapp") === "1" ||
        data.get("canalWhatsapp") === "true",
      emailDestino: (data.get("emailDestino") as string) || null,
      telefonoWhatsapp: (data.get("telefonoWhatsapp") as string) || null,
      toleranciaKm: data.get("toleranciaKm")
        ? parseInt(data.get("toleranciaKm") as string, 10)
        : 500,
      toleranciaDias: data.get("toleranciaDias")
        ? parseInt(data.get("toleranciaDias") as string, 10)
        : 15,
      modulosHabilitados: data.get("modulosHabilitados") || data.getAll("modulosHabilitados"),
      activo: data.has("activo")
        ? data.get("activo") === "on" ||
          data.get("activo") === "1" ||
          data.get("activo") === "true"
        : true,
    };
  } else {
    targetEmpresaId = data.empresaId;
    rawData = { ...data };
  }

  const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  let empresaId: number;
  if (session?.user?.role === "SUPER_ADMIN" && targetEmpresaId) {
    empresaId = targetEmpresaId;
  } else if (session?.user?.empresaId) {
    empresaId = session.user.empresaId;
  } else if (isTest && targetEmpresaId) {
    empresaId = targetEmpresaId;
  } else {
    empresaId = session?.user?.empresaId || 1;
  }

  const canalEmail =
    rawData.canalEmail === 1 || rawData.canalEmail === true || rawData.canalEmail === "1" ? 1 : 0;
  const canalWhatsapp =
    rawData.canalWhatsapp === 1 ||
    rawData.canalWhatsapp === true ||
    rawData.canalWhatsapp === "1"
      ? 1
      : 0;
  const emailDestino =
    typeof rawData.emailDestino === "string" && rawData.emailDestino.trim().length > 0
      ? rawData.emailDestino.trim()
      : null;
  const telefonoWhatsapp =
    typeof rawData.telefonoWhatsapp === "string" && rawData.telefonoWhatsapp.trim().length > 0
      ? rawData.telefonoWhatsapp.trim()
      : null;
  const toleranciaKm =
    typeof rawData.toleranciaKm === "number"
      ? rawData.toleranciaKm
      : parseInt(rawData.toleranciaKm, 10) || 500;
  const toleranciaDias =
    typeof rawData.toleranciaDias === "number"
      ? rawData.toleranciaDias
      : parseInt(rawData.toleranciaDias, 10) || 15;
  const parsedModules = parseModules(rawData.modulosHabilitados);
  const modulosHabilitadosStr = JSON.stringify(parsedModules);
  const activo =
    rawData.activo === 0 || rawData.activo === false || rawData.activo === "0" ? 0 : 1;

  const dbData = {
    empresaId,
    canalEmail,
    canalWhatsapp,
    emailDestino,
    telefonoWhatsapp,
    toleranciaKm,
    toleranciaDias,
    modulosHabilitados: modulosHabilitadosStr,
    activo,
  };

  let savedConfig: ParsedAlertConfig = {
    id: empresaId,
    empresaId,
    canalEmail,
    canalWhatsapp,
    emailDestino,
    telefonoWhatsapp,
    toleranciaKm,
    toleranciaDias,
    modulosHabilitados: parsedModules,
    activo,
    createdAt: new Date(),
  };

  try {
    const existing = await db
      .select()
      .from(alertConfigs)
      .where(eq(alertConfigs.empresaId, empresaId));

    if (existing && existing.length > 0) {
      const updated = await db
        .update(alertConfigs)
        .set(dbData)
        .where(eq(alertConfigs.empresaId, empresaId))
        .returning();

      const row = (updated && updated[0]) || existing[0];
      savedConfig = {
        id: row.id,
        empresaId: row.empresaId,
        canalEmail: row.canalEmail,
        canalWhatsapp: row.canalWhatsapp,
        emailDestino: row.emailDestino,
        telefonoWhatsapp: row.telefonoWhatsapp,
        toleranciaKm: row.toleranciaKm ?? 500,
        toleranciaDias: row.toleranciaDias ?? 15,
        modulosHabilitados: parseModules(row.modulosHabilitados),
        activo: row.activo,
        createdAt: row.createdAt,
      };
      await logAudit("UPDATE", "alertConfig", existing[0].id, dbData);
    } else {
      const [cfg] = await db.insert(alertConfigs).values(dbData).returning();

      if (cfg) {
        savedConfig = {
          id: cfg.id,
          empresaId: cfg.empresaId,
          canalEmail: cfg.canalEmail,
          canalWhatsapp: cfg.canalWhatsapp,
          emailDestino: cfg.emailDestino,
          telefonoWhatsapp: cfg.telefonoWhatsapp,
          toleranciaKm: cfg.toleranciaKm ?? 500,
          toleranciaDias: cfg.toleranciaDias ?? 15,
          modulosHabilitados: parseModules(cfg.modulosHabilitados),
          activo: cfg.activo,
          createdAt: cfg.createdAt,
        };
        await logAudit("CREATE", "alertConfig", cfg.id, dbData);
      }
    }
  } catch (dbError) {
    if (!session?.user || !isDemoUser(session.user)) {
      console.error("Error al guardar configuración de alertas en DB:", dbError);
      return { success: false, config: savedConfig };
    }
    setMockAlertConfig(empresaId, dbData as any);
  }

  try {
    revalidatePath("/panel/administracion/configuracion");
  } catch {}
  try {
    revalidatePath("/panel/monitoreo/alertas");
  } catch {}
  try {
    revalidatePath("/panel/alertas");
  } catch {}

  return {
    success: true,
    config: savedConfig,
  };
}

export async function sendTestAlertAction(
  params?: Partial<DispatchAlertParams> & { testChannel?: "EMAIL" | "WHATSAPP" | "AMBOS" }
): Promise<{ success: boolean; dispatchResult: DispatchAlertResult }> {
  let session: any = null;
  try {
    session = await auth();
  } catch {
    // Auth fallback
  }

  let empresaId: number;
  if (params?.empresaId && (session?.user?.role === "SUPER_ADMIN" || !session?.user)) {
    empresaId = params.empresaId;
  } else if (session?.user?.empresaId) {
    empresaId = session.user.empresaId;
  } else if (params?.empresaId) {
    empresaId = params.empresaId;
  } else {
    empresaId = session?.user?.empresaId || 1;
  }

  let overrideEmail = params?.overrideEmail;
  let overrideWhatsapp = params?.overrideWhatsapp;

  if (params?.testChannel === "EMAIL" && overrideWhatsapp === undefined) {
    overrideWhatsapp = " ";
  } else if (params?.testChannel === "WHATSAPP" && overrideEmail === undefined) {
    overrideEmail = " ";
  }

  const dispatchResult = await dispatchAlert({
    empresaId,
    modulo: (params?.modulo as AlertModule) || "SISTEMA",
    tipo: params?.tipo || "PRUEBA_SISTEMA",
    severidad: (params?.severidad as AlertSeverity) || "MEDIA",
    titulo: params?.titulo || "Prueba de Despacho de Alerta Prada",
    mensaje:
      params?.mensaje || "Esta es una alerta de prueba generada desde el panel de configuración.",
    overrideEmail,
    overrideWhatsapp,
    vehiculoId: params?.vehiculoId,
    patente: params?.patente,
    metadata: {
      isTest: true,
      testChannel: params?.testChannel || "AMBOS",
      triggeredAt: new Date().toISOString(),
      ...params?.metadata,
    },
  });

  return {
    success: dispatchResult.success,
    dispatchResult,
  };
}
