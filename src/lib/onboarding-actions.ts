"use server";

import { db } from "@/db";
import {
  empresas,
  vehicles,
  users,
  alertConfigs,
  maintenancePlans,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getEffectiveTenantContext } from "./impersonation";
import { logAudit } from "./audit";

export interface TenantOnboardingStep {
  id: "alerts" | "vehicles" | "users" | "maintenance";
  title: string;
  description: string;
  completed: boolean;
  href: string;
  actionLabel: string;
  badgeText?: string;
}

export interface TenantOnboardingStatus {
  isCompleted: boolean;
  progressPercent: number;
  empresaNombre: string;
  empresaId: number;
  completedStepsCount: number;
  totalStepsCount: number;
  steps: {
    alerts: boolean;
    vehicles: boolean;
    users: boolean;
    maintenance: boolean;
  };
  stepItems: TenantOnboardingStep[];
  counts: {
    vehicles: number;
    users: number;
    hasAlertConfig: boolean;
    maintenancePlans: number;
  };
}

/**
 * Fetches the interactive onboarding & setup status for the active tenant.
 * Supports ADMIN_EMPRESA and SUPER_ADMIN in impersonation mode.
 */
export async function getTenantOnboardingStatus(): Promise<TenantOnboardingStatus | null> {
  try {
    const context = await getEffectiveTenantContext();
    if (!context.empresaId) {
      return null;
    }

    const empresaId = context.empresaId;

    // 1. Query empresa by ID
    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, empresaId));

    if (!empresa) {
      return null;
    }

    // 2. Query vehicles count
    const [vehiclesResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.empresaId, empresaId));
    const vehicleCount = Number(vehiclesResult?.count ?? 0);

    // 3. Query users count (drivers/team members)
    const [usersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.empresaId, empresaId));
    const userCount = Number(usersResult?.count ?? 0);

    // 4. Query alertConfigs
    const [alertConfig] = await db
      .select()
      .from(alertConfigs)
      .where(eq(alertConfigs.empresaId, empresaId));

    const hasAlertConfig = Boolean(
      alertConfig &&
        ((alertConfig.emailDestino && alertConfig.emailDestino.trim().length > 0) ||
          (alertConfig.telefonoWhatsapp && alertConfig.telefonoWhatsapp.trim().length > 0))
    );

    // 5. Query maintenancePlans count
    const [plansResult] = await db
      .select({ count: count() })
      .from(maintenancePlans)
      .innerJoin(vehicles, eq(maintenancePlans.vehicleId, vehicles.id))
      .where(eq(vehicles.empresaId, empresaId));
    const maintenancePlansCount = Number(plansResult?.count ?? 0);

    // Calculate step completions:
    // 1. alerts: Alertas WhatsApp / Email configuradas
    const isAlertsCompleted = hasAlertConfig;

    // 2. vehicles: Cargar primeros vehículos
    const isVehiclesCompleted = vehicleCount > 0;

    // 3. users: Choferes o equipo asignado (admin + at least 1 other user)
    const isUsersCompleted = userCount > 1;

    // 4. maintenance: Mantenimiento preventivo (planes creados o vehículos con ficha)
    const isMaintenanceCompleted = maintenancePlansCount > 0 || vehicleCount > 0;

    const steps = {
      alerts: isAlertsCompleted,
      vehicles: isVehiclesCompleted,
      users: isUsersCompleted,
      maintenance: isMaintenanceCompleted,
    };

    const stepItems: TenantOnboardingStep[] = [
      {
        id: "alerts",
        title: "Canales de Alerta",
        description: "WhatsApp y Email para avisos de service y vencimientos.",
        completed: isAlertsCompleted,
        href: "/dashboard/administracion/configuracion",
        actionLabel: isAlertsCompleted ? "Ver canales" : "Configurar canales",
        badgeText: isAlertsCompleted ? "Canales listos" : "Pendiente",
      },
      {
        id: "vehicles",
        title: "Flota de Vehículos",
        description: "Cargar vehículos o importar planilla Excel.",
        completed: isVehiclesCompleted,
        href: "/dashboard/control-flota/vehiculos",
        actionLabel: isVehiclesCompleted ? "Gestionar flota" : "Cargar vehículos",
        badgeText: vehicleCount > 0 ? `${vehicleCount} ${vehicleCount === 1 ? "unidad" : "unidades"}` : "Sin unidades",
      },
      {
        id: "users",
        title: "Equipo y Choferes",
        description: "Asignar responsables y choferes de unidad.",
        completed: isUsersCompleted,
        href: "/dashboard/administracion/usuarios",
        actionLabel: isUsersCompleted ? "Ver equipo" : "Invitar choferes",
        badgeText: userCount > 1 ? `${userCount} usuarios` : "1 usuario",
      },
      {
        id: "maintenance",
        title: "Mantenimiento Preventivo",
        description: "Reglas de cambio de aceite, neumáticos y frenos.",
        completed: isMaintenanceCompleted,
        href: "/dashboard/control-flota/mantenimiento",
        actionLabel: isMaintenanceCompleted ? "Ver planes" : "Configurar reglas",
        badgeText: maintenancePlansCount > 0 ? `${maintenancePlansCount} planes` : (vehicleCount > 0 ? "Fichas activas" : "Pendiente"),
      },
    ];

    const completedStepsCount =
      (isAlertsCompleted ? 1 : 0) +
      (isVehiclesCompleted ? 1 : 0) +
      (isUsersCompleted ? 1 : 0) +
      (isMaintenanceCompleted ? 1 : 0);

    const totalStepsCount = 4;
    const progressPercent = Math.round((completedStepsCount / totalStepsCount) * 100);

    return {
      isCompleted: empresa.setupCompletado === 1,
      progressPercent,
      empresaNombre: empresa.nombre,
      empresaId: empresa.id,
      completedStepsCount,
      totalStepsCount,
      steps,
      stepItems,
      counts: {
        vehicles: vehicleCount,
        users: userCount,
        hasAlertConfig,
        maintenancePlans: maintenancePlansCount,
      },
    };
  } catch (error) {
    console.error("Error in getTenantOnboardingStatus:", error);
    return null;
  }
}

/**
 * Marks the onboarding setup as completed for the current effective tenant.
 */
export async function completeTenantSetup(): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getEffectiveTenantContext();
    if (!context.empresaId) {
      return { success: false, error: "No hay empresa activa seleccionada" };
    }

    await db
      .update(empresas)
      .set({ setupCompletado: 1 })
      .where(eq(empresas.id, context.empresaId));

    await logAudit("UPDATE", "empresa", context.empresaId, {
      action: "complete_onboarding_setup",
      empresaNombre: context.empresaNombre,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/monitoreo/dashboard");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Error completing tenant setup:", error);
    return { success: false, error: error.message || "Error al completar el setup" };
  }
}

/**
 * Re-opens the onboarding setup for the current effective tenant.
 */
export async function reopenTenantSetup(): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getEffectiveTenantContext();
    if (!context.empresaId) {
      return { success: false, error: "No hay empresa activa seleccionada" };
    }

    await db
      .update(empresas)
      .set({ setupCompletado: 0 })
      .where(eq(empresas.id, context.empresaId));

    await logAudit("UPDATE", "empresa", context.empresaId, {
      action: "reopen_onboarding_setup",
      empresaNombre: context.empresaNombre,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/monitoreo/dashboard");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Error reopening tenant setup:", error);
    return { success: false, error: error.message || "Error al reabrir el setup" };
  }
}
