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
import { EmpresaDetail360Data } from "@/types/admin";

export { enterTenantAsSuperadmin, exitSuperadminImpersonation, getEffectiveTenantContext };

// ═══════════ EMPRESAS ═══════════

export async function createEmpresaWithAdmin(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN");

  const nombre = (formData.get("nombre") as string)?.trim();
  const cuit = (formData.get("cuit") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const direccion = (formData.get("direccion") as string)?.trim() || null;
  const ciudad = (formData.get("ciudad") as string)?.trim() || null;
  const provincia = (formData.get("provincia") as string)?.trim() || null;
  const planIdStr = formData.get("planId") as string | null;

  const adminNombre = (formData.get("adminNombre") as string)?.trim();
  const adminEmail = (formData.get("adminEmail") as string)?.trim();
  const adminPassword = (formData.get("adminPassword") as string)?.trim();

  if (!nombre) {
    throw new Error("El nombre de la empresa es requerido");
  }
  if (!adminNombre) {
    throw new Error("El nombre del administrador es requerido");
  }
  if (!adminEmail) {
    throw new Error("El email del administrador es requerido");
  }
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("La contraseña del administrador debe tener al menos 8 caracteres");
  }

  // Check if admin email already exists
  const existingUser = await db.select().from(users).where(eq(users.email, adminEmail));
  if (existingUser.length > 0) {
    throw new Error(`El email "${adminEmail}" ya está registrado para otro usuario.`);
  }

  // Hash password
  const hash = await bcrypt.hash(adminPassword, 10);

  // 1. Insert empresa
  const [empresa] = await db.insert(empresas).values({
    nombre,
    cuit,
    email,
    telefono,
    direccion,
    ciudad,
    provincia,
    setupCompletado: 0,
  }).returning();

  // 2. Insert admin user
  const [adminUser] = await db.insert(users).values({
    name: adminNombre,
    email: adminEmail,
    passwordHash: hash,
    role: "ADMIN_EMPRESA",
    empresaId: empresa.id,
    mustChangePassword: 1,
  }).returning();

  // 3. Insert subscription
  let planId = 1;
  if (planIdStr) {
    const parsed = parseInt(planIdStr);
    if (!isNaN(parsed) && parsed > 0) {
      planId = parsed;
    }
  }

  await db.insert(empresaSubscriptions).values({
    empresaId: empresa.id,
    planId,
    estado: "activa",
    metodoPago: "transferencia",
  });

  // 4. Insert alertConfigs
  await db.insert(alertConfigs).values({
    empresaId: empresa.id,
    emailDestino: email || adminEmail,
    telefonoWhatsapp: telefono ? telefono.slice(0, 20) : null,
    canalEmail: 1,
    canalWhatsapp: telefono ? 1 : 0,
    activo: 1,
  });

  // 5. Log audit
  await logAudit("CREATE", "empresa_with_admin", empresa.id, {
    nombre,
    adminEmail,
    planId,
  });

  revalidatePath("/panel/superadmin/clientes");
  revalidatePath("/panel");

  return {
    success: true,
    empresa,
    adminUser: { name: adminNombre, email: adminEmail },
    initialPassword: adminPassword,
  };
}

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
  revalidatePath("/panel/superadmin/clientes");
  revalidatePath("/panel");
  return { success: true, empresa };
}

export async function updateEmpresa(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string);
  if (isNaN(id)) throw new Error("ID de empresa inválido");

  const nombre = (formData.get("nombre") as string)?.trim();
  const cuit = (formData.get("cuit") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const direccion = (formData.get("direccion") as string)?.trim() || null;
  const ciudad = (formData.get("ciudad") as string)?.trim() || null;
  const provincia = (formData.get("provincia") as string)?.trim() || null;
  const planIdStr = formData.get("planId") as string | null;
  const estado = formData.get("estado") as string | null;

  if (!nombre) {
    throw new Error("El nombre de la empresa es requerido");
  }

  await db.update(empresas).set({
    nombre,
    cuit,
    email,
    telefono,
    direccion,
    ciudad,
    provincia,
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

  await logAudit("UPDATE", "empresa", id, { nombre, cuit, email, telefono });
  revalidatePath("/panel/superadmin/clientes");
  revalidatePath("/panel");
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
  revalidatePath("/panel/superadmin/clientes");
  revalidatePath("/panel");
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
  revalidatePath("/panel/superadmin/suscripciones");
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
  revalidatePath("/panel/superadmin/empresas");
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

  revalidatePath("/panel/alertas");
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
  revalidatePath("/panel/configuracion/usuarios");
  revalidatePath("/panel/personal");
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
  revalidatePath("/panel/instalaciones");
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
  revalidatePath("/panel/instalaciones");
}

// ═══════════ 360° TENANT DETAIL & USER SECURITY ═══════════

export async function getEmpresaDetail360(empresaId: number): Promise<{
  success: boolean;
  data: EmpresaDetail360Data;
}> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN");
  }

  if (!empresaId || isNaN(empresaId)) {
    throw new Error("ID de empresa inválido");
  }

  // 1. Empresa
  const [empresa] = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);

  if (!empresa) {
    throw new Error(`Empresa #${empresaId} no encontrada`);
  }

  // 2. Subscription with Plan details
  const [subscription] = await db
    .select({
      id: empresaSubscriptions.id,
      empresaId: empresaSubscriptions.empresaId,
      planId: empresaSubscriptions.planId,
      estado: empresaSubscriptions.estado,
      fechaInicio: empresaSubscriptions.fechaInicio,
      fechaFin: empresaSubscriptions.fechaFin,
      metodoPago: empresaSubscriptions.metodoPago,
      createdAt: empresaSubscriptions.createdAt,
      planNombre: subscriptionPlans.nombre,
      maxVehiculos: subscriptionPlans.maxVehiculos,
      precioMensual: subscriptionPlans.precioMensual,
      precioAnual: subscriptionPlans.precioAnual,
    })
    .from(empresaSubscriptions)
    .leftJoin(
      subscriptionPlans,
      eq(empresaSubscriptions.planId, subscriptionPlans.id)
    )
    .where(eq(empresaSubscriptions.empresaId, empresaId))
    .limit(1);

  // 3. Vehicles
  const tenantVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.empresaId, empresaId));

  // 4. Users (excluding password hashes for security)
  const tenantUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.empresaId, empresaId));

  // 5. Alert Config
  const [alertConfig] = await db
    .select()
    .from(alertConfigs)
    .where(eq(alertConfigs.empresaId, empresaId))
    .limit(1);

  return {
    success: true,
    data: {
      empresa,
      subscription: subscription || null,
      vehicles: tenantVehicles,
      users: tenantUsers,
      alertConfig: alertConfig || null,
    },
  };
}

export async function resetTenantUserPassword(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN");
  }

  const userId = (formData.get("userId") as string)?.trim();
  const newPassword = (formData.get("newPassword") as string)?.trim();

  if (!userId) {
    throw new Error("ID de usuario requerido");
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
  }

  const [userToUpdate] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userToUpdate) {
    throw new Error("Usuario no encontrado");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: hash,
      mustChangePassword: 1,
    })
    .where(eq(users.id, userId));

  await logAudit("UPDATE", "user_password_reset_superadmin", userId, {
    userEmail: userToUpdate.email,
    userName: userToUpdate.name,
    empresaId: userToUpdate.empresaId,
    performedBy: session.user.id || session.user.email,
  });

  return { success: true };
}

