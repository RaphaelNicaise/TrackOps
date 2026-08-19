# Especificación de Diseño: Horarios de Uso y Grupos de Vehículos

**Fecha:** 2026-08-18  
**Módulo:** Control de Flota (`/dashboard/control-flota/horarios` y `/dashboard/control-flota/grupos`)  
**Estado:** Propuesta Aprobada  

---

## 1. Resumen Ejecutivo
El módulo de **Horarios de Uso** permite a los administradores de flota definir franjas horarias semanales autorizadas para la operación de vehículos, asociar estas políticas a vehículos individuales, categorías o grupos operativos, y configurar alertas multi-canal (Plataforma, Correo Electrónico y WhatsApp) para notificar inmediatamente si un vehículo es conducido fuera del horario permitido.

Complementariamente, se implementa la sección de **Grupos de Vehículos** para organizar la flota en agrupaciones lógicas operativas (ej. Logística Urbana, Reparto Mañana, Mantenimiento, Larga Distancia), facilitando la asignación masiva de horarios y geocercas.

---

## 2. Objetivos y Criterios de Éxito
1. **Definición flexible de horarios:** Configurar reglas semanales día a día (Lunes a Domingo) con soporte para múltiples intervalos en un mismo día (ej. turno mañana `08:00-12:00` y turno tarde `14:00-18:00`), y días bloqueados (ej. fines de semana).
2. **Asignación multi-nivel:** Asignar políticas de horarios a:
   - Toda la flota
   - Categorías de vehículos (Camión, Auto, Utilitario, etc.)
   - Grupos de flota (Logística Urbana, etc.)
   - Vehículos individuales específicos con buscador interactivo
3. **Gestión de Grupos de Vehículos:** Crear, editar, etiquetar con colores/iconos y gestionar los vehículos miembros de cada grupo operativo.
4. **Configuración de Alertas Multi-Canal:** Habilitar canales de notificación (Notificación In-App, Email y WhatsApp) con tolerancia de gracia en minutos (ej. 5 o 10 min) antes de disparar la alerta.
5. **Historial de Infracciones:** Registrar y visualizar eventos de uso no autorizado fuera de horario con fecha, hora, duración, vehículo y canales notificados.
6. **Resiliencia:** Operatividad fluida tanto con base de datos PostgreSQL conectada como con fallback de mock data para desarrollo y testing.

---

## 3. Modelo de Datos (Drizzle ORM)

### Tablas a incorporar en `src/db/schema.ts`

