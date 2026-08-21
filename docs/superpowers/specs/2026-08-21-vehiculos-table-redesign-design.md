# Design Spec: Rediseño Integral de la Tabla de Vehículos

**Fecha:** 2026-08-21  
**Módulo:** Control de Flota - Vehículos (`/panel/control-flota/vehiculos`)  
**Objetivo:** Modernizar la tabla de vehículos adoptando el estándar visual, interactivo y funcional de las tablas de *Empresas Clientes*, *Prospectos Leads* y *Centro de Soporte*.

---

## 1. Visión General y Objetivos
- Reemplazar la tabla básica actual por un panel de gestión integral con KPIs superiores, filtros reactivos, badges de alto contraste, tipografía monoespaciada en patentes/chasis, y acciones directas.
- Mantener compatibilidad total con los flujos existentes: `CreateVehicleDialog`, `EditVehicleDialog`, `DeleteVehicleDialog`, navegación a `/panel/control-flota/vehiculos/[id]`, navegación a `/panel/mapa`.
- Asegurar soporte de ordenamiento interactivo (Sort), búsqueda multi-campo y filtrado instantáneo.

---

## 2. Componentes y Arquitectura de UI

### A. Cabecera y Tarjetas KPI (3 Tarjetas Principales)
1. **Total Vehículos:**
   - Contador total de unidades en la flota del tenant (`Truck`).
   - Subtexto con desglose de tipos principales (*ej: 8 Camiones, 4 Utilitarios*).
2. **RTO / VTV Vigente:**
   - Contador de vehículos con inspección técnica vigente (`ShieldCheck`, color verde esmeralda).
   - Subtexto con porcentaje de cumplimiento de la flota.
3. **RTO Vencido / Crítico:**
   - Contador de vehículos con RTO vencido o por vencer en menos de 15 días (`AlertTriangle`).
   - Alerta visual destacada en rojo/ámbar si el conteo es mayor a 0.

### B. Barra de Herramientas y Filtros
1. **Buscador en tiempo real:**
   - Búsqueda multi-campo sobre: `patente`, `marca`, `modelo`, `chasis` y `tipo`.
   - Botón para limpiar búsqueda con un clic.
2. **Pestañas de Estado Rápidas:**
   - `Todos` (con badge contador)
   - `RTO Vigente`
   - `RTO Vencido / Crítico`
   - `Sin RTO`
3. **Filtro Desplegable Secundario:**
   - Por **Tipo de Vehículo** (*Todos, Camión, Camioneta, Utilitario, Auto, Colectivo, etc.*).
4. **Botón "Limpiar Filtros":**
   - Visible reactivamente cuando hay algún filtro o búsqueda activa.
5. **Botón Primario de Acción:**
   - `+ Nuevo Vehículo` (monta el diálogo `CreateVehicleDialog`).

### C. Estructura de la Tabla y Filas
1. **Columnas:**
   - **Vehículo / Patente:**
     - Badge chapa patente monoespaciada con estilo visual distintivo.
     - Avatar con ícono según el tipo de vehículo.
     - Título: Marca y Modelo (`font-semibold`).
     - Subtexto: Año (`anio ?? "—"`).
   - **Chasis / VIN:**
     - Texto monoespaciado limpio con botón/función para copiar al portapapeles.
   - **Tipo:**
     - Badge con categoría formateada y color acorde.
   - **Kilometraje Actual:**
     - Odómetro numérico formateado (`es-AR`, ej: `145.200 km`) con ícono de velocímetro / odómetro.
   - **Inspección Técnica (RTO / VTV):**
     - Badge de estado coloreado:
       - 🟢 **Vigente:** Fecha + "Vigente" (o días restantes).
       - 🔴 **Vencido:** Fecha + "Vencido hace X días".
       - ⚪ **Sin registrar:** "—".
   - **Documentación:**
     - Badge de legajo con conteo de documentos y enlace directo al tab de documentación (`/panel/control-flota/vehiculos/[id]?tab=documentacion`).
   - **Acciones:**
     - Botón directo `👁️ Ver Ficha` (navega a `/panel/control-flota/vehiculos/[id]`).
     - Botón directo `🗺️ Ver en Mapa` (navega a `/panel/mapa?patente=...` o `/panel/mapa`).
     - Menú contextual desplegable (`...`):
       - *Editar Vehículo* (abre `EditVehicleDialog`).
       - *Gestionar Documentos*.
       - *Eliminar Vehículo*.

### D. Estado Vacío (Empty State)
- Tarjeta estilizada con ícono de camión, mensaje claro cuando no hay resultados para los filtros seleccionados, y botón para resetear la búsqueda o dar de alta un vehículo.

---

## 3. Manejo de Datos y Compatibilidad
- **Props de Entrada:** `VehiculosTableProps { vehicles: VehiculoRow[] }`.
- **Mapeo de Tipos:** Se conserva `VehiculoRow` para garantizar compatibilidad retroactiva con `VehiculosPage` (`src/app/panel/control-flota/vehiculos/page.tsx`).
- **Validación con Vitest:** Cobertura de pruebas unitarias verificando KPIs, filtrado por tabs, búsqueda, ordenamiento y acciones.

---

## 4. Plan de Testing
- Pruebas en `test/components/vehiculos-table.test.tsx` (o actualización de tests existentes):
  - Renderizado de los 3 KPIs (Total, Vigente, Vencido).
  - Búsqueda por patente y marca.
  - Filtrado por pestaña de RTO (Vigente vs Vencido).
  - Filtrado por tipo de vehículo.
  - Ordenamiento por columnas.
  - Renderizado de botones de acción rápida.
