# Design Spec: Rediseño Integral y Minimalista de la Tabla de Vehículos

**Fecha:** 2026-08-21  
**Módulo:** Control de Flota - Vehículos (`/panel/control-flota/vehiculos`)  
**Objetivo:** Modernizar la tabla de vehículos con un diseño ágil, limpio y centrado 100% en la tabla, eliminando tarjetas KPI gigantes y usando micro-contadores en línea en las pestañas y barra de herramientas.

---

## 1. Visión General y Filosofía de Diseño
- **Foco absoluto en la tabla:** Se eliminan las tarjetas KPI grandes para no desplazar el contenido ni sobrecargar la pantalla.
- **Micro-métricas integradas:** Los datos cuantitativos clave se muestran como píldoras/badges compactos directamente dentro de las pestañas (`Todos (12)`, `RTO Vigente (10)`, `RTO Vencido (2)`, `Sin RTO (1)`).
- **Consistencia visual:** Adopta la estética cuidada, moderna y funcional de las mejores tablas de la plataforma (estilo monospace para patentes/chasis, dropdowns interactivos, acciones en 1 clic, badges de alta legibilidad).
- **Preservación de funcionalidades:** Mantiene integración con `CreateVehicleDialog`, `EditVehicleDialog`, `DeleteVehicleDialog`, navegación a `/panel/control-flota/vehiculos/[id]` y enlaces al mapa `/panel/mapa`.

---

## 2. Componentes y Arquitectura de UI

### A. Cabecera Compacta (Header)
- **Título & Subtítulo compacto:**
  - Título: `Vehículos` (`text-2xl font-bold tracking-tight text-foreground`).
  - Subtítulo: Contador dinámico en texto sutil (`12 vehículos registrados en tu flota`).
- **Acción Primaria:** Botón `+ Nuevo Vehículo` montando `<CreateVehicleDialog />` alineado a la derecha.

### B. Barra de Filtros y Pestañas en Línea
1. **Pestañas de Estado (Inline Tabs con Contadores):**
   - `Todos` (Badge con total)
   - `RTO Vigente` (Badge verde esmeralda con total)
   - `RTO Vencido` (Badge ámbar/rojo con total)
   - `Sin RTO` (Badge gris con total)
2. **Barra de Control:**
   - **Buscador en tiempo real:** Input estilizado con ícono de lupa y botón para limpiar rápido. Busca sobre patente, marca, modelo, chasis y tipo.
   - **Selector de Tipo de Vehículo:** Dropdown compacto (*Todos, Camión, Camioneta, Utilitario, Auto, Colectivo*).
   - **Botón "Limpiar Filtros":** Se muestra solo cuando hay búsqueda o filtros activos.
   - **Contador de resultados:** `Mostrando X de Y vehículos`.

### C. Filas y Columnas de la Tabla
1. **Patente y Modelo:**
   - **Chapa Patente:** Badge visual estilo patente nacional en fuente monoespaciada destacada (`font-mono font-bold tracking-wider`).
   - **Avatar / Ícono:** Mini avatar según el tipo de unidad (`Truck`, `Car`, etc.).
   - **Marca & Modelo:** Título claro (`font-medium`) con el año como subtexto (`anio ?? "—"`).
2. **Chasis / VIN:**
   - Tipografía monoespaciada limpia (`font-mono text-xs text-muted-foreground`) con botón de copiar rápido.
3. **Tipo de Porte:**
   - Badge ligero con categoría del vehículo (*Camión, Utilitario, etc.*).
4. **Kilometraje Actual:**
   - Formato numérico argentino (`145.200 km`) alineado a la derecha con ícono de velocímetro.
5. **Inspección Técnica (RTO / VTV):**
   - Badge de estado con color y fecha:
     - 🟢 **Vigente:** Fecha formateada (`dd/MM/yyyy`) + badge verde.
     - 🔴 **Vencido:** Fecha formateada + badge rojo "Vencido".
     - ⚪ **Sin registrar:** Texto tenue `Sin registrar`.
6. **Documentación:**
   - Badge interactivo con ícono `FileText` y conteo de documentos con enlace directo al tab de documentación (`/panel/control-flota/vehiculos/[id]?tab=documentacion`).
7. **Acciones Rápidas (Directas + Menú):**
   - Botón directo `👁️ Ver Ficha` (navega a `/panel/control-flota/vehiculos/[id]`).
   - Botón directo `🗺️ Ver en Mapa` (navega a `/panel/mapa?patente=...`).
   - Menú contextual `⋯`:
     - *Editar Vehículo* (abre `EditVehicleDialog`).
     - *Ver Documentación*.
     - *Eliminar Vehículo*.

### D. Ordenamiento Interactivo (Sorting)
- Cabeceras interactivas con flechas para ordenar por:
  - Patente (`patente`)
  - Vehículo / Año (`anio`)
  - Chasis (`chasis`)
  - Kilometraje (`kilometrajeActual`)
  - Vencimiento RTO (`rto`)
  - Cantidad de Documentos (`docCount`)

### E. Estado Vacío (Empty State)
- Contenedor limpio y centrado cuando no hay vehículos o los filtros no arrojan resultados, con botón para resetear la búsqueda o crear un nuevo vehículo.

---

## 3. Plan de Testing
- Pruebas en `test/components/vehiculos-table.test.tsx`:
  - Renderizado del encabezado y tabs con micro-contadores.
  - Búsqueda multi-campo (patente, marca, chasis).
  - Filtrado por pestañas (RTO Vigente, RTO Vencido, Sin RTO).
  - Filtrado por selector de tipo de vehículo.
  - Ordenamiento por columnas.
  - Renderizado de botones de acción rápida y menú contextual.
