"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  MapPin,
  Building2,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Navigation,
  Factory,
  Warehouse,
  Store,
  Truck,
  Wrench,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { parseGoogleMapsUrl } from "@/lib/maps-parser";
import type { SitioRow, SitioTipo, UbicacionTipo } from "@/types/flota-viajes";

export interface SelectedLocation {
  tipo: UbicacionTipo;
  sitioId?: number | null;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

export interface LocationSelectorProps {
  label: string;
  sitios?: SitioRow[];
  value?: SelectedLocation | null;
  onLocationSelected?: (loc: SelectedLocation) => void;
  initialMode?: "SITIO" | "PLACES";
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const POPULAR_LANDMARKS: Array<{
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}> = [
  {
    nombre: "Puerto Buenos Aires",
    direccion: "Av. Ramón S. Castillo, Retiro, CABA",
    lat: -34.5822,
    lng: -58.3712,
  },
  {
    nombre: "Aeropuerto Ezeiza",
    direccion: "Autopista Tte. Gral. Ricchieri Km 33.5, Ezeiza",
    lat: -34.8222,
    lng: -58.5358,
  },
  {
    nombre: "Mercado Central",
    direccion: "Autopista Ricchieri y Boulogne Sur Mer, Tapiales",
    lat: -34.7119,
    lng: -58.4875,
  },
  {
    nombre: "Córdoba Centro",
    direccion: "Av. Circunvalación Agustín Tosco, Córdoba",
    lat: -31.4201,
    lng: -64.1888,
  },
];

function getSitioIcon(tipo?: SitioTipo) {
  switch (tipo) {
    case "PLANTA":
      return Factory;
    case "DEPOSITO":
      return Warehouse;
    case "CLIENTE":
      return Building2;
    case "SUCURSAL":
      return Store;
    case "PROVEEDOR":
      return Truck;
    case "TALLER":
      return Wrench;
    default:
      return MapPin;
  }
}

export function LocationSelector({
  label,
  sitios = [],
  value: controlledValue,
  onLocationSelected,
  initialMode = "SITIO",
  disabled = false,
  required = false,
  className,
}: LocationSelectorProps) {
  const [mode, setMode] = useState<"SITIO" | "PLACES">(
    controlledValue?.tipo === "GOOGLE_PLACES" ? "PLACES" : initialMode
  );
  const [selected, setSelected] = useState<SelectedLocation | null>(
    controlledValue ?? null
  );

  // Search state for Geocoding / Places mode
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      display_name: string;
      lat: string;
      lon: string;
      name?: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setSelected(controlledValue);
      if (controlledValue?.tipo === "GOOGLE_PLACES") {
        setMode("PLACES");
      }
    }
  }, [controlledValue]);

  function handleSelectSite(siteIdStr: string) {
    const sId = parseInt(siteIdStr, 10);
    const site = sitios.find((s) => s.id === sId);
    if (!site) return;

    const loc: SelectedLocation = {
      tipo: "SITIO",
      sitioId: site.id,
      nombre: site.nombre,
      direccion: site.direccion,
      lat: site.lat,
      lng: site.lng,
    };

    setSelected(loc);
    onLocationSelected?.(loc);
  }

  function handleSelectLandmark(landmark: (typeof POPULAR_LANDMARKS)[0]) {
    const loc: SelectedLocation = {
      tipo: "GOOGLE_PLACES",
      sitioId: null,
      nombre: landmark.nombre,
      direccion: landmark.direccion,
      lat: landmark.lat,
      lng: landmark.lng,
    };

    setSelected(loc);
    setSearchQuery(landmark.nombre);
    setShowResultsDropdown(false);
    onLocationSelected?.(loc);
  }

  function handleSearchChange(val: string) {
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = val.trim();

    // 1. Direct coordinate or Google Maps URL parsing
    const directParsed = parseGoogleMapsUrl(trimmed);
    if (directParsed) {
      setIsSearching(false);
      setShowResultsDropdown(false);
      const loc: SelectedLocation = {
        tipo: "GOOGLE_PLACES",
        sitioId: null,
        nombre: directParsed.placeName || "Ubicación Google Maps",
        direccion: `Coordenadas: ${directParsed.lat.toFixed(4)}, ${directParsed.lng.toFixed(4)}`,
        lat: directParsed.lat,
        lng: directParsed.lng,
      };
      setSelected(loc);
      onLocationSelected?.(loc);
      return;
    }

    // 2. Shortlink check
    if (trimmed.includes("maps.app.goo.gl") || trimmed.includes("goo.gl/maps")) {
      setIsSearching(true);
      fetch(`/api/resolve-maps-url?url=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.lat && data.lng) {
            const loc: SelectedLocation = {
              tipo: "GOOGLE_PLACES",
              sitioId: null,
              nombre: data.placeName || "Ubicación Google Maps",
              direccion: `Coordenadas: ${Number(data.lat).toFixed(4)}, ${Number(data.lng).toFixed(4)}`,
              lat: Number(data.lat),
              lng: Number(data.lng),
            };
            setSelected(loc);
            onLocationSelected?.(loc);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
      return;
    }

    if (trimmed.length < 3) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowResultsDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const queryEncoded = encodeURIComponent(trimmed);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${queryEncoded}&countrycodes=ar&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn("Geocoding search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  }

  function handleSelectSearchResult(item: {
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
  }) {
    const parts = item.display_name.split(",");
    const title = parts[0]?.trim() || item.name || "Ubicación seleccionada";
    const address = parts.slice(1).join(",").trim() || item.display_name;

    const loc: SelectedLocation = {
      tipo: "GOOGLE_PLACES",
      sitioId: null,
      nombre: title,
      direccion: address,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };

    setSelected(loc);
    setSearchQuery(title);
    setShowResultsDropdown(false);
    onLocationSelected?.(loc);
  }

  function handleClearSelection() {
    setSelected(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowResultsDropdown(false);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>

        {/* Selector de Modo */}
        <div className="inline-flex rounded-lg bg-muted/60 p-0.5 border">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode("SITIO")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all",
              mode === "SITIO"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Sitio Preconfigurado</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode("PLACES")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all",
              mode === "PLACES"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Búsqueda en Mapa</span>
          </button>
        </div>
      </div>

      {/* Modo 1: Sitio Preconfigurado */}
      {mode === "SITIO" && (
        <div className="space-y-2">
          <NativeSelect
            value={selected?.tipo === "SITIO" && selected.sitioId ? String(selected.sitioId) : ""}
            onChange={(e) => handleSelectSite(e.target.value)}
            disabled={disabled}
            sizeVariant="lg"
          >
            <option value="">-- Seleccionar sitio registrado --</option>
            {sitios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.tipo}) - {s.direccion}
              </option>
            ))}
          </NativeSelect>
          {sitios.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              No hay sitios preconfigurados registrados. Podés usar la pestaña de Búsqueda en Mapa o agregar uno en Sitios.
            </p>
          )}
        </div>
      )}

      {/* Modo 2: Búsqueda en Mapa / Google Places */}
      {mode === "PLACES" && (
        <div className="space-y-2.5">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar dirección o pegar link de Google Maps..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResultsDropdown(true);
                }}
                disabled={disabled}
                className="pl-9 pr-9 text-sm"
              />
              {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown de Sugerencias de Autocompletado */}
            {showResultsDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-56 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="flex w-full items-start gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold truncate">
                        {item.display_name.split(",")[0]}
                      </span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.display_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botones de Puntos de Interés / Landmarks Populares */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" /> Puntos Frecuentes Rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_LANDMARKS.map((lm) => (
                <button
                  key={lm.nombre}
                  type="button"
                  onClick={() => handleSelectLandmark(lm)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                >
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{lm.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Badge / Resumen de Ubicación Seleccionada */}
      {selected && (
        <div className="rounded-lg border bg-muted/30 p-2.5 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {selected.nombre}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1 py-0 font-medium",
                    selected.tipo === "SITIO"
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                  )}
                >
                  {selected.tipo === "SITIO" ? "Sitio" : "Punto GPS / Places"}
                </Badge>
              </div>
              <span className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5">
                {selected.direccion}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/80 mt-1">
                <Navigation className="h-2.5 w-2.5" />
                <span>{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={disabled}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Cambiar
          </Button>
        </div>
      )}
    </div>
  );
}
