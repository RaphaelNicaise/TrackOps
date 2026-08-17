# Especificación de Diseño: Marker Clustering en Mapa y Rediseño de Sidebar de Flota

**Fecha:** 2026-08-17  
**Estado:** Propuesta de Diseño  
**Alcance:** Componentes de Mapa y Sidebar (`src/components/map/FleetMap.tsx` y `src/app/dashboard/mapa/page.tsx`)

---

## 1. Contexto y Objetivos

1. **Agrupación de Marcadores (Clustering):** Al alejarse el zoom en el mapa, los vehículos cercanos deben agruparse en círculos interactivos con el conteo de unidades, evitando saturación visual y permitiendo hacer zoom o desglosar al hacer clic.
2. **Rediseño del Sidebar de Flota:** Reemplazar las tarjetas separadas tipo "burbuja" por una lista continua y fluida de borde a borde (*flush list*), eliminando el aspecto fragmentado y logrando una estética minimalista y profesional.
3. **Interacción y Hover:** Incorporar un acento de borde izquierdo amarillo/ámbar (`#F2B705` / `var(--accent)`), fondo suave en hover, y una flecha indicadora (`ChevronRight`) animada a la derecha, preservando al 100% la arquitectura de información actual (patente, tipo, estado, velocidad, última actualización, alertas y conexión online).

---

## 2. Arquitectura de Componentes

### 2.1. Marker Clustering en `FleetMap.tsx`
- **Integración de `leaflet.markercluster`:** Crear un componente contenedor o capa `VehicleClusterGroup` dentro de `MapContainer`.
- **Círculos de Cluster Personalizados (`iconCreateFunction`):**
  - Círculo de tamaño compacto (36px a 44px según cantidad) con fondo oscuro/contrastante (`bg-foreground text-background` o `bg-neutral-900 border border-amber-500/40 text-white`).
  - Anillo sutil o badge con acento ámbar (`#F2B705`).
  - Tipografía nítida con el número total de vehículos en el cluster.
  - Al hacer click en el cluster, el mapa realiza un zoom fluido (*zoomToBounds*) al grupo de vehículos.
- **Marcadores Individuales:**
  - Mantienen los iconos diferenciados (Camión / Auto / Camioneta) con el indicador de estado (verde/ámbar/gris) y alerta.
  - Al hacer clic, se activa el vehículo enfocado (`setFocusedVehicleId`) y se abre el panel inferior de detalle.

### 2.2. Rediseño de Lista en `src/app/dashboard/mapa/page.tsx`
- **Estructura Continua (Full-Width Flush List):**
  - El contenedor de la lista pasa de tener márgenes y `space-y-3` a ser un listado continuo con divisores limpios: `divide-y divide-border/60 border-t border-border/40`.
  - Cada elemento ocupa el 100% del ancho (`w-full`), eliminando bordes redondeados aislados para integrarse como filas de una lista editorial.
- **Interacción & Hover Ámbar:**
  - Estado normal: Borde izquierdo transparente `border-l-4 border-l-transparent bg-transparent transition-all duration-200`.
  - Estado Hover: `hover:bg-amber-500/[0.04] hover:border-l-amber-500 hover:text-foreground`.
  - Estado Seleccionado / Focused: `bg-amber-500/[0.08] border-l-amber-500 font-semibold`.
  - A la derecha de cada fila: Icono `ChevronRight` que se desplaza sutilmente hacia la derecha en hover (`transition-transform duration-200 group-hover:translate-x-0.5 text-muted-foreground/40 group-hover:text-amber-500`).
- **Arquitectura de Información (IA):**
  - **Fila superior:** Punto indicador de conexión online (con animación de pulso si está online) + Patente en negrita + Badge de alerta (si existe) + Tipo de vehículo en mayúsculas pequeñas.
  - **Fila inferior:** Badge de estado (`En movimiento` / `Ralentí` / `Detenido`) + Velocidad con icono de odómetro + Hora de última actualización.
  - **Extremo derecho:** Flecha chevron indicadora de navegación.

---

## 3. Plan de Verificación y Pruebas
1. **Verificación de Agrupación:** Alejar el zoom en el mapa y verificar que múltiples vehículos se combinan en círculos con su respectivo contador; al hacer click o acercar el zoom, el cluster se expande hasta mostrar los marcadores individuales.
2. **Verificación del Sidebar:** Comprobar que los items están pegados horizontal y verticalmente con divisores limpios, que el hover activa el borde izquierdo amarillo y el fondo sutil, y que la flecha derecha reacciona adecuadamente.
3. **Verificación de Filtros y Búsqueda:** Probar la búsqueda por patente y los filtros por tipo de vehículo asegurando que tanto la lista como los clusters en el mapa se actualicen al instante.
4. **Verificación Responsive:** Validar el comportamiento del sidebar colapsable en pantallas móviles y desktop.
