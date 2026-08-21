# Multi-Tenant Empresa Creation, Impersonation & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete manual tenant (empresa) creation flow in SuperAdmin with initial administrator credentials, mandatory password change on first login, seamless SuperAdmin impersonation (Superpoderes) via secure tenant context cookies, a 360° tenant management drawer, and an interactive onboarding setup card for company administrators.

**Architecture:** Next.js 14+ App Router with NextAuth v5 JWT sessions and Drizzle ORM on PostgreSQL. A secure HTTP-only cookie (`trackops_impersonate_tenant_id`) allows SuperAdmins to impersonate any company across all dashboard routes with a sticky top banner and instant exit. The company administrator creation is an atomic operation provisioning the company, initial subscription, alert configs, and an `ADMIN_EMPRESA` user flagged with `mustChangePassword = 1`.

**Tech Stack:** Next.js 14+ App Router, TypeScript, Drizzle ORM, NextAuth.js v5 (Auth.js), bcryptjs, Tailwind CSS, Lucide React, Radix UI / Shadcn.

## Global Constraints

- **Design System**: Dark/Light mode support, warm monochrome & slate tones, crisp typography, no heavy generic AI templates, smooth animations.
- **Tenant Isolation**: Queries and server actions must respect `getEffectiveTenantId()` resolving `session.user.empresaId` or `impersonated_tenant_id` for `SUPER_ADMIN`.
- **Security**: Passwords hashed with `bcryptjs` (salt 10). Initial credentials require forced password change (`mustChangePassword = 1`) on first login before accessing normal dashboard features.

---

### Task 1: Schema Updates for Empresas, Users & Migrations

**Files:**
- Modify: `src/db/schema.ts:29-48`
- Test: `src/db/schema.ts` (type checks via `npx tsc --noEmit`)

**Interfaces:**
- Consumes: Drizzle pgTable definitions.
- Produces: Updated `empresas` (added `email`, `telefono`, `direccion`, `ciudad`, `provincia`, `setupCompletado`) and `users` (added `mustChangePassword`).

- [ ] **Step 1: Update `empresas` and `users` schemas in `src/db/schema.ts`**

```typescript
export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cuit: varchar("cuit", { length: 20 }),
  email: text("email"),
  telefono: varchar("telefono", { length: 50 }),
  direccion: text("direccion"),
  ciudad: text("ciudad"),
  provincia: text("provincia"),
  setupCompletado: integer("setup_completado").default(0).notNull(), // 0 = pendiente, 1 = completado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 30 }).default("CHOFER").notNull(), // SUPER_ADMIN, ADMIN_EMPRESA, CHOFER, VENDEDOR_INSTALADOR
  empresaId: integer("empresa_id").references(() => empresas.id),
  mustChangePassword: integer("must_change_password").default(0).notNull(), // 1 = debe cambiar contraseña en 1er login
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Run type check to ensure schema compatibility**

Run: `npx tsc --noEmit`
Expected: PASS with no schema typing errors.

- [ ] **Step 3: Commit schema updates**

```bash
git add src/db/schema.ts
git commit -m "feat(db): add company details and mustChangePassword flag to schema"
```

---

### Task 2: Auth Session Updates & Forced Password Change on First Login

**Files:**
- Modify: `src/auth.config.ts`
- Modify: `src/auth.ts`
- Create: `src/lib/auth-actions.ts`
- Create: `src/components/auth/ForcePasswordChangeModal.tsx`
- Modify: `src/app/dashboard/layout.tsx`

**Interfaces:**
- Consumes: NextAuth session, Drizzle `users` table.
- Produces: `mustChangePassword` in session JWT, Server Action `changeInitialPassword(formData)`, and UI modal `ForcePasswordChangeModal`.

- [ ] **Step 1: Expose `mustChangePassword` in NextAuth JWT & Session callbacks**

In `src/auth.config.ts`:
```typescript
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
    token.empresaId = user.empresaId;
    token.id = user.id;
    token.mustChangePassword = (user as any).mustChangePassword ?? 0;
  }
  return token;
},
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.id as string;
    session.user.role = token.role as string;
    session.user.empresaId = token.empresaId as number | undefined;
    (session.user as any).mustChangePassword = (token.mustChangePassword as number) ?? 0;
  }
  return session;
}
```

- [ ] **Step 2: Create Server Action `changeInitialPassword` in `src/lib/auth-actions.ts`**

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function changeInitialPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("Las contraseñas no coinciden");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: hash,
      mustChangePassword: 0,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard");
  return { success: true };
}
```

