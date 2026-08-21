# Sistema Integral de Choferes, Sitios, Viajes y Panel del Chofer - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar de forma integral la gestión de choferes (con login por DNI y escáner), catálogo de sitios de la empresa, creación y despacho de viajes con selector híbrido (Sitio vs Google Places / Geocoding), y el panel operativo del chofer.

**Architecture:** 
- **Capa de Datos:** Nuevas tablas en Drizzle ORM: `choferes`, `sitios`, `viajes` y campo `dni` en `users` con tipos normalizados en `src/types/flota-viajes.ts`.
- **Capa de Lógica (Server Actions):** Módulos en `src/lib/flota-actions.ts` y actualización de credenciales en `src/auth.ts`.
- **Capa de UI:**
  - `/panel/control-flota/choferes`: Tabla enriquecida de choferes y alta/edición de choferes con credenciales.
  - `/auth/login`: Pestaña de login con DNI y escáner de código DNI (PDF417 / lector).
  - `/panel/control-flota/sitios`: Catálogo de sitios de la empresa con mapas y geolocalización.
  - `/panel/control-flota/viajes`: Creación de viajes con `LocationSelector` híbrido (Sitio vs Google Places / Geocoding).
  - `/panel/chofer`: Panel mobile-first para choferes con inicio/fin de viajes y registro de odómetro.

**Tech Stack:** Next.js 14 App Router, NextAuth v5, PostgreSQL, Drizzle ORM, Leaflet/OpenStreetMap, Tailwind CSS, Lucide React, date-fns, Vitest.

---

### Task 1: Schema de Base de Datos y Tipos TypeScript (`choferes`, `sitios`, `viajes`, `users.dni`)

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/types/flota-viajes.ts`
- Test: `test/flota-viajes-schema.test.ts`

- [ ] **Step 1: Escribir tests de schema en `test/flota-viajes-schema.test.ts`**
- [ ] **Step 2: Ejecutar test para verificar fallo (`npx vitest run test/flota-viajes-schema.test.ts`)**
- [ ] **Step 3: Implementar definiciones en `src/types/flota-viajes.ts` y `src/db/schema.ts`**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 2: Server Actions para Choferes, Sitios y Viajes (`src/lib/flota-actions.ts`)

**Files:**
- Create: `src/lib/flota-actions.ts`
- Test: `test/flota-actions.test.ts`

- [ ] **Step 1: Escribir tests para CRUD de choferes, sitios, creación y actualización de viajes**
- [ ] **Step 2: Ejecutar test para verificar fallo (`npx vitest run test/flota-actions.test.ts`)**
- [ ] **Step 3: Implementar Server Actions en `src/lib/flota-actions.ts` con validación de tenant y auth**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 3: Autenticación por DNI y Diálogo de Escaneo (`/auth/login` y `src/auth.ts`)

**Files:**
- Modify: `src/auth.ts`
- Modify: `src/app/auth/login/page.tsx`
- Create: `src/components/auth/dni-scanner-dialog.tsx`
- Test: `test/dni-login.test.tsx`

- [ ] **Step 1: Escribir tests para el flujo de autenticación con DNI y escáner**
- [ ] **Step 2: Ejecutar test para verificar fallo**
- [ ] **Step 3: Implementar soporte de login por DNI en `src/auth.ts` y pestaña Chofer con Escáner en `src/app/auth/login/page.tsx`**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 4: Módulo de Gestión de Choferes (`/panel/control-flota/choferes`)

**Files:**
- Create: `src/app/panel/control-flota/choferes/page.tsx`
- Create: `src/components/control-flota/choferes/choferes-table.tsx`
- Create: `src/components/control-flota/choferes/chofer-form-dialog.tsx`
- Test: `test/choferes-table.test.tsx`

- [ ] **Step 1: Escribir tests para tabla de choferes, filtros de estado, badges de licencia y diálogos de alta**
- [ ] **Step 2: Ejecutar test para verificar fallo**
- [ ] **Step 3: Implementar componentes y página de choferes**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 5: Módulo de Gestión de Sitios (`/panel/control-flota/sitios`)

**Files:**
- Modify: `src/app/panel/control-flota/sitios/page.tsx`
- Create: `src/components/control-flota/sitios/sitios-table.tsx`
- Create: `src/components/control-flota/sitios/sitio-form-dialog.tsx`
- Test: `test/sitios-table.test.tsx`

- [ ] **Step 1: Escribir tests para catálogo de sitios, filtros por tipo y formulario de sitio con coordenadas**
- [ ] **Step 2: Ejecutar test para verificar fallo**
- [ ] **Step 3: Implementar componentes y página de sitios**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 6: Selector Híbrido de Ubicaciones y Módulo de Viajes (`/panel/control-flota/viajes`)

**Files:**
- Create: `src/components/control-flota/viajes/location-selector.tsx`
- Create: `src/components/control-flota/viajes/viaje-form-dialog.tsx`
- Create: `src/components/control-flota/viajes/viajes-table.tsx`
- Create: `src/app/panel/control-flota/viajes/page.tsx`
- Test: `test/viajes-flow.test.tsx`

- [ ] **Step 1: Escribir tests para `LocationSelector` (Sitio vs Google Places / Geocoding), `ViajeFormDialog` y `ViajesTable`**
- [ ] **Step 2: Ejecutar test para verificar fallo**
- [ ] **Step 3: Implementar `LocationSelector`, formulario de viajes y tabla de despacho**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 7: Panel Operativo del Chofer (`/panel/chofer`) y Sidebar Navigation

**Files:**
- Create: `src/app/panel/chofer/page.tsx`
- Create: `src/components/chofer/chofer-dashboard.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`
- Test: `test/panel-chofer.test.tsx`

- [ ] **Step 1: Escribir tests para el panel del chofer (viaje en curso, check-in, check-out, crear viaje libre) y navegación por rol**
- [ ] **Step 2: Ejecutar test para verificar fallo**
- [ ] **Step 3: Implementar `ChoferDashboard`, página `/panel/chofer` y actualizar `app-sidebar.tsx`**
- [ ] **Step 4: Ejecutar test para verificar que pase**
- [ ] **Step 5: Commit**

---

### Task 8: Migración de Base de Datos y Verificación Integral de la Suite

**Files:**
- Modify: `src/db/seed.ts`
- Test: All tests in repository

- [ ] **Step 1: Actualizar `seed.ts` con creación de tablas e índices si no existen**
- [ ] **Step 2: Ejecutar script de verificación y creación de tablas en PostgreSQL**
- [ ] **Step 3: Ejecutar suite completa `npm test` asegurando 100% éxito**
- [ ] **Step 4: Commit**
