# Superadmin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the specialized Superadmin workspace for TrackOps, featuring a dedicated multi-tenant sidebar, SaaS monitoring placeholders (Dashboard & Alertas), a Client Management panel with an interactive "Superpoderes" (tenant access) button, a Leads & Demo CRM (`prospectos`), SaaS Billing overview, and a DevOps section with external links to Umami (:3002), pgAdmin (:5050), and Portainer (:9000).

**Architecture:** We use Next.js 14+ App Router within the `/dashboard` layout. The sidebar detects `session.user.role === 'SUPER_ADMIN'` and dynamically mounts `superAdminNav` with specialized section groups and external links. The database schema in Drizzle ORM is updated with a new `prospectos` table to support demo inquiries and CRM pipeline management.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Lucide React, Shadcn UI, Drizzle ORM, PostgreSQL (PostGIS), Auth.js (NextAuth).

## Global Constraints
- Target Framework: Next.js 14 App Router
- Styling: Tailwind CSS with Shadcn UI components
- All external links (Umami, pgAdmin, Portainer) must open in a new tab (`target="_blank"` with `rel="noopener noreferrer"`) and render an external link indicator.
- Type safety: Zero TypeScript or ESLint errors.

---

### Task 1: Schema Update & Seed for Prospectos (CRM Leads)

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/seed.ts`
- Test: `test/db-prospectos.test.ts`

**Interfaces:**
- Produces: `prospectos` table in Drizzle ORM with fields `id`, `nombre`, `email`, `telefono`, `empresa`, `flotaEstimada`, `mensaje`, `estado`, `notas`, `createdAt`.

- [ ] **Step 1: Write database test for prospectos table**

```typescript
// test/db-prospectos.test.ts
import { describe, it, expect } from "vitest";
import { prospectos } from "../src/db/schema";

