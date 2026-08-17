# Plan de Implementación: Módulo de Geocercas Interactivas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un sistema interactivo y minimalista de geocercas sobre mapa Leaflet con edición de vértices en tiempo real (drag-and-drop), asignación de vehículos/categorías/grupos, disparadores de alertas (salida, entrada, velocidad), selector de colores preset/custom y experiencia de usuario fluida.

**Architecture:** Next.js 14 App Router + React-Leaflet con handles de vértices interactivos y toolbar flotante sobre el mapa, formulario dinámico modular por pasos con sincronización bidireccional de geometría, persistencia en Drizzle ORM PostgreSQL con soporte de fallback mock.

**Tech Stack:** Next.js 14, React 18, React-Leaflet, Leaflet, Tailwind CSS, Lucide React, Radix UI, Drizzle ORM, Vitest.

---

### Task 1: Schema de Base de Datos y Tipos TypeScript de Geocercas

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/types/geofence.ts`
- Create: `test/geofence-types.test.ts`

**Interfaces:**
- Produces: `geofences` table in `src/db/schema.ts`
- Produces: `Geofence`, `GeofenceFormData`, `GeofenceTargetType`, `GeofenceAlertEvent`, `DrawingMode` in `src/types/geofence.ts`

- [ ] **Step 1: Crear archivo de tipos `src/types/geofence.ts`**
```typescript
export type GeofenceType = "Polígono" | "Círculo";

export type GeofenceTargetType = "ALL" | "CATEGORY" | "VEHICLES" | "GROUP";

export type GeofenceAlertEvent = "EXIT" | "ENTER" | "SPEED_LIMIT" | "SCHEDULE";

export type DrawingMode = "none" | "draw_polygon" | "draw_circle" | "edit_vertices";

