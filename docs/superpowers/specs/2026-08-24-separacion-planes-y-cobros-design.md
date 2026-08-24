# Design Spec: Separación de Catálogo de Planes y Módulo de Cobros

## 1. Contexto & Objetivo
Actualmente la pantalla `/panel/superadmin/facturacion` agrupa tanto los KPIs financieros (MRR, ARR, ARPU, Tasa de Cobro), el catálogo interactivo de Planes de Suscripción con su barra escalonada y la tabla de Cobranzas por inquilino.
El requerimiento solicita:
1. **Módulo Planes** (`/panel/superadmin/planes`):
   - Ubicado bajo **Gestión de Plataforma** en la barra lateral.
   - **Sin KPIs** en la cabecera.
   - Enfocado 100% en el catálogo de planes: barra visual de rangos de flota, toggle mensual/anual, botón para crear planes (`createSubscriptionPlan`), tabla de planes activos con edición (`updateSubscriptionPlan`) y eliminación (`deleteSubscriptionPlan`).
2. **Módulo Cobros** (`/panel/superadmin/cobros` y `/panel/superadmin/facturacion`):
   - Ubicado bajo **Gestión de Plataforma** en la barra lateral.
   - **Con los 4 KPIs superiores**: MRR (Ingreso Mensual), ARR (Proyección Anual), ARPU (Ticket Promedio), Tasa de Cobro al Día / Estado de Inquilinos.
   - Filtros rápidos por estado de pago (Todos, Al día, Por vencer, Vencidos, Suspendidos) + Buscador en tiempo real.
   - Tabla completa de cobranzas con modal de registro de pago y visor de recibo/factura imprimible.
3. **Barra Lateral (`app-sidebar.tsx`)**:
   - `Gestión de Plataforma`:
     - Empresas Clientes (`/panel/superadmin/clientes`)
     - Prospectos (Leads) (`/panel/superadmin/prospectos`)
     - Centro de Soporte (`/panel/superadmin/soporte`)
     - Planes (`/panel/superadmin/planes`)
     - Cobros (`/panel/superadmin/cobros`)

## 2. Arquitectura de Componentes & Rutas

### 2.1 Componente `PlanesView` (`src/components/superadmin/planes/planes-view.tsx`)
- Props: `plans: SubscriptionPlanData[]`
- Funcionalidades:
  - Selector de ciclo de facturación (Facturación Mensual vs Facturación Anual con descuento).
  - Barra escalonada visual de rangos de flota y precios.
  - Tabla de planes: Nombre, ID, Rango vehículos (Desde - Hasta), Precio Mensual, Precio Anual, Inquilinos asignados, Acciones (Editar, Eliminar).
  - Modal para Crear / Editar Plan (`PlanFormDialog`).
  - **No incluye KPIs**.

### 2.2 Componente `CobrosView` (`src/components/superadmin/cobros/cobros-view.tsx`)
- Props: `records: BillingRecord[]`
- Funcionalidades:
  - 4 Tarjetas Métricas KPI (MRR, ARR, ARPU, Tasa de Cobro al Día).
  - Filtro por estado de pago (Tabs/Badges: Todos, Al día, Por vencer, Vencidos, Suspendidos).
  - Buscador reactivo por empresa, CUIT o ID.
  - Tabla de Inquilinos y Cobros: Empresa, CUIT, Plan asignado, Cuota, Método de pago con badge temático, Estado con badge, Vencimiento con contador de días, Acciones (Registrar Pago, Ver Recibo).
  - Modal de Registro de Pago.
  - Modal de Visor de Recibo / Factura imprimible.

### 2.3 Páginas App Router
1. `src/app/panel/superadmin/planes/page.tsx`:
   - Obtiene la lista de planes desde `subscriptionPlans` y conteo de vehículos/suscripciones.
   - Renderiza encabezado "Planes de Suscripción" y `<PlanesView>`.
2. `src/app/panel/superadmin/cobros/page.tsx`:
   - Obtiene las suscripciones de empresas, planes y vehículos.
   - Renderiza encabezado "Cobros & Facturación SaaS" y `<CobrosView>`.
3. `src/app/panel/superadmin/facturacion/page.tsx`:
   - Redirecciona o renderiza `CobrosPage` para mantener retrocompatibilidad.

## 3. Plan de Pruebas & Verificación
1. `test/superadmin-planes-page.test.tsx`:
   - Verifica renderizado de `PlanesView` sin KPIs.
   - Verifica la presencia del catálogo, rangos de flota y tabla de planes.
   - Verifica acciones de crear, editar y eliminar plan.
2. `test/superadmin-cobros-page.test.tsx`:
   - Verifica renderizado de `CobrosView` con sus 4 KPIs superiores.
   - Verifica filtros y tabla de cobranzas.
   - Verifica modal de registrar pago y recibo.
3. `test/sidebar-navigation.test.ts`:
   - Verifica que `Gestión de Plataforma` contenga `Planes` (`/panel/superadmin/planes`) y `Cobros` (`/panel/superadmin/cobros`).
