# Especificación de Diseño: Sistema de Creación de Empresas, Gestión 360°, Impersonación de Superadmin y Onboarding

**Fecha:** 21 de Agosto, 2026  
**Estado:** Aprobado para Planificación e Implementación  
**Autor:** Antigravity &amp; TrackOps Core Team  

---

## 1. Resumen Ejecutivo

El objetivo de este sistema es dotar a la plataforma TrackOps de un mecanismo centralizado y robusto para la creación manual de inquilinos (empresas) desde el panel de SuperAdmin, la asignación y gestión de credenciales con cambio obligatorio de contraseña en el primer inicio de sesión, un modo de acceso directo para soporte ("Superpoderes" / Impersonation) y una experiencia guiada de Setup / Onboarding para las empresas recién creadas.

---

## 2. Arquitectura de Datos y Autenticación

### 2.1 Esquema de Base de Datos (`src/db/schema.ts`)

#### Tabla `empresas` (Ampliación)

```typescript
export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cuit: varchar("cuit", { length: 20 }),
  email: text("email"),
  telefono: varchar("telefono", { length: 50 }),
  direccion: text("direccion"),
  ciudad: text("ciudad"),
  provincia: text("provincia"),
  setupCompletado: integer("setup_completado").default(0).notNull(), // 0 = pendiente, 1 = completado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### Tabla `users` (Ampliación)

```typescript
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 30 }).default("CHOFER").notNull(), // SUPER_ADMIN, ADMIN_EMPRESA, CHOFER, VENDEDOR_INSTALADOR
  empresaId: integer("empresa_id").references(() => empresas.id),
  mustChangePassword: integer("must_change_password").default(0).notNull(), // 1 = debe cambiar en 1er login
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2.2 Flujo de Autenticación y Cambio Obligatorio de Contraseña

1. Al autenticarse en `/auth/login` con email y contraseña:
  - NextAuth valida el hash bcrypt en `src/auth.ts`.
  - El token JWT y la sesión reciben la propiedad `mustChangePassword`.
2. Si `session.user.mustChangePassword === 1`:
  - El usuario es interceptado por un modal o pantalla dedicada de **"Seguridad de la Cuenta - Actualización Obligatoria de Contraseña"**.
  - El formulario incluye:
    - Indicador dinámico de seguridad (longitud, caracteres especiales, números, mayúsculas).
    - Validación doble de coincidencia exacta.
    - Botones de visualización de contraseña.
  - Al confirmar, se invoca `changeInitialPassword(newPassword)` que actualiza el hash bcrypt, apaga el flag `mustChangePassword = 0`, refresca la sesión y da la bienvenida al dashboard.

---

## 3. Módulo de Creación de Empresas en Superadmin

### 3.1 Formulario de Alta (`EmpresaFormDialog`)

Campos organizados por bloques semánticos:

1. **Datos de la Empresa**:
  - Razón Social / Nombre Comercial (`nombre` - obligatorio).
  - CUIT / Identificación Tributaria (`cuit` - formato argentino).
  - Email de Contacto / Notificaciones (`email`).
  - Teléfono / WhatsApp de contacto (`telefono`).
  - Dirección, Ciudad y Provincia.
2. **Plan y Términos SaaS**:
  - Selección de Plan: Starter (hasta 5 veh), Pro (hasta 25 veh), Enterprise (100+ veh / cotización a medida).
  - Método de cobro inicial (Transferencia / Mercado Pago).
3. **Credenciales del Administrador Principal**:
  - Nombre completo del responsable.
  - Correo electrónico de acceso.
  - Contraseña inicial manual (con campo de verificación y toggle de visibilidad).

### 3.2 Transacción Atómica de Alta (`createEmpresaWithAdmin`)

Al enviar el formulario:

1. Inserta el registro en `empresas`.
2. Hashea la contraseña con `bcryptjs` e inserta el usuario con rol `ADMIN_EMPRESA`, `empresaId` asociado y `mustChangePassword = 1`.
3. Crea el registro en `empresaSubscriptions` vinculado al plan seleccionado.
4. Inicializa el registro de `alertConfigs` para la empresa (canales email y whatsapp).
5. Registra la auditoría en `auditLogs`.
6. Retorna un modal de confirmación con:
  - Resumen de la empresa.
  - Tarjeta de credenciales con botón **"Copiar para WhatsApp / Email"**.
  - Botón directo **"⚡ Entrar con Superpoderes"**.

---

## 4. Modo Superpoderes (Superadmin Impersonation)

### 4.1 Mecanismo de Impersonación

- El SuperAdmin puede ingresar a cualquier empresa desde la tabla de clientes o la ficha.
- Acción `enterTenantAsSuperadmin(empresaId)`:
  1. Verifica que la sesión activa pertenezca a un `SUPER_ADMIN`.
  2. Establece una cookie segura HTTP-only `trackops_impersonate_tenant_id = empresaId`.
  3. Redirige a `/dashboard`.
- Helper `getEffectiveTenantId()`:
  - Si el usuario es `ADMIN_EMPRESA` o `CHOFER`, devuelve `session.user.empresaId`.
  - Si el usuario es `SUPER_ADMIN`, verifica si la cookie `trackops_impersonate_tenant_id` está presente: si existe, devuelve ese `empresaId`; si no, opera en modo global.

### 4.2 Interfaz de Usuario durante el Modo Superpoderes

- **Banner Superior Fijo**:
  - Indicador visual prominente y sobrio: `⚡ MODO SUPERPODERES ACTIVO · Viendo como: [Nombre Empresa] (#ID)`.
  - Botón directo para acceder a la configuración de la empresa.
  - Botón **"Salir y Volver al Superadmin"** que invoca `exitSuperadminImpersonation()`, remueve la cookie y redirige a `/dashboard/superadmin/clientes`.
- Todas las vistas operan en el contexto del tenant impersonado (Gestión de flota, Mantenimientos, Combustible, Geocercas, Alertas, Usuarios).

---

## 5. Asistente de Setup / Onboarding de la Empresa

### 5.1 Tarjeta de Progreso Interactivo (`OnboardingSetupCard`)

Visible en la parte superior del Dashboard de la empresa cuando `setupCompletado === 0`:

1. **Paso 1: Configurar Canales de Alerta**:
  - Teléfono de WhatsApp y Email para recibir avisos de mantenimiento y vencimientos de VTV/seguros.
2. **Paso 2: Cargar Primeros Vehículos**:
  - Carga individual ágil o importación masiva por archivo Excel/CSV.
3. **Paso 3: Agregar Choferes / Personal**:
  - Asignar usuarios con roles de chofer o vendedores/instaladores de GPS.
4. **Paso 4: Definir Matriz de Mantenimiento Preventivo**:
  - Ajustar intervalos de service (aceite, neumáticos, frenos).
  - Barra de progreso porcentual (25%, 50%, 75%, 100%).
  - Botón para marcar el setup como completado o finalizarlo más tarde.

---

## 6. Ficha Detallada 360° en SuperAdmin (`EmpresaDetailSheet`)

Panel lateral (Sheet / Drawer) que permite inspeccionar cualquier inquilino sin salir de la lista:

- **Pestaña General**: Datos fiscales, contacto, ubicación, fecha de registro y estado de suscripción.
- **Pestaña Flota**: Conteo de vehículos, tipos (camiones, utilitarios, autos) y estado del odómetro.
- **Pestaña Usuarios**: Lista de usuarios registrados en la empresa, con opción de generar reseteo de contraseña de emergencia.
- **Pestaña Alertas**: Configuración activa de canales Email y WhatsApp.
- **Acciones Rápidas**: Acceder con Superpoderes, Suspender / Reactivar Empresa, Editar Datos.