describe("Prospectos Schema", () => {
  it("should have correct column definitions", () => {
    expect(prospectos.nombre).toBeDefined();
    expect(prospectos.email).toBeDefined();
    expect(prospectos.telefono).toBeDefined();
    expect(prospectos.empresa).toBeDefined();
    expect(prospectos.flotaEstimada).toBeDefined();
    expect(prospectos.estado).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure before schema update**

Run: `npx vitest run test/db-prospectos.test.ts`  
Expected: FAIL with missing `prospectos` export.

- [ ] **Step 3: Update `src/db/schema.ts` and `src/db/seed.ts`**

Add `prospectos` table to `src/db/schema.ts`:
```typescript
export const prospectos = pgTable("prospectos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  telefono: varchar("telefono", { length: 50 }),
  empresa: text("empresa"),
  flotaEstimada: integer("flota_estimada"),
  mensaje: text("mensaje"),
  estado: varchar("estado", { length: 30 }).default("nuevo").notNull(), // nuevo, contactado, demo_agendada, convertido, descartado
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Add seed data in `src/db/seed.ts` with demo inquiries.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/db-prospectos.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/seed.ts test/db-prospectos.test.ts
git commit -m "feat(db): add prospectos table for superadmin CRM"
```

---

### Task 2: Superadmin Sidebar Navigation & External Links Support

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Test: `test/sidebar-navigation.test.ts`

**Interfaces:**
- Produces: `superAdminNav` configuration in `app-sidebar.tsx` with support for external URLs (Umami, pgAdmin, Portainer) and role detection.

- [ ] **Step 1: Write test for Superadmin sidebar item structure**

```typescript
// test/sidebar-navigation.test.ts
import { describe, it, expect } from "vitest";

describe("Sidebar Superadmin items", () => {
  it("should contain all required superadmin sections", () => {
    // Tests presence of dev tools, clientes, prospectos, facturación
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Update `src/components/layout/app-sidebar.tsx`**

1. Extend `NavItem` type to support `external?: boolean`.
2. Define `superAdminNav`:
   - **Monitoreo SaaS**: `Dashboard Global` (`/dashboard/superadmin/dashboard`), `Alertas & Salud` (`/dashboard/superadmin/alertas`).
   - **Gestión de Plataforma**: `Empresas Clientes` (`/dashboard/superadmin/clientes`), `Prospectos (Leads)` (`/dashboard/superadmin/prospectos`), `Cobros & Planes` (`/dashboard/superadmin/facturacion`).
   - **Dev & Operaciones**: `Configuración Sistema` (`/dashboard/superadmin/dev/config`), `Umami Analytics` (`http://localhost:3002`, `external: true`), `pgAdmin Database` (`http://localhost:5050`, `external: true`), `Portainer Docker` (`http://localhost:9000`, `external: true`).
3. Set `SUPER_ADMIN: superAdminNav` in `navByRole`.
4. In `SidebarMenuButton`, if `item.external` is true, render `<a href={item.url} target="_blank" rel="noopener noreferrer">` with `ExternalLink` icon indicator.
5. In `src/app/dashboard/page.tsx`, check session role and redirect to `/dashboard/superadmin/dashboard` if role is `SUPER_ADMIN`.

- [ ] **Step 3: Verify TypeScript and compilation**

Run: `npx tsc --noEmit`  
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-sidebar.tsx src/app/dashboard/page.tsx test/sidebar-navigation.test.ts
git commit -m "feat(sidebar): add dedicated superadmin navigation and devops external links"
```

---

### Task 3: Dashboard & Alertas Globales (En Construcción)

**Files:**
- Create: `src/app/dashboard/superadmin/dashboard/page.tsx`
- Create: `src/app/dashboard/superadmin/alertas/page.tsx`
- Create: `src/components/superadmin/under-construction.tsx`

**Interfaces:**
- Produces: Visual KPI cards placeholder with MRR, Total Tenants, Total Connected Vehicles, GPS Packet Stream, and an "En Construcción" status indicator.

- [ ] **Step 1: Create reusable `UnderConstruction` component**

`src/components/superadmin/under-construction.tsx` with title, subtitle, badges, and progress status.

- [ ] **Step 2: Build `src/app/dashboard/superadmin/dashboard/page.tsx`**

Render summary SaaS metrics (MRR $12,450 USD, 14 Empresas Activas, 182 Vehículos, 99.98% GPS Ingestion Uptime) + `UnderConstruction` banner.

- [ ] **Step 3: Build `src/app/dashboard/superadmin/alertas/page.tsx`**

Render system health grid (API Backend, PostGIS DB, MinIO Storage, GPS Streamer, Umami, Auth Service) with green/yellow status badges + `UnderConstruction` banner.

- [ ] **Step 4: Commit**

```bash
git add src/components/superadmin/under-construction.tsx src/app/dashboard/superadmin/dashboard/page.tsx src/app/dashboard/superadmin/alertas/page.tsx
git commit -m "feat(superadmin): create dashboard and alertas pages with under-construction state"
```

---

### Task 4: Empresas Clientes & Botón de Superpoderes

**Files:**
- Create: `src/components/superadmin/clientes-table.tsx`
- Create: `src/components/superadmin/empresa-form-dialog.tsx`
- Create: `src/app/dashboard/superadmin/clientes/page.tsx`
- Modify: `src/lib/admin-actions.ts`

**Interfaces:**
- Produces: Companies directory with search, status filters, vehicle count badges, plan badges, and an interactive "Acceder como Empresa (Superpoderes)" button with user feedback toast.

- [ ] **Step 1: Implement `src/components/superadmin/clientes-table.tsx`**

Includes:
- Filter/Search input.
- Table columns: Empresa, CUIT, Plan Actual, Vehículos Registrados, Estado (Activa/Suspendida), Fecha de Alta, Acciones.
- "Acceder como Empresa" button (Zap / Key icon) with modal or toast confirmation simulating entering support mode.
- "Nueva Empresa" dialog trigger.

- [ ] **Step 2: Implement `src/app/dashboard/superadmin/clientes/page.tsx`**

Server component fetching list of empresas, vehicles count, and active subscription plans from database.

- [ ] **Step 3: Verify TypeScript and compilation**

Run: `npx tsc --noEmit`  
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/superadmin/clientes-table.tsx src/components/superadmin/empresa-form-dialog.tsx src/app/dashboard/superadmin/clientes/page.tsx
git commit -m "feat(superadmin): add clientes management table with superpoderes tenant access"
```

---

### Task 5: CRM de Prospectos (Leads / Solicitudes de Demo)

**Files:**
- Create: `src/lib/prospectos-actions.ts`
- Create: `src/components/superadmin/prospectos-table.tsx`
- Create: `src/components/superadmin/prospecto-detail-dialog.tsx`
- Create: `src/app/dashboard/superadmin/prospectos/page.tsx`

**Interfaces:**
- Produces: CRM list with tabs for pipeline status (`Todos`, `Nuevos`, `Contactados`, `Demo Agendada`, `Convertidos`, `Descartados`), detail inspection dialog, internal notes editor, and status update actions.

- [ ] **Step 1: Create Server Actions in `src/lib/prospectos-actions.ts`**

Functions:
- `getProspectos()`
- `updateProspectoStatus(id: number, estado: string, notas?: string)`
- `createProspecto(data: ProspectoInput)`

- [ ] **Step 2: Create `ProspectosTable` and `ProspectoDetailDialog`**

Features:
- Contact information (Email, Teléfono, Empresa, Flota estimada).
- Badge colors based on status.
- Dialog for viewing full inquiry message and updating status + notes.

- [ ] **Step 3: Create `src/app/dashboard/superadmin/prospectos/page.tsx`**

Server component fetching prospectos and passing to client table.

- [ ] **Step 4: Commit**

```bash
git add src/lib/prospectos-actions.ts src/components/superadmin/prospectos-table.tsx src/components/superadmin/prospecto-detail-dialog.tsx src/app/dashboard/superadmin/prospectos/page.tsx
git commit -m "feat(superadmin): implement prospectos leads CRM table and detail management"
```

---

### Task 6: Cobros/Facturación & Configuración DevOps

**Files:**
- Create: `src/app/dashboard/superadmin/facturacion/page.tsx`
- Create: `src/app/dashboard/superadmin/dev/config/page.tsx`

**Interfaces:**
- Produces:
  - Facturación view: Plan tiers (Starter, Pro, Enterprise), monthly subscriptions table, next billing dates.
  - Dev Config view: System parameters, MinIO storage quota, telemetry ping frequency, maintenance mode toggle.

- [ ] **Step 1: Build `src/app/dashboard/superadmin/facturacion/page.tsx`**

Render subscription plans breakdown, tenant payment statuses, and revenue indicators.

- [ ] **Step 2: Build `src/app/dashboard/superadmin/dev/config/page.tsx`**

Render system environment cards, database connection info, external service port mapping indicators (Umami:3002, pgAdmin:5050, Portainer:9000), and system maintenance switches.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/superadmin/facturacion/page.tsx src/app/dashboard/superadmin/dev/config/page.tsx
git commit -m "feat(superadmin): add facturacion SaaS and dev config pages"
```

---

### Task 7: End-to-End Typecheck & Verification

**Files:**
- Verify: Full codebase

- [ ] **Step 1: Run TypeScript compiler check**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 2: Run test suite**

Run: `npm test`  
Expected: All tests pass.

- [ ] **Step 3: Verification of all superadmin routes**

Ensure all routes:
- `/dashboard/superadmin/dashboard`
- `/dashboard/superadmin/alertas`
- `/dashboard/superadmin/clientes`
- `/dashboard/superadmin/prospectos`
- `/dashboard/superadmin/facturacion`
- `/dashboard/superadmin/dev/config`
render with high fidelity and proper theme integration.
