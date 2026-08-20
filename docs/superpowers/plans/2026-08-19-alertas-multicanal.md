# Plan de Implementación: Sistema de Alertas Multicanal (WhatsApp & Email)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un sistema integral y centralizado de despacho y configuración de alertas para WhatsApp y Email, con selección de módulos emisores en configuración, motor despachador con logs explícitos en consola, persistencia histórica, consola de monitoreo con filtros avanzados y enlaces directos desde el mapa y vehículos.

**Architecture:** Se extiende el esquema de Drizzle (`alert_configs` y nueva tabla `alert_logs`). Se crea un despachador unificado (`src/lib/alerts/dispatcher.ts`) que valida módulos habilitados y canales de la empresa, formatea logs de despacho claros y guarda el historial. Se implementa la interfaz de configuración en `/dashboard/administracion/configuracion`, la consola de monitoreo en `/dashboard/monitoreo/alertas`, y se integran disparadores en los módulos de Flota (Mantenimiento, Documentos, Geocercas, Horarios) y mapa.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons, Radix UI / shadcn components, Drizzle ORM, Vitest.

## Global Constraints

- Destinatarios por empresa: 1 correo electrónico y 1 número de WhatsApp internacional.
- Módulos soportados para alertas: `"MANTENIMIENTO"`, `"DOCUMENTACION"`, `"GEOCERCAS"`, `"HORARIOS"`, `"SISTEMA"`.
- Canales soportados: `"EMAIL"`, `"WHATSAPP"`, `"AMBOS"`, `"SISTEMA"`.
- Los logs en consola deben mostrar con claridad el canal, destinatario, asunto y mensaje completo.
- Mantener compatibilidad con modo offline/fallback si la base de datos no está disponible.
- Todos los tests deben ejecutarse con `vitest run` y pasar al 100%.

---

### Task 1: Schema Updates & Database Model

**Files:**
- Modify: `src/db/schema.ts`
- Create: `test/db/alerts-schema.test.ts`

**Interfaces:**
- Consumes: Drizzle pgTable definitions.
- Produces: `alertConfigs` (con `modulosHabilitados`), `alertLogs` table and types `AlertLog`, `NewAlertLog`, `AlertConfig`.

- [ ] **Step 1: Write unit test verifying schema definitions and types**

```typescript
// test/db/alerts-schema.test.ts
import { describe, it, expect } from "vitest";
import { alertConfigs, alertLogs } from "@/db/schema";

describe("Alerts Schema", () => {
  it("should have alertConfigs with modulosHabilitados and channels", () => {
    expect(alertConfigs.modulosHabilitados).toBeDefined();
    expect(alertConfigs.canalEmail).toBeDefined();
    expect(alertConfigs.canalWhatsapp).toBeDefined();
    expect(alertConfigs.emailDestino).toBeDefined();
    expect(alertConfigs.telefonoWhatsapp).toBeDefined();
  });

  it("should have alertLogs table defined with required fields", () => {
    expect(alertLogs).toBeDefined();
    expect(alertLogs.modulo).toBeDefined();
    expect(alertLogs.tipo).toBeDefined();
    expect(alertLogs.severidad).toBeDefined();
    expect(alertLogs.mensaje).toBeDefined();
    expect(alertLogs.canal).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/db/alerts-schema.test.ts`
Expected: FAIL (missing `modulosHabilitados` or `alertLogs`).

- [ ] **Step 3: Update `src/db/schema.ts` with `modulosHabilitados` and `alertLogs`**