```typescript
// 1. Grupos de vehículos
export const vehicleGroups = pgTable("vehicle_groups", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  color: varchar("color", { length: 30 }).default("#3b82f6").notNull(),
  icono: varchar("icono", { length: 50 }).default("truck").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Miembros de grupos de vehículos
export const vehicleGroupMembers = pgTable("vehicle_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => vehicleGroups.id, { onDelete: "cascade" }).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Políticas de Horarios de Uso
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  color: varchar("color", { length: 30 }).default("#F2B705").notNull(),
  activo: integer("activo").default(1).notNull(), // 1 = activo, 0 = inactivo
  diasConfig: text("dias_config").notNull(), // JSON con configuración semanal por día
  toleranciaMinutos: integer("tolerancia_minutos").default(5).notNull(),
  targetType: varchar("target_type", { length: 30 }).default("ALL").notNull(), // ALL, CATEGORY, GROUP, VEHICLES
  targetVehicles: text("target_vehicles"), // JSON array de IDs
  targetCategories: text("target_categories"), // JSON array de strings
  targetGroups: text("target_groups"), // JSON array de IDs de grupos
  alertChannels: text("alert_channels").default('["UI"]').notNull(), // JSON array ["UI", "EMAIL", "WHATSAPP"]
  emailRecipients: text("email_recipients"),
  whatsappRecipients: text("whatsapp_recipients"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Historial de Infracciones Fuera de Horario
export const scheduleViolations = pgTable("schedule_violations", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  scheduleId: integer("schedule_id").references(() => schedules.id, { onDelete: "set null" }),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: "cascade" }).notNull(),
  patente: varchar("patente", { length: 20 }).notNull(),
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin"),
  duracionMinutos: integer("duracion_minutos").default(0),
  velocidadMaxima: doublePrecision("velocidad_maxima").default(0),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  notificadoEmail: integer("notificado_email").default(0).notNull(),
  notificadoWhatsapp: integer("notificado_whatsapp").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 4. Tipos TypeScript (`src/types/schedule.ts`)

```typescript
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface TimeSlot {
  start: string; // formato "HH:mm" ej. "08:00"
  end: string;   // formato "HH:mm" ej. "18:00"
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

---

## 5. Arquitectura de Endpoints API

1. **`/api/schedules`**
   - `GET`: Lista todas las políticas de horario de la empresa (o mock data si no hay DB).
   - `POST`: Crea una nueva política de horario.
2. **`/api/schedules/[id]`**
   - `GET`: Obtiene una política por ID.
   - `PUT`: Actualiza la configuración, franjas o asignaciones de la política.
   - `DELETE`: Elimina la política.
3. **`/api/schedules/[id]/toggle`**
   - `PATCH`: Activa/desactiva rápidamente una política.
4. **`/api/schedules/violations`**
   - `GET`: Retorna el historial de infracciones registradas.
5. **`/api/vehicle-groups`**
   - `GET`: Lista de grupos con sus vehículos asociados.
   - `POST`: Crea un nuevo grupo.
6. **`/api/vehicle-groups/[id]`**
   - `PUT`: Actualiza el grupo y los vehículos miembros.
   - `DELETE`: Elimina el grupo.

---

## 6. Arquitectura de Componentes y Páginas

### 1. `src/components/layout/app-sidebar.tsx`
- Se agrega el enlace a `/dashboard/control-flota/horarios` con el icono `Clock` bajo "Control de Flota".
- Se vincula `/dashboard/control-flota/grupos` con la nueva pantalla interactiva.

### 2. `src/app/dashboard/control-flota/horarios/page.tsx`
- **KPI Summary Cards:**
  - Políticas Activas (contador y porcentaje)
  - Cobertura de Flota (vehículos con horario asignado vs total)
  - Infracciones de Hoy (alertas de uso no permitido)
  - Estado del Sistema (indicador de motor activo)
- **Barra de Herramientas:** Buscador, Filtros de Estado, Selector de Pestañas ("Políticas de Horario" | "Historial de Infracciones"), y Botón "+ Nuevo Horario".
- **Schedule Card Grid:** Tarjetas con selector de estado on/off, visualizador de días activos (L M M J V S D), franja horaria actual, grupo/vehículos asignados y canales de notificación configurados.
- **`ScheduleModalForm`:**
  - Pestañas/Pasos: Información General, Planificador Semanal (día por día con franjas personalizadas y duplicado rápido), Asignación de Flota (componente selector interactivo), y Canales de Alerta (UI, Email, WhatsApp y tolerancia de gracia).
- **`ViolationsTable`:** Tabla con búsqueda y filtros para revisar las salidas de horario registradas.

### 3. `src/app/dashboard/control-flota/grupos/page.tsx`
- Grid de grupos de vehículos con contadores de unidades, colores e iconos personalizados.
- Modal de creación/edición de grupos con selector múltiple de vehículos por patente y modelo.

---

## 7. Plan de Verificación
- Verificación de tipos TypeScript (`tsc --noEmit`).
- Verificación de renderizado y navegación en el Sidebar.
- Creación, edición, activación/desactivación y eliminación de políticas de horario.
- Asignación de vehículos individuales, grupos y categorías.
- Configuración de alertas por UI, Email y WhatsApp con tolerancia.
- Gestión completa de grupos de vehículos y sincronización de miembros.
