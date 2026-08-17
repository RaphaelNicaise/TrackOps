# Especificación de Diseño: Módulo de Geocercas Interactivas

## 1. Visión General
El módulo de Geocercas permite a los administradores de flota delimitar perímetros geográficos (polígonos o círculos) sobre el mapa en tiempo real, asignar vehículos, categorías o grupos operativos a dichas zonas, y configurar reglas automáticas de alerta (salida de zona, ingreso, límite de velocidad y horarios no autorizados).

## 2. Objetivos y Casos de Uso
1. **Edición Interactiva Directa sobre el Mapa**:
   - Mover, añadir y eliminar vértices (aristas) de polígonos arrastrando handles interactivos.
   - Trasladar polígonos enteros y redimensionar/desplazar círculos de forma fluida.
   - Herramientas flotantes para alternar entre modo dibujo (polígono/círculo), modo edición de vértices y modo navegación.
2. **Asignación Flexible de Flota**:
   - Toda la flota.
   - Por Categoría (Auto, Camioneta, Utilitario, Camión).
   - Por Vehículos específicos (multiselector con búsqueda por patente/modelo).
   - Por Grupos operativos (ej. Reparto Bahía, Turno Noche, etc.).
3. **Disparadores y Reglas de Alerta**:
   - **Salida de zona (Fuera de rango)**: Notificación instantánea cuando un vehículo asignado egresa.
   - **Ingreso a zona**: Alerta al ingresar.
   - **Límite de velocidad zonal**: Detección de excesos dentro de la geocerca.
   - **Restricción horaria / Nocturna**: Alertar si se opera fuera de horarios permitidos.
   - Canales: Alerta UI en vivo, correo electrónico a supervisores y registro de eventos.
4. **Selector de Colores y Estilos**:
   - Paleta de colores minimalistas de alta estética (Esmeralda, Azul real, Ámbar dorado, Rubí carmesí, Violeta amatista, Cian, etc.).
   - Selector personalizado HEX/RGB nativo con ajuste dinámico de opacidad de relleno y borde.
5. **Experiencia de Usuario (UX/UI)**:
   - Panel lateral desplegable/colapsable sincronizado con el mapa.
   - Formulario de creación/edición dinámico, por pasos (Identidad & Geometría -> Asignación de Flota -> Reglas & Alertas).
   - Toolbar flotante minimalista sobre el mapa con feedback visual claro del estado de edición.

---

## 3. Arquitectura de Datos

### 3.1 Esquema de Base de Datos (Drizzle ORM en `src/db/schema.ts`)
```typescript
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 20 }).default("Polígono").notNull(), // "Polígono" | "Círculo"
  color: varchar("color", { length: 30 }).default("#3b82f6").notNull(),
  opacidad: doublePrecision("opacidad").default(0.25).notNull(),
  coordenadas: text("coordenadas"), // JSON stringified [[lat, lng], ...]
  centroLat: doublePrecision("centro_lat"),
  centroLng: doublePrecision("centro_lng"),
  radio: doublePrecision("radio"), // en metros
  activa: integer("activa").default(1).notNull(), // 1 = true, 0 = false
  targetType: varchar("target_type", { length: 30 }).default("ALL").notNull(), // "ALL" | "CATEGORY" | "VEHICLES" | "GROUP"
  targetVehicles: text("target_vehicles"), // JSON array of vehicle IDs
  targetCategories: text("target_categories"), // JSON array of categories
  targetGroups: text("target_groups"), // JSON array of group names
  alertEvents: text("alert_events"), // JSON array ['EXIT', 'ENTER', 'SPEED_LIMIT', 'SCHEDULE']
  speedLimit: integer("speed_limit"), // km/h
  actionTypes: text("action_types"), // JSON array ['UI', 'EMAIL', 'WHATSAPP']
  emailRecipients: text("email_recipients"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 3.2 Tipos TypeScript (`src/types/geofence.ts`)
- `Geofence`: Interfaz tipada completa para el cliente y servidor.
- `GeofenceFormData`: Datos requeridos durante la creación/edición.
- `DrawingMode`: `'none' | 'draw_polygon' | 'draw_circle' | 'edit_vertices'`.

---

## 4. Componentes y Flujo de Interfaz

1. **`src/app/dashboard/control-flota/geocercas/page.tsx`**:
   - Contenedor principal orquestador del estado: geocercas activas, geocerca seleccionada, modo de edición (listado vs crear/editar), sincronización con el mapa.
2. **`src/components/map/GeofenceMap.tsx`**:
   - Renderizador Leaflet con soporte de edición:
     - Dibujo dinámico de polígono punto por punto (con líneas auxiliares y cursor interactivo).
     - Marcadores de vértices arrastrables (`L.Marker` con icono de handle interactivo y eventos `drag`).
     - Marcadores en puntos medios de aristas para insertar nuevos vértices con un click/drag.
     - Círculo interactivo con handle de centro (mover) y handle de radio (redimensionar).
     - Toolbar flotante sobre el mapa (Polígono, Círculo, Editar Vértices, Deshacer punto, Limpiar).
3. **`src/components/geofences/GeofenceForm.tsx`**:
   - Formulario modular por etapas:
     - **Paso 1**: Nombre, descripción, tipo de forma, selector de color preset + custom picker y slider de opacidad.
     - **Paso 2**: Selección de destinatarios (Toda la flota / Categorías / Vehículos específicos con multiselect y buscador / Grupos).
     - **Paso 3**: Reglas de activación (Alerta de Salida, Entrada, Límite de velocidad, Notificación sonora/email).
4. **`src/components/geofences/GeofenceList.tsx`**:
   - Listado lateral con tarjetas estilizadas:
     - Badge con color configurado y tipo.
     - Resumen de flota asignada y reglas activas.
     - Switch rápido de Activa/Inactiva.
     - Botones de Centrar mapa, Editar y Eliminar con confirmación.
5. **`src/app/api/geofences/route.ts` & `src/app/api/geofences/[id]/route.ts`**:
   - Endpoints REST para CRUD persistente conectado a Drizzle con soporte para sesión de usuario/empresa y datos iniciales de contingencia si no hay conexión a base de datos.

---

## 5. Casos de Prueba y Validación
- [x] Crear un polígono dibujando 3 o más puntos en el mapa y ajustar sus vértices arrastrándolos.
- [x] Crear un círculo definiendo su centro y radio arrastrando el handle perimetral o ajustando el slider.
- [x] Asignar una geocerca a una categoría ("Camión") o vehículos específicos ("Ford Ranger - AB 123 CD").
- [x] Configurar una alerta de salida ("Fuera de rango") y velocidad máxima (40 km/h).
- [x] Modificar el color con paleta preset y con picker custom HEX, visualizándolo en tiempo real sobre el mapa.
- [x] Alternar el switch activo/inactivo y verificar el cambio visual en el mapa.
