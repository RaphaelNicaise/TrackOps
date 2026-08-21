# Centro de Soporte e Incidencias Multicanal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un Centro de Soporte unificado en el panel de Superadmin con recepción de tickets multicanal (Header del Panel para usuarios registrados y Footer de la Web pública para visitantes), con KPIs, filtros, respuestas directas por WhatsApp/Email, notas internas y acceso a Modo Soporte.

**Architecture:** Se creará la tabla `tickets_soporte` en PostgreSQL vía Drizzle ORM. Se implementarán Server Actions tipadas para la creación, consulta y actualización de tickets. Se desarrollarán componentes de captura en el Header del Panel y Footer Web, y la vista completa del Centro de Soporte en `/panel/superadmin/soporte`.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Drizzle ORM, PostgreSQL, Tailwind CSS, Lucide Icons, Shadcn UI, Vitest.

## Global Constraints

- Todos los componentes y hooks deben respetar la estética editorial del proyecto y modo oscuro/claro.
- El término para acceso de superadmin debe ser **Modo Soporte** (sin emojis ni rayos).
- Todos los archivos y funciones deben estar estrictamente tipados en TypeScript.
- Respetar la convención de `revalidatePath` en Server Actions.

---

### Task 1: Schema de Base de Datos y Tipos de Soporte

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/types/soporte.ts`
- Test: `test/soporte-schema.test.ts`

**Interfaces:**
- Produces: `ticketsSoporte` table definition, `TicketSoporte`, `CreateTicketInput`, `TicketFilters` types.

- [ ] **Step 1: Write the failing test for schema and types**

```typescript
// test/soporte-schema.test.ts
import { describe, it, expect } from "vitest";
import { ticketsSoporte } from "@/db/schema";