- [ ] **Step 3: Create `ForcePasswordChangeModal.tsx` with professional password strength meter & validation**

Location: `src/components/auth/ForcePasswordChangeModal.tsx`
Includes:
- Password strength score (0-100%) with colored bar (Red -> Amber -> Emerald).
- Checklist for: Min 8 chars, 1 number, 1 uppercase.
- Dual password inputs with Show/Hide visibility icons.
- Non-dismissible backdrop when `mustChangePassword === 1`.
- Loading spinner and error alerts.

- [ ] **Step 4: Mount `ForcePasswordChangeModal` in `src/app/dashboard/layout.tsx`**

- [ ] **Step 5: Run typecheck and verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit Auth and Password Change module**

```bash
git add src/auth.config.ts src/auth.ts src/lib/auth-actions.ts src/components/auth/ForcePasswordChangeModal.tsx src/app/dashboard/layout.tsx
git commit -m "feat(auth): implement mandatory password change on first login with strength indicator"
```

---

### Task 3: SuperAdmin Impersonation Engine (Modo Superpoderes)

**Files:**
- Create: `src/lib/impersonation.ts`
- Modify: `src/lib/admin-actions.ts`
- Create: `src/components/layout/SuperadminImpersonationBanner.tsx`
- Modify: `src/app/dashboard/layout.tsx`

**Interfaces:**
- Consumes: Next.js cookies, NextAuth session, Drizzle `empresas`.
- Produces: `getEffectiveTenantContext()`, `enterTenantAsSuperadmin(empresaId)`, `exitSuperadminImpersonation()`, and persistent UI top banner.

- [ ] **Step 1: Create `src/lib/impersonation.ts` with cookie-backed tenant switching**

```typescript
"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { empresas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { logAudit } from "./audit";

const IMPERSONATE_COOKIE = "trackops_impersonate_tenant_id";

export async function getEffectiveTenantContext() {
  const session = await auth();
  if (!session?.user) return null;

  const cookieStore = cookies();
  const impersonatedCookie = cookieStore.get(IMPERSONATE_COOKIE)?.value;

  if (session.user.role === "SUPER_ADMIN" && impersonatedCookie) {
    const tenantId = parseInt(impersonatedCookie);
    if (!isNaN(tenantId)) {
      const [empresa] = await db
        .select()
        .from(empresas)
        .where(eq(empresas.id, tenantId));
      if (empresa) {
        return {
          empresaId: empresa.id,
          empresaNombre: empresa.nombre,
          isImpersonating: true,
          superadminUser: session.user,
        };
      }
    }
  }

  return {
    empresaId: session.user.empresaId || null,
    empresaNombre: null,
    isImpersonating: false,
    superadminUser: null,
  };
}

export async function enterTenantAsSuperadmin(empresaId: number) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const [empresa] = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId));

  if (!empresa) throw new Error("Empresa no encontrada");

  cookies().set(IMPERSONATE_COOKIE, empresaId.toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  await logAudit("IMPERSONATE", "empresa", empresaId, {
    action: "enter_superpoderes",
    empresaNombre: empresa.nombre,
    superadminEmail: session.user.email,
  });

  redirect("/dashboard/monitoreo/dashboard");
}

export async function exitSuperadminImpersonation() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  cookies().delete(IMPERSONATE_COOKIE);
  redirect("/dashboard/superadmin/clientes");
}
```

- [ ] **Step 2: Create `SuperadminImpersonationBanner.tsx` component**