Add `modulosHabilitados` to `alertConfigs` and create `alertLogs` table.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/db/alerts-schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/db/schema.ts test/db/alerts-schema.test.ts
git commit -m "feat(db): add alert_logs table and extend alert_configs with modulosHabilitados"
```

---

### Task 2: Central Alert Dispatcher Engine & Formatting

**Files:**
- Create: `src/types/alerts.ts`
- Create: `src/lib/alerts/dispatcher.ts`
- Create: `test/alerts-dispatcher.test.ts`

**Interfaces:**
- Consumes: `alertConfigs`, `alertLogs`, `db`.
- Produces: `dispatchAlert(params: DispatchAlertParams): Promise<DispatchAlertResult>`, `formatAlertConsoleLog(...)`, `getMockAlertLogs()`.

- [ ] **Step 1: Write tests for `dispatchAlert` and console formatting**

Test that `dispatchAlert`:
1. Skips dispatch if module is disabled in company config.
2. Dispatches to Email when active and logs formatted output.
3. Dispatches to WhatsApp when active and logs formatted output.
4. Correctly creates database / mock log entry.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/alerts-dispatcher.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/types/alerts.ts` and `src/lib/alerts/dispatcher.ts`**

Implement full type definitions and dispatch logic with clear, structured console logging (`[ALERT DISPATCH] ...`) and DB/fallback storage.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/alerts-dispatcher.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/types/alerts.ts src/lib/alerts/dispatcher.ts test/alerts-dispatcher.test.ts
git commit -m "feat(alerts): implement central alert dispatcher with email and whatsapp mock logging"
```

---

### Task 3: Alert Configuration Server Actions & API

**Files:**
- Modify/Create: `src/lib/alert-config-actions.ts`
- Create: `src/app/api/alerts/config/route.ts`
- Create: `test/api/alert-config.test.ts`

**Interfaces:**
- Consumes: `auth()`, `alertConfigs`.
- Produces: `getAlertConfig(empresaId?: number)`, `saveAlertConfig(formData: FormData | AlertConfigInput)`, `sendTestAlertAction(...)`.

- [ ] **Step 1: Write test for alert configuration actions and test dispatch**

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/api/alert-config.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement alert config actions and `/api/alerts/config` API route**

Support reading config, updating email, phone, module toggles, tolerances, and triggering test alerts.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/api/alert-config.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/alert-config-actions.ts src/app/api/alerts/config/route.ts test/api/alert-config.test.ts
git commit -m "feat(alerts): add alert configuration server actions and API route"
```

---

### Task 4: Configuration Page UI (`/dashboard/administracion/configuracion`)

**Files:**
- Modify: `src/app/dashboard/administracion/configuracion/page.tsx`
- Create: `src/components/configuracion/AlertsConfigForm.tsx`
- Create: `src/components/configuracion/TestAlertModal.tsx`
- Create: `test/components/alerts-config-page.test.tsx`

**Interfaces:**
- Consumes: `getAlertConfig`, `saveAlertConfig`, `sendTestAlertAction`.
- Produces: Complete Configuration UI with destination email, destination whatsapp, module checkboxes, tolerance inputs, and test alert modal.

- [ ] **Step 1: Write render and interaction tests for AlertsConfigForm**

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/components/alerts-config-page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `AlertsConfigForm`, `TestAlertModal`, and `/dashboard/administracion/configuracion/page.tsx`**

