# Marker Clustering y Rediseño de Sidebar de Flota - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar agrupación de marcadores de vehículos en círculos interactivos (Marker Clustering) al alejar el zoom del mapa y transformar el sidebar de vehículos en un listado continuo con hover fluido con acento ámbar/amarillo y flecha indicadora.

**Architecture:** Integrar `leaflet.markercluster` en `FleetMap.tsx` a través de un componente cliente `MarkerClusterGroup` con iconos de cluster minimalistas personalizados. Rediseñar la lista de vehículos en `src/app/dashboard/mapa/page.tsx` pasando de tarjetas aisladas a una lista continua (*flush list*) de ancho completo con divisores limpios, borde izquierdo interactivo `#F2B705` y chevron indicador.

**Tech Stack:** Next.js 14 (App Router), React 18, Leaflet, `leaflet.markercluster`, Tailwind CSS, Lucide Icons.

## Global Constraints

- No usar sombras pesadas ni degradados estridentes; mantener estética minimalista editorial.
- El color de acento amarillo/ámbar debe ser `#F2B705` / `hsl(var(--accent))` o clases Tailwind `amber-500`.
- Preservar toda la información de cada vehículo: patente, tipo, estado, velocidad, última actualización, alerta y conexión online.
- Mantener compatibilidad SSR (Leaflet cargado dinámicamente con `ssr: false`).

---

### Task 1: Integración de Marker Clustering en `FleetMap.tsx`

**Files:**
- Modify: `src/components/map/FleetMap.tsx`

**Interfaces:**
- Consumes: `vehiculos: any[]`, `isListOpen: boolean`, `focusedVehicleId: number | null`, `setFocusedVehicleId: (id: number | null) => void`.
- Produces: Capa de clustering en Leaflet que agrupa vehículos en círculos cuando el zoom se aleja y se desagrega al acercar o hacer click en el cluster.

- [ ] **Step 1: Importar dependencias de Leaflet MarkerCluster**
Importar los estilos CSS de `leaflet.markercluster` y la librería en `src/components/map/FleetMap.tsx`.

