# Especificación de Diseño: Centro de Soporte Unificado, Mesa de Incidencias Multicanal y Gestión de Tickets

**Fecha:** 21 de Agosto, 2026  
**Estado:** Aprobado para Planificación e Implementación  
**Autor:** Antigravity & TrackOps Core Team  

---

## 1. Resumen Ejecutivo

El objetivo de esta funcionalidad es centralizar la recepción, clasificación, seguimiento y resolución de consultas, quejas, incidencias técnicas y pedidos de soporte en la plataforma TrackOps. 

El sistema provee dos puntos de entrada para la emisión de tickets:
1. **Header del Panel (Usuarios Autenticados):** Un botón de asistencia contextualizado para que administradores de empresa, choferes y vendedores puedan reportar fallas, dudas o reclamos asociados automáticamente a su cuenta y empresa.
2. **Footer de la Web Pública (Visitantes y Prospectos):** Un enlace "Hablar con Soporte" que despliega un modal adaptado para capturar solicitudes externas con datos de contacto verificables.

Toda esta información converge en una sección dedicada del panel de SuperAdmin: **`Centro de Soporte`** (`/panel/superadmin/soporte`), equipada con KPIs, filtros avanzados, detalle 360° del ticket, notas internas, respuestas rápidas a un clic (WhatsApp / Email) y acceso directo en **Modo Soporte** al tenant involucrado.

---

## 2. Arquitectura de Datos (`src/db/schema.ts`)

Se crea la tabla `tickets_soporte` en PostgreSQL mediante Drizzle ORM:

```typescript
export const ticketsSoporte = pgTable("tickets_soporte", {
  id: serial("id").primaryKey(),
  
  // Origen del ticket
  origen: varchar("origen", { length: 20 }).notNull().default("PANEL"), // "PANEL" | "WEB"
  
  // Relaciones opcionales (cuando el origen es PANEL)
  empresaId: integer("empresa_id").references(() => empresas.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Datos del remitente
  nombreContacto: text("nombre_contacto").notNull(),
  emailContacto: text("email_contacto").notNull(),
  telefonoContacto: varchar("telefono_contacto", { length: 50 }),
  empresaNombreManual: text("empresa_nombre_manual"), // Para origen WEB si no está vinculado
  
  // Clasificación de la incidencia
  tipo: varchar("tipo", { length: 40 }).notNull(), 
  // Valores posibles: 
  // "PROBLEMA_TECNICO" | "DISPOSITIVO_GPS" | "FACTURACION" | "QUEJA_RECLAMO" | "CONSULTA_GENERAL" | "OTRO"
  
  prioridad: varchar("prioridad", { length: 20 }).notNull().default("MEDIA"), 
  // Valores: "BAJA" | "MEDIA" | "ALTA" | "URGENTE"
  
  estado: varchar("estado", { length: 30 }).notNull().default("PENDIENTE"), 
  // Valores: "PENDIENTE" | "EN_REVISION" | "RESUELTO" | "DESCARTADO"
  
  // Contenido de la consulta
  asunto: text("asunto").notNull(),
  mensaje: text("mensaje").notNull(),
  preferenciaRespuesta: varchar("preferencia_respuesta", { length: 20 }).default("EMAIL"), 
  // "EMAIL" | "WHATSAPP" | "TELEFONO"
  
  // Gestión y resolución por Superadmin
  notasInternas: text("notas_internas"),
  resueltoPor: text("resuelto_por"), // Email o nombre del superadmin
  resueltoAt: timestamp("resuelto_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## 3. Puntos de Captura (Frontend)

### 3.1 Header del Panel (`src/app/panel/layout.tsx` + `SupportTicketHeaderButton.tsx`)
* **Ubicación:** Barra superior del panel, a la izquierda del `ThemeToggle` y perfil.
* **Componente:** `SupportTicketModal` disparado por un botón estilizado con ícono `Headphones` / `HelpCircle` y tooltip *"Contactar Soporte / Reportar Incidencia"*.
* **Comportamiento:**
  * Detecta automáticamente `userId`, `userName`, `userEmail`, `empresaId` y `empresaNombre` de la sesión.
  * Formulario con:
    * Categoría / Tipo de problema (Selector visual).
    * Nivel de urgencia / Prioridad.
    * Asunto.
    * Descripción detallada del problema.
    * Teléfono / WhatsApp de contacto (prellenado si existe).
    * Canal preferido de respuesta (Email vs WhatsApp).
  * Envío vía Server Action `createSupportTicketAction`. Toast de confirmación con número de ticket generado.

### 3.2 Footer de la Web Pública (`src/app/page.tsx` + `PublicSupportModal.tsx`)
* **Ubicación:** Footer de la landing page pública en la columna "Empresa" o botón destacado *"Hablar con Soporte"*.
* **Comportamiento:**
  * Modal elegante y accesible.
  * Campos requeridos: Nombre completo, Email de contacto, Teléfono / WhatsApp, Nombre de Empresa (opcional), Motivo de consulta y Mensaje.
  * Validación en cliente y servidor.
  * Toast y mensaje de éxito con tiempo estimado de respuesta.

---

## 4. Centro de Soporte Superadmin (`/panel/superadmin/soporte`)

### 4.1 Navegación
* Se agrega al menú lateral `superAdminNav` dentro del grupo **"Gestión de Plataforma"**:
  ```typescript
  { title: "Centro de Soporte", url: "/panel/superadmin/soporte", icon: Headphones }
  ```

### 4.2 Métricas KPI (Cards Superiores)
1. **Total Tickets:** Conteo global de incidencias registradas.
2. **Pendientes:** Tickets en estado `PENDIENTE` que requieren primera atención (con alerta visual si hay tickets `URGENTE`).
3. **En Revisión:** Tickets siendo atendidos activamente.
4. **Tasa de Resolución / Resueltos:** Cantidad de tickets resueltos vs total.

### 4.3 Tabla de Tickets e Incidencias (`SoporteTable.tsx`)
* **Buscador global:** Filtrado en tiempo real por asunto, mensaje, remitente, email o empresa.
* **Filtros avanzados:**
  * **Estado:** Todos, Pendientes, En Revisión, Resueltos, Descartados.
  * **Prioridad:** Todos, Urgente, Alta, Media, Baja.
  * **Tipo:** Problema Técnico, GPS, Facturación, Quejas, Consulta, Otros.
  * **Origen:** Todos, Panel (Clientes), Web (Público).
* **Columnas de la tabla:**
  * `#ID` & Origen (Badge `PANEL` / `WEB`).
  * `Remitente & Empresa` (Avatar + Nombre + Empresa o Badge Invitado).
  * `Asunto & Tipo` (Categoría + resumen).
  * `Prioridad` (Badges de color: Rojo para Urgente, Naranja para Alta, Azul para Media, Gris para Baja).
  * `Estado` (Badge interactivo / Dropdown rápido).
  * `Fecha Alta`.
  * `Acciones` (Ver Detalle 360°, WhatsApp rápido, Email rápido, Modo Soporte).