Location: `src/components/layout/SuperadminImpersonationBanner.tsx`
Includes:
- Sticky amber/gold header with pulsing lightning icon.
- Displays `⚡ MODO SUPERPODERES: Viendo como [Nombre de Empresa] (ID #[ID])`.
- Quick-action buttons: "Configuración de Empresa" and "Salir y Volver a Superadmin".
- Interactive exit action calling `exitSuperadminImpersonation()`.

- [ ] **Step 3: Integrate banner and tenant context into `src/app/dashboard/layout.tsx`**

- [ ] **Step 4: Run typecheck and verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit Superadmin Impersonation Engine**

```bash
git add src/lib/impersonation.ts src/lib/admin-actions.ts src/components/layout/SuperadminImpersonationBanner.tsx src/app/dashboard/layout.tsx
git commit -m "feat(superadmin): implement full impersonation mode with persistent banner and cookie context"
```

---

### Task 4: Atomic Multi-Tenant Company Creation Form & Credentials Modal

**Files:**
- Modify: `src/lib/admin-actions.ts`
- Modify: `src/components/superadmin/empresa-form-dialog.tsx`
- Create: `src/components/superadmin/empresa-created-dialog.tsx`
- Modify: `src/components/superadmin/clientes-table.tsx`

**Interfaces:**
- Consumes: `subscriptionPlans`, `empresas`, `users`, `alertConfigs`.
- Produces: Server action `createEmpresaWithAdminAndPlan`, updated `EmpresaFormDialog`, and `EmpresaCreatedDialog`.

- [ ] **Step 1: Implement `createEmpresaWithAdminAndPlan` in `src/lib/admin-actions.ts`**

Includes:
- Transaction creation: `empresas` + `users` (`ADMIN_EMPRESA`, `mustChangePassword = 1`, bcrypt hash) + `empresaSubscriptions` + `alertConfigs` + `auditLogs`.
- Returns created enterprise details and raw credentials for 1-time display.

- [ ] **Step 2: Update `EmpresaFormDialog.tsx` to collect Company Details, Plan, and Admin User Credentials**

Sections in Form:
1. **Datos de la Empresa**: Razón social, CUIT, Email notificaciones, Teléfono/WhatsApp, Ubicación (Dirección/Ciudad/Provincia).
2. **Plan y Términos**: Selector de Plan (Starter, Pro, Enterprise), Frecuencia (Mensual/Anual), Cobro inicial.
3. **Credenciales del Administrador**: Nombre, Email de acceso, Contraseña inicial con confirmación y toggle ver/ocultar.

- [ ] **Step 3: Create `EmpresaCreatedDialog.tsx` (Confirmation & WhatsApp/Email Copy Card)**

Features:
- Success checkmark with smooth animation.
- Copyable credentials snippet formatted for WhatsApp and Email.
- Action buttons: "Copiar Credenciales", "⚡ Entrar con Superpoderes", "Cerrar".

- [ ] **Step 4: Run typecheck and verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit Company Creation & Credentials Dialog**

```bash
git add src/lib/admin-actions.ts src/components/superadmin/empresa-form-dialog.tsx src/components/superadmin/empresa-created-dialog.tsx src/components/superadmin/clientes-table.tsx
git commit -m "feat(superadmin): add complete company & admin user creation flow with copyable credentials modal"
```

---

### Task 5: 360° Tenant Detail Sheet & Emergency Password Reset in SuperAdmin

**Files:**
- Create: `src/components/superadmin/empresa-detail-sheet.tsx`
- Create: `src/app/api/superadmin/empresas/[id]/detail/route.ts` or Server Action `getEmpresaDetail360(id)`
- Modify: `src/components/superadmin/clientes-table.tsx`

**Interfaces:**
- Consumes: `empresas`, `vehicles`, `users`, `empresaSubscriptions`, `alertConfigs`.
- Produces: `EmpresaDetailSheet` component with tabs (General, Flota, Usuarios, Alertas, Seguridad) and emergency password reset action `resetTenantUserPassword(userId, newPassword)`.

- [ ] **Step 1: Implement `getEmpresaDetail360` and `resetTenantUserPassword` in `src/lib/admin-actions.ts`**

