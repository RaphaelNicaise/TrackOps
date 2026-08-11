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

// ═══════════ EMPRESAS ═══════════

export async function createEmpresa(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const [empresa] = await db.insert(empresas).values({
    nombre: formData.get("nombre") as string,
    cuit: formData.get("cuit") as string,
  }).returning();

  await logAudit("CREATE", "empresa", empresa.id, { nombre: empresa.nombre });
  revalidatePath("/dashboard");
}

export async function updateEmpresa(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string);
  await db.update(empresas).set({
    nombre: formData.get("nombre") as string,
    cuit: formData.get("cuit") as string,
  }).where(eq(empresas.id, id));

  await logAudit("UPDATE", "empresa", id, { nombre: formData.get("nombre") });
  revalidatePath("/dashboard");
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
