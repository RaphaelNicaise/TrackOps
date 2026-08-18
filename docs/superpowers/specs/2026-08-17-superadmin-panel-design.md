# Diseño de Arquitectura y UI: Panel de Superadmin TrackOps

**Fecha:** 17 de Agosto de 2026  
**Estado:** Propuesta de Diseño  
**Autor:** Antigravity & TrackOps Core Team  

---

## 1. Visión y Propósito

El rol de **Superadmin** en TrackOps actúa como operador global del SaaS multi-tenant. A diferencia de un `ADMIN_EMPRESA`, el Superadmin no gestiona vehículos día a día, sino que administra a las empresas clientes, supervisa la infraestructura, gestiona el embudo comercial (prospectos/leads de demo), controla la facturación SaaS y accede a las herramientas de desarrollo y operaciones.

Además, cuenta con **"Superpoderes"** (modo soporte/impersonación) para acceder a la vista administrativa de cualquier empresa cliente con el fin de auditar, configurar o dar soporte técnico.

---

## 2. Arquitectura de Navegación & Sidebar

### 2.1 Renderizado Condicional del Sidebar
El componente [app-sidebar.tsx](file:///C:/Rapha/Laburo/Prada/src/components/layout/app-sidebar.tsx) evaluará el rol de la sesión. Si `session.user.role === 'SUPER_ADMIN'`, se renderizará una barra lateral exclusiva con identidad de plataforma y los siguientes grupos de navegación:

```typescript
const superAdminNav: NavGroup[] = [
  {
    label: "Monitoreo SaaS",
    items: [
      { title: "Dashboard Global", url: "/dashboard/superadmin/dashboard", icon: LayoutDashboard }, // 🚧 En construcción
      { title: "Alertas & Salud", url: "/dashboard/superadmin/alertas", icon: Bell },             // 🚧 En construcción
    ]
  },
  {
    label: "Gestión de Plataforma",
    items: [
      { title: "Empresas Clientes", url: "/dashboard/superadmin/clientes", icon: Building2 },     // Tabla + "Superpoderes"
      { title: "Prospectos (Leads)", url: "/dashboard/superadmin/prospectos", icon: UserPlus },    // CRM de interesados en demos
      { title: "Cobros & Planes", url: "/dashboard/superadmin/facturacion", icon: CreditCard },   // Planes y suscripciones SaaS
    ]
  },
  {
    label: "Dev & Operaciones",
    items: [
      { title: "Configuración Sistema", url: "/dashboard/superadmin/dev/config", icon: Settings },
      { title: "Umami Analytics", url: "http://localhost:3002", icon: BarChart3, external: true },
      { title: "pgAdmin Database", url: "http://localhost:5050", icon: Database, external: true },
      { title: "Portainer Docker", url: "http://localhost:9000", icon: Container, external: true },
    ]
  }
];
```

### 2.2 Redirección Inicial
Al iniciar sesión como `SUPER_ADMIN` o navegar a `/dashboard`, el middleware / página raíz `/dashboard/page.tsx` redirigirá automáticamente a `/dashboard/superadmin/dashboard`.

---

## 3. Especificación de Secciones y Páginas

### 3.1 Dashboard Global (`/dashboard/superadmin/dashboard`)
* **Estado:** 🚧 *En Construcción*.
* **Contenido Visual:**
  * Banner moderno y pulido indicando estado de desarrollo del módulo de métricas SaaS.
  * Tarjetas KPI de demostración (MRR proyectado, Empresas Activas, Vehículos Totales Conectados, Ingesta de paquetes GPS por minuto).

### 3.2 Alertas & Salud del Sistema (`/dashboard/superadmin/alertas`)
* **Estado:** 🚧 *En Construcción*.
* **Contenido Visual:**
  * Vista de monitoreo global de microservicios (Backend API, Base de Datos PostGIS, MinIO Storage, Pasarela de Pagos, Ingestor GPS) con badges de estado operativo.

### 3.3 Empresas Clientes (`/dashboard/superadmin/clientes`)
* **Objetivo:** Directorio centralizado de todas las organizaciones tenant.
* **Componentes & Funcionalidades:**
  * **Barra de herramientas:** Buscador por nombre o CUIT, filtro por estado (Activa / Suspendida / Prueba) y botón "Nueva Empresa".
  * **Tabla de Empresas:**
    * *Empresa:* Nombre y logo/avatar.
    * *CUIT:* Identificación fiscal.
    * *Plan:* Starter, Pro, Enterprise con badge de color.
    * *Flota:* Cantidad de vehículos activos registrados.
    * *Estado:* Badge verde/rojo.
    * *Acciones:*
      * **Botón "Acceder como Empresa" (Superpoderes):** Botón estilizado con ícono de llave/rayo que simula el acceso directo al panel de control de esa empresa (con toast y estado interactivo optimizado).
      * **Menú de opciones:** Editar datos, cambiar plan, suspender empresa.

### 3.4 Prospectos & Leads (`/dashboard/superadmin/prospectos`)
* **Objetivo:** CRM comercial para dar seguimiento a los usuarios y empresas interesadas que solicitan demos o información en la web.
* **Campos del Prospecto:**
  * Nombre y Apellido.
  * Empresa / Organización.
  * Email y Teléfono de contacto.
  * Tamaño estimado de la flota (ej. 1-5, 6-20, 20-50, +50 vehículos).
  * Mensaje / Necesidad específica.
  * Fecha de registro.
  * Estado: `Nuevo` | `Contactado` | `Demo Agendada` | `Convertido` | `Descartado`.
  * Notas internas de seguimiento comercial.
* **Interacciones:**
  * Filtro rápido por estado (pestañas o dropdown).
  * Modal/Sheet lateral de detalle para editar notas y avanzar el estado del prospecto en el pipeline de ventas.

### 3.5 Cobros & Planes (`/dashboard/superadmin/facturacion`)
* **Objetivo:** Panel de control de ingresos y suscripciones de la plataforma SaaS.
* **Componentes:**
  * Resumen de facturación mensual agregada.
  * Catálogo de Planes de Suscripción con precios y capacidades.
  * Tabla de estado de pagos por empresa cliente con fechas de próximo vencimiento.

### 3.6 Dev & Operaciones (`/dashboard/superadmin/dev/*`)
* **Configuración del Sistema (`/dashboard/superadmin/dev/config`):**
  * Parámetros de entorno, límites globales de almacenamiento MinIO, intervalos de telemetría y modo mantenimiento.
* **Accesos Directos DevOps:**
  * **Umami Analytics:** Enlace externo / botón con ícono de salida hacia `http://localhost:3002` (Analytics web self-hosted).
  * **pgAdmin:** Enlace externo hacia `http://localhost:5050` (Consola de administración PostgreSQL/PostGIS).
  * **Portainer:** Enlace externo hacia `http://localhost:9000` (Gestión visual de contenedores Docker).

---

## 4. Estructura de Archivos a Implementar

```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx                             # Redirección inteligente por rol
│       └── superadmin/
│           ├── dashboard/
│           │   └── page.tsx                     # Dashboard Global [En construcción]
│           ├── alertas/
│           │   └── page.tsx                     # Alertas Globales [En construcción]
│           ├── clientes/
│           │   └── page.tsx                     # Gestión de Empresas + Botón Superpoderes
│           ├── prospectos/
│           │   └── page.tsx                     # CRM Leads / Demos
│           ├── facturacion/
│           │   └── page.tsx                     # Cobros y Planes SaaS
│           └── dev/
│               └── config/
│                   └── page.tsx                 # Configuración del Sistema
├── components/
│   ├── layout/
│   │   └── app-sidebar.tsx                      # Menú contextual para SUPER_ADMIN + enlaces externos
│   └── superadmin/
│       ├── clientes-table.tsx                   # Tabla interactiva con botón Superpoderes
│       ├── prospectos-table.tsx                 # Tabla y filtros CRM de leads
│       └── prospecto-detail-dialog.tsx          # Modal de seguimiento comercial
└── db/
    └── schema.ts                                # Tabla 'prospectos' (leads) para persistencia
```

---

## 5. Criterios de Aceptación

1. Al iniciar sesión con un usuario `SUPER_ADMIN`, la barra lateral muestra exclusivamente los grupos del Superadmin (*Monitoreo SaaS, Gestión de Plataforma, Dev & Operaciones*).
2. Los enlaces a **Umami** (3002), **pgAdmin** (5050) y **Portainer** (9000) abren en una pestaña nueva o redirigen correctamente con indicadores visuales claros de enlace externo.
3. Las secciones **Dashboard** y **Alertas** presentan un diseño premium con indicación de "En Construcción".
4. La sección **Clientes** lista las empresas y cuenta con el botón interactivo de "Superpoderes" para ingresar como administrador de la empresa seleccionada.
5. La sección **Prospectos** permite visualizar los datos de contacto de interesados, tamaño de flota, filtrar por estado comercial y registrar notas.