- [ ] **Step 2: Crear el componente `MarkerClusterGroup` con `iconCreateFunction` personalizada**
Configurar `L.markerClusterGroup` con:
```tsx
function MarkerClusterGroupComponent({ vehiculos, setFocusedVehicleId }: { vehiculos: any[]; setFocusedVehicleId?: (id: number | null) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 50 ? 42 : 48;
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-full h-full rounded-full bg-[#1E2227] text-white font-bold text-xs shadow-lg border-2 border-[#F2B705]/80 hover:scale-105 transition-transform"><span class="tracking-tight">${count}</span></div>`,
          className: "custom-cluster-icon",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    vehiculos.forEach((v) => {
      let bgClass = "bg-emerald-500";
      if (v.estado === "Ralentí") bgClass = "bg-amber-500";
      if (v.estado === "Detenido") bgClass = "bg-slate-500";
      if (v.hasAlert) bgClass = "bg-destructive";

      const iconHtml = renderToString(
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-card border shadow-lg">
          {v.tipo === "Camión" || v.tipo === "Camioneta" ? (
            <TruckIcon className={`w-4 h-4 ${bgClass.replace('bg-', 'text-')}`} />
          ) : (
            <Car className={`w-4 h-4 ${bgClass.replace('bg-', 'text-')}`} />
          )}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${bgClass}`} />
          {v.hasAlert && (
            <div className="absolute -bottom-2 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 rounded-sm shadow-sm flex items-center gap-0.5">
              <AlertTriangle className="w-2 h-2" />
            </div>
          )}
        </div>
      );

      const marker = L.marker([v.lat, v.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: "bg-transparent border-none",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      });

      marker.on("click", () => {
        setFocusedVehicleId?.(v.id);
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, vehiculos, setFocusedVehicleId]);

  return null;
}
```

- [ ] **Step 3: Actualizar `FleetMap` para renderizar `MarkerClusterGroupComponent` y verificar estilos**

- [ ] **Step 4: Commit de Task 1**
```bash
git add src/components/map/FleetMap.tsx
git commit -m "feat(map): add marker clustering to fleet map"
```

---

### Task 2: Rediseño del Sidebar de Vehículos en `src/app/dashboard/mapa/page.tsx`

**Files:**
- Modify: `src/app/dashboard/mapa/page.tsx`

**Interfaces:**
- Consumes: `filteredVehiculos`, `focusedVehicleId`, `setFocusedVehicleId`, `setIsListOpen`.
- Produces: Lista continua, pegada, ancho completo con divisores sutiles, hover con borde amarillo y flecha derecha animada.

- [ ] **Step 1: Actualizar contenedor de la lista**
Reemplazar `p-4 space-y-3` por `divide-y divide-border/60 border-t border-border/40 p-0 overflow-y-auto flex-1`.

- [ ] **Step 2: Implementar item continuo de vehículo con hover ámbar y ChevronRight**
Actualizar el mapeo de `filteredVehiculos`:
```tsx
import { ChevronRight } from "lucide-react";

// En cada fila del map:
<div
  key={v.id}
  onClick={() => {
    setFocusedVehicleId(v.id);
    if (window.innerWidth < 768) {
      setIsListOpen(false);
    }
  }}
  className={`group relative w-full px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 border-l-4 ${
    focusedVehicleId === v.id
      ? "border-l-amber-500 bg-amber-500/[0.08]"
      : "border-l-transparent hover:border-l-amber-500 hover:bg-amber-500/[0.04]"
  }`}
>
  <div className="flex-1 min-w-0 pr-3">
    {/* Fila superior: Online ping + Patente + Alerta + Tipo */}
    <div className="flex items-center gap-2 mb-1.5">
      <div className="flex items-center justify-center shrink-0 w-2.5 h-2.5">
        {v.online ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span>
        )}
      </div>
      <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
        {v.patente}
        {v.hasAlert && (
          <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse" />
        )}
      </span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-auto">
        {v.tipo}
      </span>
    </div>

    {/* Fila inferior: Estado badge + Velocidad + Hora */}
    <div className="flex items-center justify-between gap-2 mt-2">
      <div className={`flex items-center text-[10px] px-1.5 py-0.5 rounded border font-semibold tracking-wide shrink-0 ${getStateColor(v.estado)}`}>
        {getStateIcon(v.estado)}
        {v.estado}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-auto">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Gauge className="w-3 h-3 text-muted-foreground" />
          {v.velocidad}
        </span>
        <span className="flex items-center gap-1 text-[10px] opacity-70">
          <Clock className="w-3 h-3" />
          {v.ultimaActualizacion}
        </span>
      </div>
    </div>
  </div>

  {/* Flechita derecha interactiva */}
  <div className="shrink-0 pl-1">
    <ChevronRight className="w-4 h-4 text-muted-foreground/40 transition-all duration-200 group-hover:text-amber-500 group-hover:translate-x-0.5" />
  </div>
</div>
```

- [ ] **Step 3: Verificar y ajustar scrollbar y estilos del sidebar**

- [ ] **Step 4: Commit de Task 2**
```bash
git add src/app/dashboard/mapa/page.tsx
git commit -m "feat(map): redesign vehicle sidebar with flush continuous list, yellow hover and chevron"
```

---

### Task 3: Verificación Integral y Pruebas

**Files:**
- Validate: `src/components/map/FleetMap.tsx`, `src/app/dashboard/mapa/page.tsx`

- [ ] **Step 1: Ejecutar verificación de build y lint de TypeScript**
Ejecutar `npm run build` o comprobar tipos con `npx tsc --noEmit`.

- [ ] **Step 2: Verificar comportamiento de clustering al alejar y acercar el mapa**

- [ ] **Step 3: Verificar selección y sincronización entre sidebar y mapa**

- [ ] **Step 4: Commit final si hay ajustes adicionales**
