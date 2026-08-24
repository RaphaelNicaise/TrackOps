# Separación de Planes y Cobros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar el catálogo interactivo de planes de suscripción (sin KPIs) a su propia sección `/panel/superadmin/planes` bajo Gestión de Plataforma, y trasladar la gestión financiera con sus 4 KPIs (MRR, ARR, ARPU, Tasa de Cobro) y la tabla de cobranzas a `/panel/superadmin/cobros`.

**Architecture:** Módulos desacoplados en React Server Components y Client Components dedicados: `PlanesView` para el catálogo y CRUD de planes, y `CobrosView` para los KPIs financieros, filtros y tabla de cobranzas por inquilino.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons, Shadcn UI (Dialog, Table, Badge, DropdownMenu), Drizzle ORM, Vitest.

---

### Task 1: Componente `PlanesView` y Ruta `/panel/superadmin/planes`

**Files:**
- Create: `src/components/superadmin/planes/planes-view.tsx`
- Create: `src/app/panel/superadmin/planes/page.tsx`
- Test: `test/superadmin-planes-page.test.tsx`

**Interfaces:**
- Consumes: `SubscriptionPlanData` de `@/types` o `@/components/superadmin/facturacion-view` y Server Actions de `@/lib/admin-actions` (`createSubscriptionPlan`, `updateSubscriptionPlan`, `deleteSubscriptionPlan`).
- Produces: `<PlanesView plans={plans} />` y la página `/panel/superadmin/planes`.

- [ ] **Step 1: Escribir test unitario e integración para `PlanesPage` y `PlanesView`**
- [ ] **Step 2: Ejecutar test y verificar fallo inicial**
- [ ] **Step 3: Implementar `PlanesView` en `src/components/superadmin/planes/planes-view.tsx`**
- [ ] **Step 4: Implementar Server Page en `src/app/panel/superadmin/planes/page.tsx`**
- [ ] **Step 5: Ejecutar test y verificar que pasa al 100%**
- [ ] **Step 6: Git commit**

---

### Task 2: Componente `CobrosView` y Ruta `/panel/superadmin/cobros`

**Files:**
- Create: `src/components/superadmin/cobros/cobros-view.tsx`
- Create: `src/app/panel/superadmin/cobros/page.tsx`
- Modify: `src/app/panel/superadmin/facturacion/page.tsx`
- Test: `test/superadmin-cobros-page.test.tsx`

**Interfaces:**
- Consumes: `BillingRecord` de `@/components/superadmin/facturacion-view`.
- Produces: `<CobrosView records={records} />` con los 4 KPIs (MRR, ARR, ARPU, Cobro al Día), filtros y tabla de cobranzas.

- [ ] **Step 1: Escribir test unitario e integración para `CobrosPage` y `CobrosView`**
- [ ] **Step 2: Ejecutar test y verificar fallo inicial**
- [ ] **Step 3: Implementar `CobrosView` en `src/components/superadmin/cobros/cobros-view.tsx`**
- [ ] **Step 4: Implementar Server Page en `src/app/panel/superadmin/cobros/page.tsx` y compatibilidad en `facturacion/page.tsx`**
- [ ] **Step 5: Ejecutar test y verificar que pasa al 100%**
- [ ] **Step 6: Git commit**

---

### Task 3: Actualización de Barra Lateral `app-sidebar.tsx` y Tests de Navegación

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `test/sidebar-navigation.test.ts`

**Interfaces:**
- Produces: Enlace de "Planes" (`/panel/superadmin/planes`) y "Cobros" (`/panel/superadmin/cobros`) bajo `Gestión de Plataforma`.

- [ ] **Step 1: Actualizar `test/sidebar-navigation.test.ts` con las nuevas rutas**
- [ ] **Step 2: Actualizar `superAdminNav` en `src/components/layout/app-sidebar.tsx`**
- [ ] **Step 3: Ejecutar suite completa de vitest y verificar 100% PASS**
- [ ] **Step 4: Git commit**
