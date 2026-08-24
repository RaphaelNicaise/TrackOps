"use client";

import * as React from "react";
import { addDays, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  className?: string;
}

function buildPresets(): { label: string; range: DateRange }[] {
  const today = new Date();
  const weekStartsOn = 1;

  return [
    { label: "Hoy", range: { from: today, to: today } },
    {
      label: "Esta semana",
      range: {
        from: startOfWeek(today, { weekStartsOn }),
        to: endOfWeek(today, { weekStartsOn }),
      },
    },
    { label: "Este mes", range: { from: startOfMonth(today), to: endOfMonth(today) } },
    {
      label: "Próximos 7 días",
      range: { from: startOfDay(today), to: addDays(today, 7) },
    },
  ];
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const presets = React.useMemo(buildPresets, []);

  const label = React.useMemo(() => {
    if (value?.from && value?.to) {
      return `${format(value.from, "dd/MM/yyyy")} – ${format(value.to, "dd/MM/yyyy")}`;
    }
    if (value?.from) {
      return `Desde ${format(value.from, "dd/MM/yyyy")}`;
    }
    return "Fechas";
  }, [value]);

  function handleSelect(range: DateRange | undefined) {
    onChange(range);

    if (range?.from && range?.to) {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start px-2.5 text-sm font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
          {value?.from && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Limpiar rango de fechas"
              className="ml-1 rounded-sm p-0.5 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(undefined);
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={es}
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
        <div className="flex flex-wrap items-center gap-1.5 border-t p-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                onChange(preset.range);
                setOpen(false);
              }}
            >
              {preset.label}
            </Button>
          ))}
          {value?.from && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange(undefined);
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
