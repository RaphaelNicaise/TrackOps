# Especificación de Diseño: Sistema de Alertas Multicanal (WhatsApp & Email)

**Fecha:** 2026-08-19  
**Estado:** Aprobado para Planificación  
**Autor:** Antigravity  

---

## 1. Visión General y Objetivos

El objetivo de esta funcionalidad es establecer una infraestructura centralizada y robusta para la gestión y despacho de alertas en la plataforma Prada. El sistema soporta el envío de notificaciones tanto por correo electrónico (**Email**) como por mensajería instantánea (**WhatsApp**) hacia los supervisores o administradores de la empresa.

### Objetivos Clave:
1. **Configuración de Destinos y Módulos:** Permitir que cada empresa configure 1 correo electrónico y 1 número de WhatsApp para recibir alertas, conmutar canales (on/off), definir tolerancias y seleccionar qué módulos específicos tienen permitido emitir alertas.
2. **Motor Central Despachador de Alertas (`Alert Dispatcher`):** Un punto único de entrada para disparar cualquier alerta desde cualquier parte de la aplicación, encargado de validar las preferencias de la empresa, formatear mensajes claros para Email y WhatsApp, registrar logs explícitos en consola y almacenar el historial en la base de datos.
3. **Integración en Módulos Existentes:** Habilitar disparadores de alertas contextuales para:
   - **Documentación de Flota:** Vencimientos de VTV, RTO, Seguro (próximos o vencidos).
   - **Mantenimiento Preventivo:** Kilometraje de service alcanzado o excedido.
   - **Geocercas:** Salida de perímetro, ingreso y excesos de velocidad en zona.
   - **Control de Horarios:** Infracciones de circulación fuera de horario o días permitidos.
4. **Consola de Monitoreo e Historial de Alertas:** Página operativa en `/dashboard/monitoreo/alertas` con métricas, historial de despachos, vista de detalle de mensaje enviado, filtros avanzados (por patente, módulo, canal, severidad) y navegación directa desde la ficha del vehículo en el mapa.

---

## 2. Modelo de Datos y Esquema

### 2.1 Actualización de `alert_configs` (`src/db/schema.ts`)
La tabla de configuración de alertas por empresa se enriquece con el campo de módulos habilitados:

```typescript
export const alertConfigs = pgTable("alert_configs", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  canalEmail: integer("canal_email").default(1).notNull(), // 1 = activo, 0 = inactivo
  canalWhatsapp: integer("canal_whatsapp").default(0).notNull(), // 1 = activo, 0 = inactivo
  emailDestino: text("email_destino"), // 1 email configurado
  telefonoWhatsapp: varchar("telefono_whatsapp", { length: 20 }), // 1 teléfono (ej. +5491140001111)
  toleranciaKm: integer("tolerancia_km").default(500), // Kms de anticipación para avisos de service
  toleranciaDias: integer("tolerancia_dias").default(15), // Días de anticipación para vencimiento de documentos
  modulosHabilitados: text("modulos_habilitados").default('["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]').notNull(),
  activo: integer("activo").default(1).notNull(), // Master switch global
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2.2 Nueva Tabla `alert_logs` (`src/db/schema.ts`)
Almacena el registro histórico de cada alerta despachada o simulada:

```typescript
export const alertLogs = pgTable("alert_logs", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  modulo: varchar("modulo", { length: 50 }).notNull(), // 'MANTENIMIENTO' | 'DOCUMENTACION' | 'GEOCERCAS' | 'HORARIOS' | 'SISTEMA'
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'SERVICE_VENCIDO' | 'DOC_POR_VENCER' | 'GEOCERCA_SALIDA' | etc.
  severidad: varchar("severidad", { length: 20 }).default("MEDIA").notNull(), // 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  titulo: text("titulo").notNull(),
  mensaje: text("mensaje").notNull(),
  canal: varchar("canal", { length: 30 }).notNull(), // 'EMAIL' | 'WHATSAPP' | 'AMBOS' | 'SISTEMA'
  destinatarioEmail: text("destinatario_email"),
  destinatarioWhatsapp: varchar("destinatario_whatsapp", { length: 50 }),
  vehiculoId: integer("vehiculo_id").references(() => vehicles.id, { onDelete: "set null" }),
  patente: varchar("patente", { length: 20 }),
  metadata: text("metadata"), // JSON string con datos específicos del evento
  estado: varchar("estado", { length: 30 }).default("MOCK_DISPATCHED").notNull(), // 'MOCK_DISPATCHED' | 'ENVIADO' | 'FALLIDO'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 3. Motor Central Despachador de Alertas (`src/lib/alerts/dispatcher.ts`)

### 3.1 Interfaz de Entrada
```typescript
export type AlertModule = "MANTENIMIENTO" | "DOCUMENTACION" | "GEOCERCAS" | "HORARIOS" | "SISTEMA";
export type AlertSeverity = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export interface DispatchAlertParams {
  empresaId: number;
  modulo: AlertModule;
  tipo: string;
  severidad?: AlertSeverity;
  titulo: string;
  mensaje: string;
  vehiculoId?: number;
  patente?: string;
  metadata?: Record<string, any>;
}
```

### 3.2 Lógica de Despacho
1. Recupera la configuración de la empresa desde `alert_configs`.
2. Verifica que `activo === 1`.
3. Comprueba si `modulo` está incluido en `modulosHabilitados`. Si no lo está, cancela el envío y loguea la exclusión.
4. Identifica canales a enviar:
   - **Email:** Si `canalEmail === 1` y `emailDestino` está definido.
   - **WhatsApp:** Si `canalWhatsapp === 1` y `telefonoWhatsapp` está definido.
5. Emite log formateado en la consola del servidor:
   ```text
   ══════════════════════════════════════════════════════════════
   🚨 [ALERT DISPATCH] Módulo: MANTENIMIENTO | Severidad: ALTA
   🚗 Vehículo: AB 123 CD (ID: 4)
   📋 Asunto: Service de Mantenimiento Requerido
   📝 Mensaje: El vehículo AB 123 CD superó el kilometraje establecido (95.450 km / límite 95.000 km).
   ✉️  EMAIL DESTINO   -> supervisor@empresa.com
   📱 WHATSAPP DESTINO -> +5491140001111
   ══════════════════════════════════════════════════════════════
   ```
6. Inserta el registro en `alert_logs` con `estado = "MOCK_DISPATCHED"`.
7. Retorna `{ success: true, dispatchedChannels: string[], logId: number }`.

---

## 4. Disparadores de Alertas por Módulo

### 4.1 Documentación y Vencimientos
- **Trigger:** Evaluación de documentos de vehículos (`vehicle_documents` y campo `rto`).
- **Condiciones:**
  - `fechaVencimiento <= now()` -> `DOC_VENCIDO` (Severidad: `ALTA`).
  - `fechaVencimiento <= now() + toleranciaDias días` -> `DOC_POR_VENCER` (Severidad: `MEDIA`).

### 4.2 Mantenimiento Preventivo
- **Trigger:** Evaluación de planes de mantenimiento (`maintenance_plans`) contra `vehicles.kilometrajeActual`.
- **Condiciones:**
  - `kilometrajeActual >= ultimoServiceKm + intervaloKm` -> `SERVICE_VENCIDO` (Severidad: `ALTA`).
  - `kilometrajeActual >= ultimoServiceKm + intervaloKm - toleranciaKm` -> `SERVICE_PROXIMO` (Severidad: `MEDIA`).

### 4.3 Geocercas
- **Trigger:** Eventos de telemetría / violación perimetral (`geofences`).
- **Condiciones:**
  - Salida de zona perimetral autorizada -> `GEOCERCA_SALIDA` (Severidad: `ALTA`).
  - Ingreso a zona no autorizada -> `GEOCERCA_INGRESO` (Severidad: `MEDIA`).
  - Velocidad actual > límite configurado en geocerca -> `EXCESO_VELOCIDAD_ZONA` (Severidad: `ALTA`).

### 4.4 Control de Horarios
- **Trigger:** Infracciones de horario (`schedule_violations` / `schedules`).
- **Condiciones:**
  - Movimiento del vehículo fuera de la franja horaria / día laboral estipulado -> `HORARIO_NO_AUTORIZADO` (Severidad: `CRITICA`).

---

## 5. Diseño de Interfaz de Usuario

### 5.1 Configuración de Alertas (`/dashboard/administracion/configuracion`)
- **Canales y Destinos:**
  - Campo de Email único con validación de formato.
  - Campo de WhatsApp con prefijo internacional e indicación de formato (`+54 9 11 ...`).
  - Switches individuales para activar/desactivar Email y WhatsApp.
  - Switch maestro para activar/desactivar todo el sistema de alertas.
- **Selector de Módulos Habilitados:**
  - Switches para habilitar/deshabilitar alertas de: Mantenimiento, Documentación, Geocercas, Horarios.
- **Tolerancias:**
  - Inputs numéricos para anticipación de kms y días.
- **Disparador de Prueba / Simulador:**
  - Botón *"Disparar Alerta de Prueba"* con feedback inmediato vía modal/toast y confirmación del log emitido.

### 5.2 Consola de Monitoreo e Historial (`/dashboard/monitoreo/alertas`)
- **Filtros Reactivos:**
  - Filtro por patente/vehículo (lee `searchParams.get("patente")`).
  - Filtro por Módulo (`Todos`, `Mantenimiento`, `Documentación`, `Geocercas`, `Horarios`).
  - Filtro por Canal (`Todos`, `Email`, `WhatsApp`).
  - Filtro por Severidad (`Todas`, `Crítica`, `Alta`, `Media`, `Baja`).
  - Input de búsqueda libre.
- **KPI Cards:**
  - Total Alertas Emitidas, Alertas Críticas / Altas, Envíos a WhatsApp, Envíos a Email.
- **Tabla de Registros:**
  - Fecha y hora, Vehículo / Patente, Módulo, Tipo, Canales y Destinatarios, Mensaje (truncado), Botón para ver detalle completo en modal.
- **Modal de Detalle:**
  - Muestra el texto exacto enviado a cada canal, destinatario, metadatos JSON y timestamp.

### 5.3 Enlace desde Mapa y Vehículos
- En el popup / panel lateral del móvil en el Mapa (`/dashboard/mapa`) y en la página de Vehículos (`/dashboard/control-flota/vehiculos/[id]`), se incluye un botón directo *"Ver Alertas"* que redirige a `/dashboard/monitoreo/alertas?patente=XYZ`.

---

## 6. Pruebas y Verificación

1. **Prueba de Configuración:** Modificar email, WhatsApp y módulos activos en `/dashboard/administracion/configuracion`, guardar y verificar persistencia.
2. **Prueba de Despacho (Simulación):** Ejecutar alerta de prueba y verificar:
   - Salida en terminal con formato `[ALERT DISPATCH]`.
   - Nuevo registro en la tabla `alert_logs`.
   - Visualización inmediata en `/dashboard/monitoreo/alertas`.
3. **Prueba de Filtro por Vehículo:** Hacer clic en "Ver Alertas" de un vehículo específico y comprobar que `/dashboard/monitoreo/alertas?patente=XYZ` filtra correctamente.
4. **Prueba de Restricción de Módulos:** Desactivar un módulo en configuración y comprobar que sus alertas no son despachadas.
