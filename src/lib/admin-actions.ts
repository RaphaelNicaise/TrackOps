"use server";
import { db } from "@/db";
import {
  empresas,
  subscriptionPlans,
  empresaSubscriptions,
  alertConfigs,
  users,
  gpsInstallations,
  vehicles,
} from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { logAudit } from "./audit";
import bcrypt from "bcryptjs";
import {
  enterTenantAsSuperadmin,
  exitSuperadminImpersonation,
  getEffectiveTenantContext,
} from "./impersonation";

export { enterTenantAsSuperadmin, exitSuperadminImpersonation, getEffectiveTenantContext };

// ═══════════ EMPRESAS ═══════════

export async function createEmpresa(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const nombre = formData.get("nombre") as string;
  const cuit = (formData.get("cuit") as string) || null;
  const planIdStr = formData.get("planId") as string | null;

  if (!nombre || nombre.trim() === "") {
    throw new Error("El nombre de la empresa es requerido");
  }

  const [empresa] = await db.insert(empresas).values({
    nombre: nombre.trim(),
    cuit: cuit ? cuit.trim() : null,
  }).returning();

  if (planIdStr) {
    const planId = parseInt(planIdStr);
    if (!isNaN(planId) && planId > 0) {
      await db.insert(empresaSubscriptions).values({
        empresaId: empresa.id,
        planId,
        estado: "activa",
        metodoPago: "transferencia",
      });
    }
  }

  await logAudit("CREATE", "empresa", empresa.id, { nombre: empresa.nombre, cuit });
  revalidatePath("/dashboard/superadmin/clientes");
  revalidatePath("/dashboard");
  return { success: true, empresa };
}

export async function updateEmpresa(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string);
  if (isNaN(id)) throw new Error("ID de empresa inválido");

  const nombre = formData.get("nombre") as string;
  const cuit = (formData.get("cuit") as string) || null;
  const planIdStr = formData.get("planId") as string | null;
  const estado = formData.get("estado") as string | null;

  await db.update(empresas).set({
    nombre: nombre.trim(),
    cuit: cuit ? cuit.trim() : null,
  }).where(eq(empresas.id, id));

  if (planIdStr) {
    const planId = parseInt(planIdStr);
    if (!isNaN(planId) && planId > 0) {
      const existingSub = await db
        .select()
        .from(empresaSubscriptions)
        .where(eq(empresaSubscriptions.empresaId, id));

      if (existingSub.length > 0) {
        await db.update(empresaSubscriptions).set({
          planId,
          estado: estado || existingSub[0].estado,
        }).where(eq(empresaSubscriptions.id, existingSub[0].id));
      } else {
        await db.insert(empresaSubscriptions).values({
          empresaId: id,
          planId,
          estado: estado || "activa",
          metodoPago: "transferencia",
        });
      }
    }
  }

  await logAudit("UPDATE", "empresa", id, { nombre, cuit });
  revalidatePath("/dashboard/superadmin/clientes");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleEmpresaStatus(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const empresaId = parseInt(formData.get("empresaId") as string);
  const nuevoEstado = formData.get("estado") as "activa" | "suspendida" | "cancelada";

  if (isNaN(empresaId) || !nuevoEstado) {
    throw new Error("Parámetros inválidos para cambiar estado");
  }

  const existingSub = await db
    .select()
    .from(empresaSubscriptions)
    .where(eq(empresaSubscriptions.empresaId, empresaId));

  if (existingSub.length > 0) {
    await db.update(empresaSubscriptions).set({
      estado: nuevoEstado,
    }).where(eq(empresaSubscriptions.id, existingSub[0].id));
  } else {
    // Si no tenía suscripción registrada, asignar plan por defecto y estado
    const [defaultPlan] = await db.select().from(subscriptionPlans).limit(1);
    const planId = defaultPlan?.id || 1;
    await db.insert(empresaSubscriptions).values({
      empresaId,
      planId,
      estado: nuevoEstado,
      metodoPago: "transferencia",
    });
  }

  await logAudit("UPDATE", "empresa_status", empresaId, { estado: nuevoEstado });
  revalidatePath("/dashboard/superadmin/clientes");
  revalidatePath("/dashboard");
  return { success: true, estado: nuevoEstado };
}

