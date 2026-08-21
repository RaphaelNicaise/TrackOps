"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  Route,
  User,
  Truck,
  Calendar,
  Clock,
  FileText,
  Check,
  Ban,
  AlertTriangle,
  MapPin,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appAlert } from "@/lib/alerts";
import { createViaje, cancelarViaje } from "@/lib/flota-actions";
import { LocationSelector, type SelectedLocation } from "./location-selector";
import type {
  ViajeRow,
  SitioRow,
  ChoferRow,
  CreateViajeInput,
} from "@/types/flota-viajes";

export interface VehicleOption {
  id: number;
  patente: string;
  marca?: string;
  modelo?: string;
}

export interface ViajeFormDialogProps {
  sitios?: SitioRow[];
  choferes?: ChoferRow[];
  vehicles?: VehicleOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: (viaje: ViajeRow) => void;
}

function getDefaultSalidaDate(): string {
  const d = new Date();
  d.setMinutes(0);
  d.setSeconds(0);
  d.setHours(d.getHours() + 1);
  try {
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

function getDefaultLlegadaDate(): string {
  const d = new Date();
  d.setMinutes(0);
  d.setSeconds(0);
  d.setHours(d.getHours() + 5);
  try {
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

export function ViajeFormDialog({
  sitios = [],
  choferes = [],
  vehicles = [],
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: ViajeFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [isPending, startTransition] = useTransition();

  // Form state
  const [codigo, setCodigo] = useState("");
  const [origen, setOrigen] = useState<SelectedLocation | null>(null);
  const [destino, setDestino] = useState<SelectedLocation | null>(null);
  const [choferId, setChoferId] = useState<string>("");
  const [vehiculoId, setVehiculoId] = useState<string>("");
  const [fechaSalida, setFechaSalida] = useState(getDefaultSalidaDate());
  const [fechaLlegada, setFechaLlegada] = useState(getDefaultLlegadaDate());
  const [distanciaKm, setDistanciaKm] = useState<string>("");
  const [notas, setNotas] = useState("");

  // When driver selected, auto-select their usual vehicle if assigned and not yet selected
  function handleChoferChange(cIdStr: string) {
    setChoferId(cIdStr);
    if (cIdStr) {
      const cId = parseInt(cIdStr, 10);
      const chofer = choferes.find((c) => c.id === cId);
      if (chofer?.vehiculoHabitualId && !vehiculoId) {
        setVehiculoId(String(chofer.vehiculoHabitualId));
      }
    }
  }

  // Reset state on modal open
  useEffect(() => {
    if (open) {
      setCodigo(`VIA-${Math.floor(1000 + Math.random() * 9000)}`);
      setOrigen(null);
      setDestino(null);
      setChoferId("");
      setVehiculoId("");
      setFechaSalida(getDefaultSalidaDate());
      setFechaLlegada(getDefaultLlegadaDate());
      setDistanciaKm("");
      setNotas("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!origen || !origen.nombre.trim() || !origen.direccion.trim()) {
      appAlert.error("Debés seleccionar el punto de origen del viaje.");
      return;
    }

    if (!destino || !destino.nombre.trim() || !destino.direccion.trim()) {
      appAlert.error("Debés seleccionar el punto de destino del viaje.");
      return;
    }

    if (!fechaSalida) {
      appAlert.error("La fecha y hora de salida programada es requerida.");
      return;
    }

    startTransition(async () => {
      try {
        const payload: CreateViajeInput = {
          codigo: codigo.trim() || undefined,
          origenTipo: origen.tipo,
          origenSitioId: origen.sitioId || null,
          origenNombre: origen.nombre.trim(),
          origenDireccion: origen.direccion.trim(),
          origenLat: origen.lat,
          origenLng: origen.lng,
          destinoTipo: destino.tipo,
          destinoSitioId: destino.sitioId || null,
          destinoNombre: destino.nombre.trim(),
          destinoDireccion: destino.direccion.trim(),
          destinoLat: destino.lat,
          destinoLng: destino.lng,
          choferId: choferId ? parseInt(choferId, 10) : null,
          vehiculoId: vehiculoId ? parseInt(vehiculoId, 10) : null,
          fechaSalidaProgramada: new Date(fechaSalida),
          fechaLlegadaEstimada: fechaLlegada ? new Date(fechaLlegada) : null,
          distanciaEstimadaKm: distanciaKm ? parseFloat(distanciaKm) : null,
          estado: "PLANIFICADO",
          notas: notas.trim() || null,
        };

        const res = await createViaje(payload);
        if (res.success && res.data) {
          appAlert.success(`Viaje ${res.data.codigo || ""} creado y planificado con éxito.`);
          setOpen(false);
          onSuccess?.(res.data);
          router.refresh();
        } else {
          appAlert.error(res.error || "No se pudo programar el viaje.");
        }
      } catch (err: any) {
        console.error("Error creating viaje:", err);
        appAlert.error(err.message || "Ocurrió un error inesperado.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="gap-2 shadow-xs">
              <Plus className="h-4 w-4" />
              + Nuevo Viaje
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Route className="h-5 w-5 text-primary" />
            Nuevo Viaje y Hoja de Ruta
          </DialogTitle>
          <DialogDescription>
            Definí el trayecto origen-destino, asigná chofer y vehículo, y programá la fecha estimada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Código de Viaje */}
          <div className="space-y-1.5">
            <Label htmlFor="viaje-codigo" className="text-xs font-medium">
              Código de Viaje <span className="text-muted-foreground text-[11px]">(Auto-generado si está vacío)</span>
            </Label>
            <Input
              id="viaje-codigo"
              placeholder="Ej. VIA-1045"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="font-mono text-sm uppercase"
            />
          </div>

          {/* Sección Trayecto: Origen & Destino */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Trayecto y Puntos de Recorrido
            </div>

            {/* Selector de Origen */}
            <LocationSelector
              label="Punto de Origen"
              sitios={sitios}
              value={origen}
              onLocationSelected={(loc) => setOrigen(loc)}
              required
            />

            {/* Selector de Destino */}
            <LocationSelector
              label="Punto de Destino"
              sitios={sitios}
              value={destino}
              onLocationSelected={(loc) => setDestino(loc)}
              required
            />

            {/* Distancia Estimada (Opcional) */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="viaje-distancia" className="text-xs font-medium">
                Distancia Estimada (km)
              </Label>
              <Input
                id="viaje-distancia"
                type="number"
                step="0.1"
                placeholder="Ej. 120"
                value={distanciaKm}
                onChange={(e) => setDistanciaKm(e.target.value)}
                className="font-mono text-sm max-w-xs"
              />
            </div>
          </div>

          {/* Sección Asignación: Chofer & Vehículo */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-4 w-4 text-primary" />
              Asignación de Recursos
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="viaje-chofer" className="text-xs font-medium">
                  Chofer Asignado
                </Label>
                <select
                  id="viaje-chofer"
                  value={choferId}
                  onChange={(e) => handleChoferChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                >
                  <option value="">-- Sin chofer asignado (Pendiente) --</option>
                  {choferes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido} {c.licenciaNumero ? `(Lic: ${c.licenciaNumero})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="viaje-vehiculo" className="text-xs font-medium">
                  Vehículo Asignado
                </Label>
                <select
                  id="viaje-vehiculo"
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                >
                  <option value="">-- Sin vehículo asignado (Pendiente) --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} {v.marca || v.modelo ? `(${[v.marca, v.modelo].filter(Boolean).join(" ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección Fechas y Horarios */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Programación y Horarios
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="viaje-salida" className="text-xs font-medium">
                  Salida Programada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="viaje-salida"
                  type="datetime-local"
                  value={fechaSalida}
                  onChange={(e) => setFechaSalida(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="viaje-llegada" className="text-xs font-medium">
                  Llegada Estimada
                </Label>
                <Input
                  id="viaje-llegada"
                  type="datetime-local"
                  value={fechaLlegada}
                  onChange={(e) => setFechaLlegada(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sección Notas e Instrucciones de Carga */}
          <div className="space-y-1.5">
            <Label htmlFor="viaje-notas" className="text-xs font-medium flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Notas / Instrucciones de Carga
            </Label>
            <textarea
              id="viaje-notas"
              rows={3}
              placeholder="Ej. Carga de pallets precintados. Solicitar firma de remito en recepción..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                "Programando..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Programar Viaje
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateViajeDialog(props: ViajeFormDialogProps) {
  return <ViajeFormDialog {...props} />;
}

export function CancelViajeDialog({
  viaje,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: {
  viaje: ViajeRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");

  function handleCancel() {
    startTransition(async () => {
      try {
        const res = await cancelarViaje(viaje.id, motivo.trim() || undefined);
        if (res.success) {
          appAlert.success(`El viaje ${viaje.codigo} fue cancelado.`);
          setOpen(false);
          onSuccess?.();
          router.refresh();
        } else {
          appAlert.error(res.error || "No se pudo cancelar el viaje.");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al cancelar viaje.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Ban className="h-4 w-4" />
              Cancelar Viaje
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            ¿Cancelar viaje {viaje.codigo}?
          </DialogTitle>
          <DialogDescription>
            Esta acción marcará el viaje de <strong className="text-foreground">{viaje.origenNombre}</strong> a{" "}
            <strong className="text-foreground">{viaje.destinoNombre}</strong> como cancelado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="cancel-motivo" className="text-xs font-medium">
            Motivo de la cancelación (opcional)
          </Label>
          <Input
            id="cancel-motivo"
            placeholder="Ej. Problemas mecánicos, solicitud del cliente..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending ? "Cancelando..." : "Confirmar Cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
