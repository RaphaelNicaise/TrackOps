"use client";

import React, { useState, useEffect } from "react";
import { Check, Pipette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ColorPickerCustomProps {
  color: string;
  opacity?: number;
  onChangeColor: (color: string) => void;
  onChangeOpacity: (opacity: number) => void;
}

export const PRESET_COLORS = [
  { hex: "#3B82F6", label: "Azul" },
  { hex: "#10B981", label: "Esmeralda" },
  { hex: "#F2B705", label: "Ámbar TrackOps" },
  { hex: "#EF4444", label: "Rojo" },
  { hex: "#8B5CF6", label: "Violeta" },
  { hex: "#06B6D4", label: "Cian" },
  { hex: "#F97316", label: "Naranja" },
  { hex: "#EC4899", label: "Rosa" },
  { hex: "#475569", label: "Grafito" },
];

export function ColorPickerCustom({
  color = "#3B82F6",
  opacity = 0.25,
  onChangeColor,
  onChangeOpacity,
}: ColorPickerCustomProps) {
  // Local hex state to allow smooth typing in text input
  const [hexInput, setHexInput] = useState(color.toUpperCase());

  useEffect(() => {
    setHexInput(color.toUpperCase());
  }, [color]);

  // Normalized opacity percentage (10 to 80)
  const normalizedOpacity = opacity > 1 ? opacity : opacity * 100;
  const clampedPercentage = Math.min(80, Math.max(10, Math.round(normalizedOpacity)));

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("#")) {
      val = `#${val}`;
    }
    val = val.toUpperCase();
    setHexInput(val);

    // If valid hex 6 or 3 chars
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      onChangeColor(val);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChangeOpacity(val / 100);
  };

  return (
    <div className="space-y-4">
      {/* Preset Swatches Palette */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
          Color de Zona
        </Label>
        <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
          {PRESET_COLORS.map((preset) => {
            const isSelected = preset.hex.toUpperCase() === color.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => {
                  onChangeColor(preset.hex);
                  setHexInput(preset.hex.toUpperCase());
                }}
                className={`relative aspect-square w-full rounded-xl transition-all duration-150 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 focus:outline-hidden ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-md z-10"
                    : "hover:ring-1 hover:ring-border opacity-90 hover:opacity-100"
                }`}
                style={{ backgroundColor: preset.hex }}
                title={`${preset.label} (${preset.hex})`}
                aria-label={preset.label}
              >
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input & Hex Code */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <label
            htmlFor="custom-geofence-color"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-input bg-card hover:bg-muted text-xs font-medium cursor-pointer transition-colors shadow-xs"
            title="Seleccionar color personalizado"
          >
            <Pipette className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Personalizado</span>
            <div
              className="w-4 h-4 rounded-full border border-black/20 shadow-xs ml-1"
              style={{ backgroundColor: color }}
            />
          </label>
          <input
            id="custom-geofence-color"
            type="color"
            value={color.startsWith("#") && color.length === 7 ? color : "#3B82F6"}
            onChange={(e) => {
              const hex = e.target.value.toUpperCase();
              onChangeColor(hex);
              setHexInput(hex);
            }}
            className="sr-only"
          />
        </div>

        <div className="relative flex-1">
          <Input
            type="text"
            maxLength={7}
            placeholder="#3B82F6"
            value={hexInput}
            onChange={handleHexChange}
            className="h-8 font-mono text-xs uppercase tracking-wider font-semibold bg-card/60 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Opacity Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="geofence-opacity-slider" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Opacidad de Relleno
          </Label>
          <span className="text-xs font-mono font-bold text-foreground">
            {clampedPercentage}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-mono">10%</span>
          <input
            id="geofence-opacity-slider"
            type="range"
            min="10"
            max="80"
            step="5"
            value={clampedPercentage}
            onChange={handleSliderChange}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-hidden"
          />
          <span className="text-[11px] text-muted-foreground font-mono">80%</span>
        </div>
      </div>

      {/* Visual Preview Pill */}
      <div
        className="relative overflow-hidden h-11 rounded-xl border-2 flex items-center justify-between px-3.5 transition-all shadow-xs"
        style={{ borderColor: color }}
      >
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            backgroundColor: color,
            opacity: clampedPercentage / 100,
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-xs"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-foreground">
            Visualización en Mapa
          </span>
        </div>
        <span className="relative z-10 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-background/85 backdrop-blur-md border border-border/60 text-foreground shadow-xs">
          {color.toUpperCase()} • {clampedPercentage}%
        </span>
      </div>
    </div>
  );
}