- [ ] **Step 2: Build `src/components/superadmin/empresa-detail-sheet.tsx`**

Tabs:
1. **Resumen General**: CUIT, contacto, dirección, fecha de alta, plan activo, estado de cuenta.
2. **Flota**: Contador de vehículos por tipo (camión, utilitario, bus, auto), odómetros promedio.
3. **Usuarios**: Administradores y choferes con botón **"Resetear Contraseña"** y cambio de rol.
4. **Alertas & Notificaciones**: Canales WhatsApp y Email activos, tolerancia en km y días.
5. **Zona de Control**: Acceso con Superpoderes, Suspensión/Reactivación de cuenta.

- [ ] **Step 3: Connect row click in `ClientesTable.tsx` to open `EmpresaDetailSheet`**

- [ ] **Step 4: Run typecheck and verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit 360° Tenant Detail Sheet**

```bash
git add src/lib/admin-actions.ts src/components/superadmin/empresa-detail-sheet.tsx src/components/superadmin/clientes-table.tsx
git commit -m "feat(superadmin): add 360 tenant detail sheet with emergency password reset and fleet overview"
```

---

### Task 6: Tenant Interactive Onboarding & Setup Card

**Files:**
- Create: `src/components/dashboard/onboarding-setup-card.tsx`
- Create: `src/lib/onboarding-actions.ts`
- Modify: `src/app/dashboard/monitoreo/dashboard/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `empresas.setupCompletado`, `vehicles`, `alertConfigs`, `users`.
- Produces: `OnboardingSetupCard` component and `dismissOnboarding()`, `completeTenantSetup()` server actions.

- [ ] **Step 1: Implement `src/lib/onboarding-actions.ts`**

Functions:
- `getTenantOnboardingStatus()`: Evaluates completed steps (Alerts configured, At least 1 vehicle created, Drivers created, Maintenance plans defined).
- `completeTenantSetup()`: Sets `empresas.setupCompletado = 1`.

- [ ] **Step 2: Create `OnboardingSetupCard.tsx`**

Features:
- Dynamic checklist with real-time detection:
  - Step 1: Configurar Canales de Alerta (WhatsApp / Email).
  - Step 2: Cargar Primer Vehículo (Formulario o Importador Excel).
  - Step 3: Agregar Choferes / Personal.
  - Step 4: Matriz de Mantenimiento Preventivo.
- Interactive progress bar (0% - 100%) with completion celebration.
- Direct quick-links to each section.
- Option to minimize or mark setup as completed.

- [ ] **Step 3: Embed `OnboardingSetupCard` in company dashboards**

- [ ] **Step 4: Run typecheck and verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit Onboarding Setup Card**

```bash
git add src/lib/onboarding-actions.ts src/components/dashboard/onboarding-setup-card.tsx src/app/dashboard/monitoreo/dashboard/page.tsx src/app/dashboard/page.tsx
git commit -m "feat(onboarding): implement interactive tenant setup checklist card on dashboard"
```

---

### Task 7: Full System Integration, Build Verification & Quality Assurance

**Files:**
- All modified and newly created files.

- [ ] **Step 1: Run full TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run Next.js build test**

Run: `npm run build`
Expected: Build succeeds with all routes compiled.

- [ ] **Step 3: Manual & Automated Verification Checklist**
1. SuperAdmin creates a new company with CUIT, contact details, plan, and initial admin credentials.
2. SuperAdmin receives confirmation modal with copyable WhatsApp/Email message.
3. SuperAdmin clicks "Superpoderes" and instantly enters the new company with active top banner.
4. Company Admin logs in for the first time at `/auth/login`: forced password modal appears.
5. Company Admin sets new password: flag clears, and interactive onboarding checklist appears on dashboard.
6. SuperAdmin can view 360° sheet and perform emergency password resets.

- [ ] **Step 4: Final commit and cleanup**

```bash
git add .
git commit -m "feat: complete multi-tenant company creation, impersonation, first login password change and onboarding"
```