### 4.4 Drawer / Ficha de Gestión 360° (`TicketDetailSheet.tsx`)
Al hacer clic en un ticket, se despliega una ficha lateral completa con:
1. **Cabecera:** ID del ticket, fecha de creación, badge de origen y estado actual editable.
2. **Datos de Contacto:** Nombre, Email, Teléfono con enlace directo a `tel:` y `https://wa.me/`, Empresa asociada con link a su ficha.
3. **Cuerpo del Mensaje:** Asunto y descripción íntegra del problema o queja.
4. **Acciones Rápidas del Superadmin:**
   * **`📱 Responder por WhatsApp`:** Genera un link `wa.me/` con mensaje pre-redactado.
   * **`✉️ Responder por Email`:** Enlace `mailto:` con asunto y saludo institucional configurado.
   * **`🛠️ Entrar en Modo Soporte`:** Si el ticket pertenece a una empresa registrada, botón para ingresar inmediatamente en Modo Soporte a dicha empresa para diagnosticar el inconveniente.
5. **Notas Internas de Soporte:** Área de texto para que los operadores del Superadmin anoten avances, causas de falla o acuerdos con el cliente.
6. **Resolución:** Botón para marcar como `RESUELTO` registrando automáticamente la fecha y el operador que cerró el ticket.

---

## 5. Server Actions y Lógica de Negocio (`src/lib/soporte-actions.ts`)

1. `createSupportTicket(data: CreateTicketInput)`:
   - Valida campos obligatorios.
   - Si viene de usuario logueado, inyecta `userId` y `empresaId`.
   - Guarda el registro en `tickets_soporte`.
2. `getSupportTickets(filters?: TicketFilters)`:
   - Consulta con joins a `empresas` y `users`.
   - Soporta búsqueda y filtros combinados.
3. `updateTicketStatus(ticketId: number, estado: string, notasInternas?: string)`:
   - Actualiza estado, notas y fecha de resolución si pasa a `RESUELTO`.
4. `updateTicketPriority(ticketId: number, prioridad: string)`:
   - Modifica nivel de prioridad.
5. `saveTicketInternalNotes(ticketId: number, notas: string)`:
   - Persiste anotaciones internas del equipo.

---

## 6. Plan de Pruebas Unitarias y de Integración (`test/soporte-tickets.test.tsx`)

1. **Test del Schema & Acciones:**
   - Creación exitosa de tickets con origen `PANEL` y `WEB`.
   - Validación de tipos de prioridad y estados permitidos.
   - Actualización de estados y notas internas.
2. **Test de Componentes:**
   - Renderizado del modal de soporte en el header con datos de sesión.
   - Renderizado del formulario público en el footer web.
   - Renderizado de la tabla de soporte de Superadmin con sus filtros y badges.
   - Verificación de los enlaces rápidos a WhatsApp y Mailto.