export interface Geofence {
  id: number;
  empresaId?: number;
  nombre: string;
  descripcion?: string;
  tipo: GeofenceType;
  color: string;
  opacidad: number;
  coordenadas?: [number, number][]; // [[lat, lng], ...]
  centro?: [number, number]; // [lat, lng]
  radio?: number; // en metros
  activa: boolean;
  targetType: GeofenceTargetType;
  targetVehicles?: number[]; // IDs de vehículos
  targetCategories?: string[]; // ej. ['Camión', 'Camioneta']
  targetGroups?: string[]; // ej. ['Logística', 'Reparto']
  alertEvents: GeofenceAlertEvent[];
  speedLimit?: number; // km/h
  actionTypes?: string[]; // ['UI', 'EMAIL']
  emailRecipients?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeofenceFormData extends Omit<Geofence, "id"> {
  id?: number;
}
```

- [ ] **Step 2: Agregar tabla `geofences` a `src/db/schema.ts`**
```typescript
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 20 }).default("Polígono").notNull(),
  color: varchar("color", { length: 30 }).default("#3b82f6").notNull(),
  opacidad: doublePrecision("opacidad").default(0.25).notNull(),
  coordenadas: text("coordenadas"),
  centroLat: doublePrecision("centro_lat"),
  centroLng: doublePrecision("centro_lng"),
  radio: doublePrecision("radio"),
  activa: integer("activa").default(1).notNull(),
  targetType: varchar("target_type", { length: 30 }).default("ALL").notNull(),
  targetVehicles: text("target_vehicles"),
  targetCategories: text("target_categories"),
  targetGroups: text("target_groups"),
  alertEvents: text("alert_events"),
  speedLimit: integer("speed_limit"),
  actionTypes: text("action_types"),
  emailRecipients: text("email_recipients"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Escribir prueba unitaria `test/geofence-types.test.ts` y verificar con `npm run test`**

- [ ] **Step 4: Commit**
```bash
git add src/types/geofence.ts src/db/schema.ts test/geofence-types.test.ts
git commit -m "feat(geocercas): add geofences schema and typescript types"
```

---

### Task 2: API Endpoints para CRUD de Geocercas con Persistencia y Fallback

**Files:**
- Create: `src/app/api/geofences/route.ts`
- Create: `src/app/api/geofences/[id]/route.ts`
- Create: `src/app/api/geofences/[id]/toggle/route.ts`
- Create: `src/lib/mock-geofences.ts`

**Interfaces:**
- `GET /api/geofences` -> returns `Geofence[]`
- `POST /api/geofences` -> body: `GeofenceFormData`, returns created `Geofence`
- `PUT /api/geofences/[id]` -> body: `GeofenceFormData`, returns updated `Geofence`
- `DELETE /api/geofences/[id]` -> returns `{ success: true }`
- `PATCH /api/geofences/[id]/toggle` -> returns updated `Geofence`

- [ ] **Step 1: Crear `src/lib/mock-geofences.ts` con datos iniciales enriquecidos y helpers CRUD en memoria**
- [ ] **Step 2: Implementar rutas API en `src/app/api/geofences/route.ts` y subrutas**
- [ ] **Step 3: Verificar compilación y respuestas esperadas con tests**
- [ ] **Step 4: Commit**
```bash
git add src/lib/mock-geofences.ts src/app/api/geofences/
git commit -m "feat(geocercas): implement geofences CRUD API routes"
```

---

### Task 3: Mapa Leaflet Interactivo: Editor de Vértices, Aristas y Toolbar Flotante

**Files:**
- Modify: `src/components/map/GeofenceMap.tsx`

**Interfaces:**
- Props:
  - `geofences: Geofence[]`
  - `activeGeofenceId: number | null`
  - `isEditing: boolean`
  - `draftGeofence: GeofenceFormData | null`
  - `onDraftChange?: (draft: GeofenceFormData) => void`
  - `drawingMode: DrawingMode`
  - `setDrawingMode: (mode: DrawingMode) => void`
  - `onSelectGeofence?: (id: number) => void`

- [ ] **Step 1: Diseñar handles de vértices arrastrables con Leaflet Marker y Custom DivIcon**
  - Cada vértice del polígono editable genera un `L.Marker` con evento `drag` y `dragend`.
  - Al arrastrar el vértice, se actualiza el array `coordenadas` en tiempo real.
  - Insertar handles en los puntos medios (`midpoint`) que al arrastrarse insertan un nuevo vértice en esa arista.
  - Click secundario (o botón 'x') en un handle elimina el vértice si hay más de 3 vértices.
  - Manejo interactivo de Círculo: marcador de centro para mover la geocerca y marcador perimetral para redimensionar el radio.
- [ ] **Step 2: Implementar modo dibujo de polígono y círculo**
  - Click en mapa agrega puntos sucesivos si `drawingMode === 'draw_polygon'`.
  - Doble click o click en el primer punto finaliza el trazado.
  - Guía visual interactiva (línea punteada hacia el cursor y polígono con opacidad).
- [ ] **Step 3: Construir barra flotante de herramientas de mapa (`MapToolbar`)**
  - Herramientas: 🔷 Polígono, ⭕ Círculo, ✏️ Editar Vértices, ✋ Desplazar, ↩️ Deshacer punto, 🗑️ Limpiar trazo.
- [ ] **Step 4: Commit**
```bash
git add src/components/map/GeofenceMap.tsx
git commit -m "feat(geocercas): implement interactive vertex editing and drawing tools on map"
```

---

### Task 4: Formulario Dinámico y Minimalista de Creación/Edición con Paleta de Colores y Asignación de Flota

**Files:**
- Create: `src/components/geofences/GeofenceForm.tsx`
- Create: `src/components/geofences/ColorPickerCustom.tsx`
- Create: `src/components/geofences/FleetAssigner.tsx`
- Create: `src/components/geofences/AlertRulesConfig.tsx`

**Interfaces:**
- `GeofenceForm`:
  - `initialData?: Geofence`
  - `draftData: GeofenceFormData`
  - `onChange: (data: GeofenceFormData) => void`
  - `onSave: () => Promise<void>`
  - `onCancel: () => void`
  - `drawingMode: DrawingMode`
  - `setDrawingMode: (mode: DrawingMode) => void`

- [ ] **Step 1: Crear `ColorPickerCustom.tsx` con presets de alta gama + input HEX nativo + slider de opacidad**
  - Presets: Esmeralda (#10B981), Azul Eléctrico (#3B82F6), Ámbar TrackOps (#F2B705), Rubí Carmesí (#EF4444), Violeta (#8B5CF6), Cian Marino (#06B6D4), Naranja Fuego (#F97316), Grafito (#475569).
  - Selector HEX/Color Picker HTML5 libre + slider de opacidad (10% a 80%).
- [ ] **Step 2: Crear `FleetAssigner.tsx` con pestañas: Toda la Flota, Por Categoría, Por Vehículos específicos (multiselect con tags y búsqueda) y Por Grupos**
- [ ] **Step 3: Crear `AlertRulesConfig.tsx` con switches estilizados para Alerta de Salida (Fuera de Rango), Entrada a Zona, Límite de Velocidad Máxima en Zona, y Canales de Aviso (Dashboard, Email)**
- [ ] **Step 4: Integrar todo en `GeofenceForm.tsx` con navegación fluida por pasos y validación clara**
- [ ] **Step 5: Commit**
```bash
git add src/components/geofences/
git commit -m "feat(geocercas): create dynamic geofence form with color picker and fleet assigner"
```

---

### Task 5: Integración y Rediseño Total de la Página de Geocercas

**Files:**
- Modify: `src/app/dashboard/control-flota/geocercas/page.tsx`
- Create: `src/components/geofences/GeofenceCard.tsx`

- [ ] **Step 1: Crear `GeofenceCard.tsx` con diseño moderno:**
  - Color badge interactivo, badge de tipo, estado activo/inactivo con switch rápido, contador de vehículos asignados, tags de reglas de alerta, botones de foco/zoom, editar y eliminar con diálogo de confirmación.
- [ ] **Step 2: Rediseñar `src/app/dashboard/control-flota/geocercas/page.tsx`:**
  - Panel lateral colapsable de alta estética con búsqueda rápida, filtros por tipo y estado.
  - Transición fluida entre vista de listado y modo formulario de edición/creación.
  - Sincronización completa con el mapa (al clickear una geocerca, hace zoom fluido y la resalta; al editar, activa los vértices interactivos).
  - Manejo de estados de carga, guardado y feedback interactivo.
- [ ] **Step 3: Commit**
```bash
git add src/app/dashboard/control-flota/geocercas/page.tsx src/components/geofences/GeofenceCard.tsx
git commit -m "feat(geocercas): complete page integration and modern sidebar UX"
```

---

### Task 6: Pruebas, Verificación y Control de Calidad

- [ ] **Step 1: Ejecutar tests unitarios de geocercas (`npm run test`)**
- [ ] **Step 2: Ejecutar verificación de tipos y compilación con `npm run build`**
- [ ] **Step 3: Validar que todas las interacciones (arrastre de vértices, creación de polígono/círculo, cambio de color, asignación y alertas) funcionen sin errores**
- [ ] **Step 4: Commit final**
```bash
git add .
git commit -m "feat(geocercas): verify build, tests and polish UI interactions"
```