describe("Tickets Soporte Schema", () => {
  it("defines the tickets_soporte table with all required columns", () => {
    expect(ticketsSoporte).toBeDefined();
    expect(ticketsSoporte.id).toBeDefined();
    expect(ticketsSoporte.origen).toBeDefined();
    expect(ticketsSoporte.tipo).toBeDefined();
    expect(ticketsSoporte.prioridad).toBeDefined();
    expect(ticketsSoporte.estado).toBeDefined();
    expect(ticketsSoporte.asunto).toBeDefined();
    expect(ticketsSoporte.mensaje).toBeDefined();
    expect(ticketsSoporte.nombreContacto).toBeDefined();
    expect(ticketsSoporte.emailContacto).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/soporte-schema.test.ts`
Expected: FAIL with "ticketsSoporte is not defined"

- [ ] **Step 3: Implement `src/types/soporte.ts` and add `ticketsSoporte` to `src/db/schema.ts`**

```typescript
// src/types/soporte.ts
export type TicketOrigen = "PANEL" | "WEB";
export type TicketTipo =
  | "PROBLEMA_TECNICO"
  | "DISPOSITIVO_GPS"
  | "FACTURACION"
  | "QUEJA_RECLAMO"
  | "CONSULTA_GENERAL"
  | "OTRO";
export type TicketPrioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
export type TicketEstado = "PENDIENTE" | "EN_REVISION" | "RESUELTO" | "DESCARTADO";
export type PreferenciaRespuesta = "EMAIL" | "WHATSAPP" | "TELEFONO";

export interface TicketSoporteRow {
  id: number;
  origen: TicketOrigen;
  empresaId: number | null;
  empresaNombre?: string | null;
  userId: string | null;
  userName?: string | null;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string | null;
  empresaNombreManual: string | null;
  tipo: TicketTipo;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  asunto: string;
  mensaje: string;
  preferenciaRespuesta: PreferenciaRespuesta;
  notasInternas: string | null;
  resueltoPor: string | null;
  resueltoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketInput {
  origen?: TicketOrigen;
  empresaId?: number | null;
  userId?: string | null;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto?: string | null;
  empresaNombreManual?: string | null;
  tipo: TicketTipo;
  prioridad?: TicketPrioridad;
  asunto: string;
  mensaje: string;
  preferenciaRespuesta?: PreferenciaRespuesta;
}
```

```typescript
// In src/db/schema.ts
export const ticketsSoporte = pgTable("tickets_soporte", {
  id: serial("id").primaryKey(),
  origen: varchar("origen", { length: 20 }).notNull().default("PANEL"),
  empresaId: integer("empresa_id").references(() => empresas.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  nombreContacto: text("nombre_contacto").notNull(),
  emailContacto: text("email_contacto").notNull(),
  telefonoContacto: varchar("telefono_contacto", { length: 50 }),
  empresaNombreManual: text("empresa_nombre_manual"),
  tipo: varchar("tipo", { length: 40 }).notNull(),
  prioridad: varchar("prioridad", { length: 20 }).notNull().default("MEDIA"),
  estado: varchar("estado", { length: 30 }).notNull().default("PENDIENTE"),
  asunto: text("asunto").notNull(),
  mensaje: text("mensaje").notNull(),
  preferenciaRespuesta: varchar("preferencia_respuesta", { length: 20 }).default("EMAIL"),
  notasInternas: text("notas_internas"),
  resueltoPor: text("resuelto_por"),
  resueltoAt: timestamp("resuelto_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/soporte-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/types/soporte.ts test/soporte-schema.test.ts
git commit -m "feat(soporte): add tickets_soporte database schema and TypeScript interfaces"
```

---

### Task 2: Server Actions para Gestión de Tickets (`src/lib/soporte-actions.ts`)

**Files:**
- Create: `src/lib/soporte-actions.ts`
- Test: `test/soporte-actions.test.ts`

**Interfaces:**
- Produces: `createSupportTicket`, `getSupportTickets`, `updateTicketStatus`, `updateTicketPriority`, `saveTicketInternalNotes`.

- [ ] **Step 1: Write the failing test for Server Actions**

```typescript
// test/soporte-actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupportTicket, updateTicketStatus } from "@/lib/soporte-actions";

describe("Support Actions", () => {
  it("validates required fields when creating a ticket", async () => {
    // @ts-expect-error test missing fields
    const res = await createSupportTicket({});
    expect(res.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/soporte-actions.test.ts`
Expected: FAIL with "module not found"

- [ ] **Step 3: Implement `src/lib/soporte-actions.ts`**

Implement full validations, DB inserts, query filtering, and status updates with `revalidatePath`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/soporte-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/soporte-actions.ts test/soporte-actions.test.ts
git commit -m "feat(soporte): add server actions for ticket creation, retrieval and status management"
```

---

### Task 3: Modal de Soporte en Header del Panel

**Files:**
- Create: `src/components/soporte/support-ticket-header-button.tsx`
- Modify: `src/app/panel/layout.tsx`
- Test: `test/support-header-button.test.tsx`

**Interfaces:**
- Consumes: Session context, `createSupportTicket`.
- Produces: `SupportTicketHeaderButton` component.

- [ ] **Step 1: Write test for Header Support Button**

```typescript
// test/support-header-button.test.tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SupportTicketHeaderButton } from "@/components/soporte/support-ticket-header-button";

describe("SupportTicketHeaderButton", () => {
  it("renders the support button with clean Headphones icon", () => {
    const html = renderToStaticMarkup(
      <SupportTicketHeaderButton userName="Test User" userEmail="test@prada.com" empresaNombre="Transportes S.A." empresaId={1} />
    );
    expect(html).toContain("Soporte");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/support-header-button.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `SupportTicketHeaderButton` and embed in `src/app/panel/layout.tsx`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/support-header-button.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/soporte/support-ticket-header-button.tsx src/app/panel/layout.tsx test/support-header-button.test.tsx
git commit -m "feat(soporte): add support ticket button and dialog to panel header"
```

---

### Task 4: Formulario y Modal "Hablar con Soporte" en Footer de la Web

**Files:**
- Create: `src/components/soporte/public-support-dialog.tsx`
- Modify: `src/app/page.tsx`
- Test: `test/public-support-dialog.test.tsx`

- [ ] **Step 1: Write test for Public Support Dialog**

```typescript
// test/public-support-dialog.test.tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicSupportDialog } from "@/components/soporte/public-support-dialog";

describe("PublicSupportDialog", () => {
  it("renders public support trigger and dialog", () => {
    const html = renderToStaticMarkup(<PublicSupportDialog />);
    expect(html).toContain("Hablar con Soporte");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/public-support-dialog.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `PublicSupportDialog` and integrate in `src/app/page.tsx` footer**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/public-support-dialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/soporte/public-support-dialog.tsx src/app/page.tsx test/public-support-dialog.test.tsx
git commit -m "feat(soporte): integrate public support dialog into landing page footer"
```

---

### Task 5: Navegación de Superadmin y Página del Centro de Soporte

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Create: `src/app/panel/superadmin/soporte/page.tsx`
- Test: `test/superadmin-soporte-page.test.tsx`

- [ ] **Step 1: Write test for Superadmin Soporte Page**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Add `Centro de Soporte` to `superAdminNav` and create server page `src/app/panel/superadmin/soporte/page.tsx`**

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-sidebar.tsx src/app/panel/superadmin/soporte/page.tsx test/superadmin-soporte-page.test.tsx
git commit -m "feat(soporte): add Centro de Soporte route and navigation link in Superadmin sidebar"
```

---

### Task 6: Componentes de Superadmin: Tabla de Tickets, KPIs y Ficha 360°

**Files:**
- Create: `src/components/superadmin/soporte/soporte-table.tsx`
- Create: `src/components/superadmin/soporte/ticket-detail-sheet.tsx`
- Test: `test/soporte-table.test.tsx`

- [ ] **Step 1: Write test for SoporteTable & DetailSheet**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `SoporteTable` with search, filters (Estado, Prioridad, Tipo, Origen), KPI cards, and `TicketDetailSheet` with quick WhatsApp/Email responder and Modo Soporte link**

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/components/superadmin/soporte/soporte-table.tsx src/components/superadmin/soporte/ticket-detail-sheet.tsx test/soporte-table.test.tsx
git commit -m "feat(soporte): implement Superadmin support table, filters, KPIs and 360 detail sheet"
```

---

### Task 7: Verificación Integral de la Suite de Pruebas

**Files:**
- Test: `test/soporte-tickets.test.tsx`

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: 100% tests passing

- [ ] **Step 2: Commit final integrations**

```bash
git commit -m "chore(soporte): verify complete test suite for Support Center feature"
```