Build clean, modern UI with:
- Global Alert Master Switch.
- Email destination input + Email channel toggle.
- WhatsApp destination input with country code formatting + WhatsApp channel toggle.
- Enabled Modules Multi-Select (Mantenimiento, Documentación, Geocercas, Horarios).
- Tolerance inputs (Km anticipación, Días anticipación).
- Modal to fire and preview test alerts.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/components/alerts-config-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/dashboard/administracion/configuracion/page.tsx src/components/configuracion/ test/components/alerts-config-page.test.tsx
git commit -m "feat(config): build full alerts configuration page and test alert simulator modal"
```

---

### Task 5: Alert Triggers in Existing Modules

**Files:**
- Create: `src/lib/alerts/triggers.ts`
- Create: `src/app/api/alerts/scan/route.ts`
- Create: `test/alerts-triggers.test.ts`

**Interfaces:**
- Consumes: `dispatchAlert`, vehicles, maintenance plans, documents, geofences, schedules.
- Produces:
  - `evaluateMaintenanceAlerts(empresaId: number)`
  - `evaluateDocumentExpirationAlerts(empresaId: number)`
  - `triggerGeofenceViolationAlert(...)`
  - `triggerScheduleViolationAlert(...)`

- [ ] **Step 1: Write tests for module trigger evaluations**

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/alerts-triggers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/alerts/triggers.ts` and automated scan endpoint `/api/alerts/scan`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/alerts-triggers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/alerts/triggers.ts src/app/api/alerts/scan/route.ts test/alerts-triggers.test.ts
git commit -m "feat(alerts): implement automated triggers for maintenance, documents, geofences, and schedules"
```

---

### Task 6: Monitoring & Alert History Console (`/dashboard/monitoreo/alertas`)

**Files:**
- Modify: `src/app/dashboard/monitoreo/alertas/page.tsx`
- Create: `src/components/alertas/AlertsFilterBar.tsx`
- Create: `src/components/alertas/AlertsHistoryTable.tsx`
- Create: `src/components/alertas/AlertDetailDialog.tsx`
- Create: `src/components/alertas/AlertsStatsCards.tsx`
- Create: `src/app/api/alerts/history/route.ts`
- Create: `test/components/alerts-history-page.test.tsx`

**Interfaces:**
- Consumes: `/api/alerts/history`, `searchParams` (`?patente=...`).
- Produces: Fully interactive Alert Monitoring Dashboard with stats, filters by license plate, module, channel, severity, status, and detail dialog.

- [ ] **Step 1: Write tests for filtering alerts by license plate, module, severity, channel**

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/components/alerts-history-page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement components and `/dashboard/monitoreo/alertas/page.tsx`**

Include:
- URL query parameter synchronization for `patente`.
- Stats cards with total alerts, WhatsApp dispatches, Email dispatches, and critical alerts.
- Filter toolbar (Vehicle/Plate, Module, Channel, Severity, Search).
- Detailed table with badges, timestamp, destinations, and modal details.
- Button to trigger scan or test alert simulation.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/components/alerts-history-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/dashboard/monitoreo/alertas/page.tsx src/components/alertas/ src/app/api/alerts/history/route.ts test/components/alerts-history-page.test.tsx
git commit -m "feat(monitoring): build alerts monitoring and history console with multi-criteria filters"
```

---

### Task 7: Map & Vehicle Card Integration (Direct Alert Filter Links)

**Files:**
- Modify: `src/app/dashboard/mapa/page.tsx` (or vehicle map popup component)
- Modify: `src/app/dashboard/control-flota/vehiculos/[id]/page.tsx`
- Create: `test/components/map-vehicle-alerts-link.test.tsx`

**Interfaces:**
- Consumes: `patente` or `vehiculoId`.
- Produces: Action button / link pointing to `/dashboard/monitoreo/alertas?patente=${patente}` with badge indicators.

- [ ] **Step 1: Write tests for vehicle link to filtered alerts**

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/components/map-vehicle-alerts-link.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Add "Ver Alertas" action link with query param to Map and Vehicle Details view**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/components/map-vehicle-alerts-link.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/dashboard/mapa/page.tsx src/app/dashboard/control-flota/vehiculos/ test/components/map-vehicle-alerts-link.test.tsx
git commit -m "feat(navigation): connect map and vehicle cards to filtered alerts view"
```

---

### Task 8: Full Verification & E2E Validation

**Files:**
- Run: Full test suite (`vitest run`)
- Check: Next.js build (`npm run build` or typecheck)

- [ ] **Step 1: Run complete Vitest suite**

Run: `npm test`
Expected: All test suites pass (100%).

- [ ] **Step 2: Verify build and type integrity**

Run: `npx tsc --noEmit`
Expected: Zero TypeScript errors.

- [ ] **Step 3: Final commit**

```bash
git commit --allow-empty -m "chore: complete multi-channel alerts system implementation"
```
