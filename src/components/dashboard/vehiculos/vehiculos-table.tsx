"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Truck, FileText, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateVehicleDialog } from "./vehicle-dialogs";

export type VehiculoRow = {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string | null;
  chasis: string | null;
  kilometrajeActual: number;
  rto: Date | null;
  docCount: number;
};

type SortKey = "patente" | "anio" | "chasis" | "kilometrajeActual" | "rto" | "docCount";
type SortState = { key: SortKey; dir: "asc" | "desc" };

interface VehiculosTableProps {
  vehicles: VehiculoRow[];
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sort?.key === sortKey;
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 select-none transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        {isActive ? (
          sort!.dir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function VehiculosTable({ vehicles }: VehiculosTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = q
      ? vehicles.filter((v) =>
          [v.patente, v.marca, v.modelo, v.chasis ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : vehicles;

    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va == null && vb == null) return 0;
        if (va == null) return dir;
        if (vb == null) return -dir;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
        if (va instanceof Date && vb instanceof Date) return (va.getTime() - vb.getTime()) * dir;
        return String(va).localeCompare(String(vb), "es") * dir;
      });
    }

    return result;
  }, [vehicles, query, sort]);

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {vehicles.length} vehículos en la flota
          </p>
        </div>
        <CreateVehicleDialog />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por patente, chasis, marca o modelo..."
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortHeader label="Patente" sortKey="patente" sort={sort} onSort={handleSort} />
              <SortHeader label="Vehículo-año" sortKey="anio" sort={sort} onSort={handleSort} />
              <SortHeader label="Chasis" sortKey="chasis" sort={sort} onSort={handleSort} />
              <SortHeader label="Km Actual" sortKey="kilometrajeActual" sort={sort} onSort={handleSort} className="text-right" />
              <SortHeader label="Rto" sortKey="rto" sort={sort} onSort={handleSort} />
              <SortHeader label="Docs" sortKey="docCount" sort={sort} onSort={handleSort} className="text-right" />
              <TableHead className="w-10">
                <span className="sr-only">Abrir</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No se encontraron vehículos
                </TableCell>
              </TableRow>
            )}
            {filtered.map((v) => {
              const rtoVencido = v.rto ? isBefore(v.rto, new Date()) : null;
              return (
                <TableRow
                  key={v.id}
                  onClick={() => router.push(`/panel/control-flota/vehiculos/${v.id}`)}
                  className="cursor-pointer hover:bg-amber-50/70 dark:hover:bg-amber-500/15 transition-colors group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-primary" />
                      </span>
                      <span className="font-mono text-sm font-semibold uppercase tracking-wide group-hover:text-primary transition-colors">
                        {v.patente}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {v.marca} {v.modelo}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.anio ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {v.chasis ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {v.kilometrajeActual.toLocaleString("es-AR")} km
                  </TableCell>
                  <TableCell>
                    {v.rto ? (
                      <Badge
                        variant={rtoVencido ? "destructive" : "outline"}
                        className={rtoVencido ? "" : "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15"}
                      >
                        {format(v.rto, "dd/MM/yyyy", { locale: es })}
                        <span className="ml-1.5 hidden sm:inline">
                          {rtoVencido ? "Vencido" : "Vigente"}
                        </span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/panel/control-flota/vehiculos/${v.id}?tab=documentacion`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {v.docCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right pr-3">
                    <Link
                      href={`/panel/control-flota/vehiculos/${v.id}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Abrir ${v.patente}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}