export async function superpoderesAccessTenant(empresaId: number) {
  return await enterTenantAsSuperadmin(empresaId);
}

// ═══════════ SUSCRIPCIONES ═══════════

export async function createSubscriptionPlan(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const [plan] = await db.insert(subscriptionPlans).values({
    nombre: formData.get("nombre") as string,
    maxVehiculos: parseInt(formData.get("maxVehiculos") as string),
    precioMensual: parseFloat(formData.get("precioMensual") as string),
    precioAnual: formData.get("precioAnual") ? parseFloat(formData.get("precioAnual") as string) : null,
  }).returning();

  await logAudit("CREATE", "subscriptionPlan", plan.id, { nombre: plan.nombre });
  revalidatePath("/dashboard/superadmin/suscripciones");
}

export async function assignSubscription(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const empresaId = parseInt(formData.get("empresaId") as string);
  const planId = parseInt(formData.get("planId") as string);

  const [sub] = await db.insert(empresaSubscriptions).values({
    empresaId,
    planId,
    estado: "activa",
    metodoPago: formData.get("metodoPago") as string || "transferencia",
  }).returning();

  await logAudit("CREATE", "subscription", sub.id, { empresaId, planId });
  revalidatePath("/dashboard/superadmin/empresas");
}

// ═══════════ ALERTAS CONFIG ═══════════

export async function saveAlertConfig(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa");

  const empresaId = session.user.empresaId;

  // Upsert: check if config exists
  const existing = await db.select().from(alertConfigs).where(eq(alertConfigs.empresaId, empresaId));

  const data = {
    empresaId,
    canalEmail: formData.get("canalEmail") === "on" ? 1 : 0,
    canalWhatsapp: formData.get("canalWhatsapp") === "on" ? 1 : 0,
    emailDestino: formData.get("emailDestino") as string || null,
    telefonoWhatsapp: formData.get("telefonoWhatsapp") as string || null,
    toleranciaKm: parseInt(formData.get("toleranciaKm") as string) || 500,
    toleranciaDias: parseInt(formData.get("toleranciaDias") as string) || 15,
    activo: formData.get("activo") === "on" ? 1 : 0,
  };

  if (existing.length > 0) {
    await db.update(alertConfigs).set(data).where(eq(alertConfigs.empresaId, empresaId));
    await logAudit("UPDATE", "alertConfig", existing[0].id, data);
  } else {
    const [cfg] = await db.insert(alertConfigs).values(data).returning();
    await logAudit("CREATE", "alertConfig", cfg.id, data);
  }

  revalidatePath("/dashboard/alertas");
}

// ═══════════ USERS / PERSONAL ═══════════

export async function createUser(formData: FormData) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN_EMPRESA") throw new Error("Unauthorized");

  const password = formData.get("password") as string;
  const hash = await bcrypt.hash(password, 10);

  const [user] = await db.insert(users).values({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    passwordHash: hash,
    role: formData.get("role") as string || "CHOFER",
    empresaId: session?.user?.empresaId || parseInt(formData.get("empresaId") as string) || null,
  }).returning();

  await logAudit("CREATE", "user", user.id, { name: user.name, role: user.role });
  revalidatePath("/dashboard/configuracion/usuarios");
  revalidatePath("/dashboard/personal");
}

// ═══════════ GPS INSTALLATIONS (VENDEDOR/INSTALADOR) ═══════════

export async function createGpsInstallation(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [install] = await db.insert(gpsInstallations).values({
    vehicleId: parseInt(formData.get("vehicleId") as string),
    instaladorId: session.user.id,
    dispositivoModelo: formData.get("dispositivoModelo") as string,
    dispositivoSerial: formData.get("dispositivoSerial") as string,
    estado: "pendiente",
    notas: formData.get("notas") as string || null,
  }).returning();

  await logAudit("CREATE", "gpsInstallation", install.id, { vehicleId: install.vehicleId });
  revalidatePath("/dashboard/instalaciones");
}

export async function updateGpsInstallationStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string);
  const estado = formData.get("estado") as string;

  await db.update(gpsInstallations).set({
    estado,
    fechaInstalacion: estado === "instalado" ? new Date() : undefined,
  }).where(eq(gpsInstallations.id, id));

  await logAudit("UPDATE", "gpsInstallation", id, { estado });
  revalidatePath("/dashboard/instalaciones");
}
