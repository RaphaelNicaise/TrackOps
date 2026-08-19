# Plan de Implementación: Horarios de Uso y Grupos de Vehículos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el módulo completo de Horarios de Uso (`/dashboard/control-flota/horarios`) con configuración semanal por franjas, asignación multi-nivel y alertas (UI, Email, WhatsApp), junto con el módulo de Grupos de Vehículos (`/dashboard/control-flota/grupos`) y la integración en el Sidebar.

**Architecture:** Esquema relacional en Drizzle ORM (`schedules`, `vehicle_groups`, `vehicle_group_members`, `schedule_violations`), endpoints REST en Next.js App Router con soporte multi-inquilino (`empresaId`) y fallback a datos mock, y componentes visuales en React / Tailwind CSS / Lucide Icons / shadcn/ui.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Drizzle ORM, Tailwind CSS, shadcn/ui, Lucide React, NextAuth.

## Global Constraints
- Nombres de rutas y componentes en kebab-case y PascalCase estándar del proyecto.
- Fallback resiliente con datos mock en todas las páginas y endpoints para funcionar offline / sin DB.
- Integración de estilos oscuros con acentos ámbar (#F2B705) coherentes con el diseño de Geocercas y Flota de TrackOps.

---

### Task 1: Esquema de Base de Datos y Tipos TypeScript

**Files:**
- Create: `src/types/schedule.ts`
- Modify: `src/db/schema.ts`

**Interfaces:**
- Produces: `Schedule`, `WeeklyScheduleConfig`, `DayScheduleConfig`, `TimeSlot`, `ScheduleViolation`, `VehicleGroup` types in `src/types/schedule.ts`.
- Produces: `vehicleGroups`, `vehicleGroupMembers`, `schedules`, `scheduleViolations` table definitions in `src/db/schema.ts`.

- [ ] **Step 1: Crear archivo de tipos `src/types/schedule.ts`**
```typescript
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface TimeSlot {
  start: string; // "HH:mm" ej. "08:00"
  end: string;   // "HH:mm" ej. "18:00"
}

export interface DayScheduleConfig {
  active: boolean;
  slots: TimeSlot[];
}

export type WeeklyScheduleConfig = Record<DayOfWeek, DayScheduleConfig>;

export type ScheduleTargetType = "ALL" | "CATEGORY" | "GROUP" | "VEHICLES";
export type ScheduleAlertChannel = "UI" | "EMAIL" | "WHATSAPP";

export interface Schedule {
  id: number;
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  color: string;
  activo: boolean;
  diasConfig: WeeklyScheduleConfig;
  toleranciaMinutos: number;
  targetType: ScheduleTargetType;
  targetVehicles?: number[];
  targetCategories?: string[];
  targetGroups?: string[];
  alertChannels: ScheduleAlertChannel[];
  emailRecipients?: string;
  whatsappRecipients?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleGroup {
  id: number;
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  vehicleIds: number[];
  createdAt?: string;
}

export interface ScheduleViolation {
  id: number;
  empresaId?: number;
  scheduleId?: number;
  scheduleNombre?: string;
  vehicleId: number;
  patente: string;
  fechaInicio: string;
  fechaFin?: string;
  duracionMinutos: number;
  velocidadMaxima: number;
  lat?: number;
  lng?: number;
  notificadoEmail: boolean;
  notificadoWhatsapp: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Modificar `src/db/schema.ts` para agregar las tablas relacionales**
Agregar `vehicleGroups`, `vehicleGroupMembers`, `schedules` y `scheduleViolations`.

- [ ] **Step 3: Ejecutar verificación de tipos**
`npx tsc --noEmit`

- [ ] **Step 4: Commit**
`git add src/types/schedule.ts src/db/schema.ts && git commit -m "feat(schema): add vehicle groups and schedules tables and types"`

---

### Task 2: Datos Mock e Iniciales para Horarios y Grupos

**Files:**
- Create: `src/lib/mock-schedules.ts`
- Create: `src/lib/mock-vehicle-groups.ts`

**Interfaces:**
- Produces: `INITIAL_MOCK_SCHEDULES`, `INITIAL_MOCK_VIOLATIONS` in `src/lib/mock-schedules.ts`.
- Produces: `INITIAL_MOCK_GROUPS` in `src/lib/mock-vehicle-groups.ts`.

- [ ] **Step 1: Crear `src/lib/mock-vehicle-groups.ts`**
Definir 5 grupos preconfigurados ("Logística Urbana", "Reparto Turno Mañana", "Mantenimiento & Técnica", "Larga Distancia", "Supervisión & Control") con colores, iconos y vehículos asignados.

- [ ] **Step 2: Crear `src/lib/mock-schedules.ts`**
Definir 4 políticas de horario realistas (ej. "Horario Comercial Central", "Turno Nocturno Continuo", "Guardias Fin de Semana", "Distribución Matutina") con configuración semanal completa y 4 registros de violaciones de prueba.

- [ ] **Step 3: Verificar compilación**
`npx tsc --noEmit`

- [ ] **Step 4: Commit**
`git add src/lib/mock-vehicle-groups.ts src/lib/mock-schedules.ts && git commit -m "feat(mocks): add mock datasets for schedules, violations and vehicle groups"`

---

### Task 3: Endpoints API para Grupos, Horarios e Infracciones

**Files:**
- Create: `src/app/api/vehicle-groups/route.ts`
- Create: `src/app/api/vehicle-groups/[id]/route.ts`
- Create: `src/app/api/schedules/route.ts`
- Create: `src/app/api/schedules/[id]/route.ts`
- Create: `src/app/api/schedules/[id]/toggle/route.ts`
- Create: `src/app/api/schedules/violations/route.ts`

**Interfaces:**
- Consumes: `schedules`, `vehicleGroups`, `vehicleGroupMembers`, `scheduleViolations` from `src/db/schema.ts`.
- Produces: REST endpoints with JSON response formats `{ success: true, data: ... }` and mock fallback.

- [ ] **Step 1: Implementar `src/app/api/vehicle-groups/route.ts` y `[id]/route.ts`**
GET (listar grupos con conteo de vehículos), POST (crear), PUT (actualizar), DELETE (eliminar).

- [ ] **Step 2: Implementar `src/app/api/schedules/route.ts`, `[id]/route.ts` y `[id]/toggle/route.ts`**
GET (listar políticas), POST (crear), PUT (actualizar), DELETE (eliminar), PATCH (toggle activo).

- [ ] **Step 3: Implementar `src/app/api/schedules/violations/route.ts`**
GET (listar violaciones).

- [ ] **Step 4: Verificar compilación de rutas API**
`npx tsc --noEmit`

- [ ] **Step 5: Commit**
`git add src/app/api/vehicle-groups src/app/api/schedules && git commit -m "feat(api): add REST endpoints for vehicle groups, schedules and violations"`

---

### Task 4: Módulo de Gestión de Grupos de Vehículos

**Files:**
- Create: `src/components/groups/VehicleGroupCard.tsx`
- Create: `src/components/groups/VehicleGroupModal.tsx`
- Modify: `src/app/dashboard/control-flota/grupos/page.tsx`

**Interfaces:**
- Produces: Full interactive UI for `/dashboard/control-flota/grupos` with card grid, search, creation modal, and vehicle assigner.

- [ ] **Step 1: Crear `src/components/groups/VehicleGroupCard.tsx`**
Tarjeta con color del grupo, icono, nombre, descripción, conteo de vehículos, preview de patentes y botones de edición/eliminación.

- [ ] **Step 2: Crear `src/components/groups/VehicleGroupModal.tsx`**
Modal interactivo para crear/editar grupo, seleccionar color, icono y elegir vehículos mediante checkboxes y buscador.

- [ ] **Step 3: Implementar `src/app/dashboard/control-flota/grupos/page.tsx`**
Header con estadísticas (Total grupos, Vehículos asignados, Vehículos libres), buscador, botón "+ Nuevo Grupo", y renderizado de la grilla de grupos.

- [ ] **Step 4: Verificar compilación**
`npx tsc --noEmit`

- [ ] **Step 5: Commit**
`git add src/components/groups src/app/dashboard/control-flota/grupos && git commit -m "feat(ui): complete vehicle groups management module"`

---

### Task 5: Componentes del Planificador de Horarios y Alertas

**Files:**
- Create: `src/components/schedules/WeeklyDayPicker.tsx`
- Create: `src/components/schedules/ScheduleAlertRules.tsx`
- Create: `src/components/schedules/ScheduleFleetAssigner.tsx`
- Create: `src/components/schedules/ScheduleCard.tsx`
- Create: `src/components/schedules/ScheduleModal.tsx`
- Create: `src/components/schedules/ViolationsTable.tsx`

**Interfaces:**
- Produces: Modular schedule configuration components with rich weekly time-slot picker, multi-level fleet assignment, alert channels configuration, card view and audit table.

- [ ] **Step 1: Crear `src/components/schedules/WeeklyDayPicker.tsx`**
Planificador interactivo día a día (Lunes a Domingo): switch activo/inactivo por día, selector de hora Desde y Hasta, soporte de múltiples intervalos ("+ Agregar tramo"), y botón "Copiar a días hábiles".

- [ ] **Step 2: Crear `src/components/schedules/ScheduleAlertRules.tsx`**
Configuración de canales de alerta (Notificación en plataforma, Email con input de destinatarios, WhatsApp con input de teléfonos) y slider/selector de tolerancia de gracia en minutos.

- [ ] **Step 3: Crear `src/components/schedules/ScheduleFleetAssigner.tsx`**
Selector de asignación (Toda la Flota, Por Categoría, Por Grupos de Vehículos, o Vehículos Individuales con buscador).

- [ ] **Step 4: Crear `src/components/schedules/ScheduleCard.tsx`**
Tarjeta de política con switch de encendido/apagado instantáneo, badges de días activos (L M M J V S D), resumen de asignación, canales activos y menú de acciones (editar, duplicar, eliminar).

- [ ] **Step 5: Crear `src/components/schedules/ViolationsTable.tsx`**
Tabla de auditoría de infracciones fuera de horario con filtros por vehículo/fecha y badges de estado y canales notificados.

- [ ] **Step 6: Crear `src/components/schedules/ScheduleModal.tsx`**
Modal organizado por pasos/pestañas (General, Franjas Semanales, Asignación de Flota, Canales de Alerta) para crear y editar políticas.

- [ ] **Step 7: Verificar compilación**
`npx tsc --noEmit`

- [ ] **Step 8: Commit**
`git add src/components/schedules && git commit -m "feat(ui): add schedule builder, alert rules and violations table components"`

---

### Task 6: Pantalla de Horarios de Uso e Integración en Sidebar

**Files:**
- Create: `src/app/dashboard/control-flota/horarios/page.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

**Interfaces:**
- Consumes: All components from `src/components/schedules/`.
- Produces: Working `/dashboard/control-flota/horarios` page and updated sidebar navigation.

- [ ] **Step 1: Modificar `src/components/layout/app-sidebar.tsx`**
Importar icono `Clock` y agregar el item `{ title: "Horarios de uso", url: "/dashboard/control-flota/horarios", icon: Clock }` en la sección "Control de Flota".

- [ ] **Step 2: Implementar `src/app/dashboard/control-flota/horarios/page.tsx`**
- KPI Summary Cards (Políticas Activas, Vehículos Cubiertos, Infracciones Detectadas, Estado del Motor).
- Barra de herramientas con buscador, filtro de estado y selector de pestañas ("Políticas de Horario" | "Historial de Infracciones").
- Grilla de tarjetas de horarios con conexión a APIs y mock fallback.
- Integración del modal de creación/edición y la tabla de infracciones.

- [ ] **Step 3: Verificar compilación**
`npx tsc --noEmit`

- [ ] **Step 4: Commit**
`git add src/app/dashboard/control-flota/horarios src/components/layout/app-sidebar.tsx && git commit -m "feat(ui): add usage schedules page and link in sidebar"`

---

### Task 7: Verificación Global y Build

- [ ] **Step 1: Ejecutar verificación completa de tipos**
`npx tsc --noEmit`

- [ ] **Step 2: Probar build de Next.js**
`npm run build`

- [ ] **Step 3: Commit final**
`git status && git commit -m "feat(control-flota): complete usage schedules and vehicle groups integration"`
