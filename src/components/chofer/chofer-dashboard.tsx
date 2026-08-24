"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Navigation,
  Truck,
  Fuel,
  Play,
  Clock,
  Calendar,
  ArrowRight,
  ExternalLink,
  MapPin,
  Plus,
  History,
  Gauge,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  Flag,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationSelector, SelectedLocation } from "@/components/control-flota/viajes/location-selector";
import { iniciarViajeChofer, finalizarViajeChofer, createViaje } from "@/lib/flota-actions";
import { appAlert } from "@/lib/alerts";
import { cn } from "@/lib/utils";
import type { ViajeRow, SitioRow, ChoferRow } from "@/types/flota-viajes";

interface VehicleItem {
  id: number;
  patente: string;
  marca?: string;
  modelo?: string;
}

interface ChoferDashboardProps {
  driver?: ChoferRow | null;
  trips: ViajeRow[];
  sites?: SitioRow[];
  vehicles?: VehicleItem[];
}

export function ChoferDashboard({
  driver,
  trips: initialTrips = [],
  sites = [],
  vehicles = [],
}: ChoferDashboardProps) {
  const router = useRouter();
  const [trips, setTrips] = useState<ViajeRow[]>(initialTrips);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [startTripModalOpen, setStartTripModalOpen] = useState(false);
  const [selectedTripToStart, setSelectedTripToStart] = useState<ViajeRow | null>(null);
  const [startKm, setStartKm] = useState<string>("");
  const [startVehicleId, setStartVehicleId] = useState<string>("");

  const [finishTripModalOpen, setFinishTripModalOpen] = useState(false);
  const [selectedTripToFinish, setSelectedTripToFinish] = useState<ViajeRow | null>(null);
  const [finishKm, setFinishKm] = useState<string>("");
  const [finishNotes, setFinishNotes] = useState<string>("");

  const [freeTripModalOpen, setFreeTripModalOpen] = useState(false);
  const [freeOrigin, setFreeOrigin] = useState<SelectedLocation | null>(null);
  const [freeDestination, setFreeDestination] = useState<SelectedLocation | null>(null);
  const [freeVehicleId, setFreeVehicleId] = useState<string>(
    driver?.vehiculoHabitualId
      ? String(driver.vehiculoHabitualId)
      : vehicles[0]?.id
      ? String(vehicles[0].id)
      : ""
  );
  const [freeKmInicio, setFreeKmInicio] = useState<string>("");
  const [freeNotes, setFreeNotes] = useState<string>("");

  const [showHistory, setShowHistory] = useState(true);

  // Categorize trips
  const activeTrip = trips.find((t) => t.estado === "EN_CURSO");
  const plannedTrips = trips.filter((t) => t.estado === "PLANIFICADO");
  const completedTrips = trips.filter(
    (t) => t.estado === "COMPLETADO" || t.estado === "CANCELADO"
  );

  // Format dates
  function formatDate(dateVal?: Date | string | null) {
    if (!dateVal) return "-";
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Google Maps directions URL helper
  function getGoogleMapsUrl(trip: ViajeRow) {
    const origin =
      trip.origenLat && trip.origenLng
        ? `${trip.origenLat},${trip.origenLng}`
        : encodeURIComponent(`${trip.origenNombre}, ${trip.origenDireccion}`);
    const destination =
      trip.destinoLat && trip.destinoLng
        ? `${trip.destinoLat},${trip.destinoLng}`
        : encodeURIComponent(`${trip.destinoNombre}, ${trip.destinoDireccion}`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  }

  // Handler: Open Start Trip Modal
  function handleOpenStartTrip(trip: ViajeRow) {
    setSelectedTripToStart(trip);
    setStartVehicleId(
      trip.vehiculoId
        ? String(trip.vehiculoId)
        : driver?.vehiculoHabitualId
        ? String(driver.vehiculoHabitualId)
        : vehicles[0]?.id
        ? String(vehicles[0].id)
        : ""
    );
    setStartKm("");
    setStartTripModalOpen(true);
  }

  // Handler: Confirm Start Trip
  async function handleConfirmStartTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTripToStart) return;

    const kmVal = parseFloat(startKm);
    if (isNaN(kmVal) || kmVal <= 0) {
      appAlert.error("Por favor ingrese un kilometraje inicial válido");
      return;
    }

    startTransition(async () => {
      try {
        const res = await iniciarViajeChofer(selectedTripToStart.id, kmVal);
        if (res.success) {
          appAlert.success(`Viaje ${selectedTripToStart.codigo} iniciado exitosamente`);
          setTrips((prev) =>
            prev.map((t) =>
              t.id === selectedTripToStart.id
                ? {
                    ...t,
                    estado: "EN_CURSO",
                    kmInicio: kmVal,
                    fechaInicioReal: new Date(),
                  }
                : t
            )
          );
          setStartTripModalOpen(false);
          router.refresh();
        } else {
          appAlert.error(res.error || "Error al iniciar el viaje");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al iniciar el viaje");
      }
    });
  }

  // Handler: Open Finish Trip Modal
  function handleOpenFinishTrip(trip: ViajeRow) {
    setSelectedTripToFinish(trip);
    setFinishKm("");
    setFinishNotes("");
    setFinishTripModalOpen(true);
  }

  // Handler: Confirm Finish Trip
  async function handleConfirmFinishTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTripToFinish) return;

    const kmFinVal = parseFloat(finishKm);
    if (isNaN(kmFinVal) || kmFinVal <= 0) {
      appAlert.error("Por favor ingrese un kilometraje final válido");
      return;
    }

    if (selectedTripToFinish.kmInicio && kmFinVal < selectedTripToFinish.kmInicio) {
      appAlert.error(
        `El kilometraje final (${kmFinVal}) no puede ser menor al inicial (${selectedTripToFinish.kmInicio})`
      );
      return;
    }

    startTransition(async () => {
      try {
        const res = await finalizarViajeChofer(selectedTripToFinish.id, kmFinVal, finishNotes);
        if (res.success) {
          appAlert.success(`Viaje ${selectedTripToFinish.codigo} finalizado correctamente`);
          setTrips((prev) =>
            prev.map((t) =>
              t.id === selectedTripToFinish.id
                ? {
                    ...t,
                    estado: "COMPLETADO",
                    kmFin: kmFinVal,
                    fechaFinReal: new Date(),
                    notas: finishNotes
                      ? (t.notas ? `${t.notas} | ` : "") + finishNotes
                      : t.notas,
                  }
                : t
            )
          );
          setFinishTripModalOpen(false);
          router.refresh();
        } else {
          appAlert.error(res.error || "Error al finalizar el viaje");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al finalizar el viaje");
      }
    });
  }

  // Handler: Create Free Trip
  async function handleCreateFreeTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!freeOrigin) {
      appAlert.error("Seleccione el punto de origen");
      return;
    }
    if (!freeDestination) {
      appAlert.error("Seleccione el punto de destino");
      return;
    }

    const kmVal = freeKmInicio ? parseFloat(freeKmInicio) : undefined;
    if (freeKmInicio && (isNaN(kmVal!) || kmVal! <= 0)) {
      appAlert.error("El kilometraje inicial debe ser un número válido");
      return;
    }

    const vehId = freeVehicleId ? parseInt(freeVehicleId, 10) : undefined;
    const selectedVeh = vehicles.find((v) => v.id === vehId);

    startTransition(async () => {
      try {
        const payload = {
          choferId: driver?.id,
          vehiculoId: vehId,
          origenTipo: freeOrigin.tipo,
          origenSitioId: freeOrigin.sitioId || undefined,
          origenNombre: freeOrigin.nombre,
          origenDireccion: freeOrigin.direccion,
          origenLat: freeOrigin.lat,
          origenLng: freeOrigin.lng,
          destinoTipo: freeDestination.tipo,
          destinoSitioId: freeDestination.sitioId || undefined,
          destinoNombre: freeDestination.nombre,
          destinoDireccion: freeDestination.direccion,
          destinoLat: freeDestination.lat,
          destinoLng: freeDestination.lng,
          fechaSalidaProgramada: new Date(),
          estado: "EN_CURSO" as const,
          notas: freeNotes.trim()
            ? `Viaje Libre - ${freeNotes.trim()}`
            : "Viaje Libre Express",
        };

        const res = await createViaje(payload);
        if (res.success && res.data) {
          if (kmVal) {
            await iniciarViajeChofer(res.data.id, kmVal);
          }

          appAlert.success(`Viaje libre ${res.data.codigo} iniciado exitosamente`);
          const newRow: ViajeRow = {
            ...res.data,
            choferNombre: driver ? `${driver.nombre} ${driver.apellido}` : "Chofer",
            vehiculoPatente: selectedVeh?.patente || driver?.vehiculoHabitualPatente || null,
            kmInicio: kmVal ?? null,
            fechaInicioReal: new Date(),
            estado: "EN_CURSO",
          };

          setTrips((prev) => [newRow, ...prev]);
          setFreeTripModalOpen(false);
          setFreeOrigin(null);
          setFreeDestination(null);
          setFreeKmInicio("");
          setFreeNotes("");
          router.refresh();
        } else {
          appAlert.error(res.error || "Error al crear el viaje");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al crear el viaje");
      }
    });
  }

  const driverFullName = driver ? `${driver.nombre} ${driver.apellido}` : "Chofer Principal";
  const driverStatus = driver?.estado || "ACTIVO";
  const vehiclePlate = driver?.vehiculoHabitualPatente || vehicles[0]?.patente || "Sin asignar";

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* HEADER CARD / PERFIL DEL CHOFER */}
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {driverFullName}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5",
                    driverStatus === "ACTIVO"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                  )}
                >
                  {driverStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  <span className="font-mono font-medium text-foreground">{vehiclePlate}</span>
                </span>
                {driver?.licenciaCategoria && (
                  <span className="text-muted-foreground/60">• Cat. {driver.licenciaCategoria}</span>
                )}
              </div>
            </div>
          </div>

          {/* Botón directo a Combustible */}
          <Link href="/panel/control-flota/combustible">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-500/30 font-medium shrink-0"
            >
              <Fuel className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Cargar</span> Combustible
            </Button>
          </Link>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* SECCIÓN 1: VIAJE ACTIVO / EN CURSO */}
        <section aria-labelledby="viaje-activo-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="viaje-activo-heading"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <Navigation className="h-3.5 w-3.5 text-primary animate-pulse" />
              Viaje en Curso
            </h2>
            {activeTrip && (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse">
                EN CURSO
              </Badge>
            )}
          </div>

          {activeTrip ? (
            <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-background shadow-md overflow-hidden">
              <CardHeader className="pb-3 border-b bg-emerald-500/10 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-bold bg-background/80">
                      {activeTrip.codigo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Iniciado: {formatDate(activeTrip.fechaInicioReal || activeTrip.fechaSalidaProgramada)}
                    </span>
                  </div>
                  {activeTrip.vehiculoPatente && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {activeTrip.vehiculoPatente}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold mt-1 text-foreground flex items-center gap-2">
                  <span>{activeTrip.origenNombre}</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span>{activeTrip.destinoNombre}</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                  Destino: {activeTrip.destinoDireccion}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Métricas y Datos del Viaje */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-background/80 border p-2.5">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Gauge className="h-3.5 w-3.5 text-primary" /> Km Inicial
                    </span>
                    <p className="text-base font-bold font-mono text-foreground mt-0.5">
                      {activeTrip.kmInicio
                        ? `${activeTrip.kmInicio.toLocaleString("es-AR")} km`
                        : "No registrado"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-background/80 border p-2.5">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Salida
                    </span>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatDate(activeTrip.fechaSalidaProgramada)}
                    </p>
                  </div>

                  {activeTrip.distanciaEstimadaKm && (
                    <div className="rounded-lg bg-background/80 border p-2.5 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Distancia Estimada
                      </span>
                      <p className="text-base font-bold text-foreground mt-0.5">
                        {activeTrip.distanciaEstimadaKm} km
                      </p>
                    </div>
                  )}
                </div>

                {activeTrip.notas && (
                  <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground border">
                    <span className="font-semibold text-foreground">Notas:</span> {activeTrip.notas}
                  </div>
                )}

                {/* Enlace a Google Maps GPS */}
                <a
                  href={getGoogleMapsUrl(activeTrip)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold border border-primary/20 transition-all"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Ver Ruta en GPS / Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70 ml-1" />
                </a>
              </CardContent>

              <CardFooter className="pt-2 pb-4 border-t bg-muted/20">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleOpenFinishTrip(activeTrip)}
                  disabled={isPending}
                  className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
                >
                  <Flag className="h-5 w-5" />
                  <span>🏁 Finalizar Viaje</span>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-dashed bg-muted/20 p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Navigation className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Sin viaje en curso</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Actualmente no tienes un viaje en ejecución. Puedes iniciar uno de tus viajes planificados o registrar un nuevo viaje libre.
                </p>
              </div>
            </Card>
          )}
        </section>

        {/* SECCIÓN 3: ACCESO RÁPIDO - CREAR VIAJE LIBRE / EXPRESS */}
        <section aria-labelledby="viaje-libre-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2
              id="viaje-libre-heading"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Viaje Libre / Despacho Express
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setFreeTripModalOpen(true)}
            className="w-full h-12 text-sm sm:text-base font-semibold border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center gap-2 shadow-2xs"
          >
            <Plus className="h-5 w-5" />
            <span>+ Iniciar Nuevo Viaje Libre</span>
          </Button>
        </section>

        {/* SECCIÓN 2: PRÓXIMOS VIAJES ASIGNADOS (PLANIFICADOS) */}
        <section aria-labelledby="viajes-planificados-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="viajes-planificados-heading"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              Próximos Viajes Asignados ({plannedTrips.length})
            </h2>
          </div>

          {plannedTrips.length > 0 ? (
            <div className="space-y-3">
              {plannedTrips.map((trip) => (
                <Card key={trip.id} className="border shadow-xs hover:border-border/80 transition-all">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="font-mono text-xs font-semibold">
                        {trip.codigo}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Salida: {formatDate(trip.fechaSalidaProgramada)}</span>
                      </div>
                    </div>

                    <CardTitle className="text-base font-bold mt-1 text-foreground flex items-center gap-2">
                      <span className="truncate">{trip.origenNombre}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{trip.destinoNombre}</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground truncate">
                      {trip.origenDireccion} ➔ {trip.destinoDireccion}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 pb-3 text-xs flex items-center justify-between gap-2 flex-wrap text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        {trip.vehiculoPatente || driver?.vehiculoHabitualPatente || "Vehículo sin asignar"}
                      </span>
                      {trip.distanciaEstimadaKm && (
                        <span>• {trip.distanciaEstimadaKm} km aprox.</span>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button
                      type="button"
                      onClick={() => handleOpenStartTrip(trip)}
                      disabled={isPending || !!activeTrip}
                      className={cn(
                        "w-full h-11 text-sm font-bold gap-2",
                        activeTrip
                          ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      title={activeTrip ? "Debes finalizar el viaje en curso antes de iniciar otro" : undefined}
                    >
                      <Play className="h-4 w-4" />
                      <span>🚀 Iniciar Viaje</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/10 p-5 text-center">
              <p className="text-xs text-muted-foreground">
                No tienes viajes planificados asignados en este momento.
              </p>
            </Card>
          )}
        </section>

        {/* SECCIÓN 4: HISTORIAL DE VIAJES COMPLETADOS */}
        <section aria-labelledby="historial-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-purple-500" />
              Historial de Viajes ({completedTrips.length})
              {showHistory ? (
                <ChevronUp className="h-3.5 w-3.5 ml-1" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              )}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2">
              {completedTrips.length > 0 ? (
                completedTrips.map((trip) => {
                  const totalKm =
                    trip.kmFin && trip.kmInicio
                      ? trip.kmFin - trip.kmInicio
                      : trip.distanciaEstimadaKm ?? null;

                  return (
                    <Card key={trip.id} className="border bg-card/60 p-3.5 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{trip.codigo}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              trip.estado === "COMPLETADO"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                            )}
                          >
                            {trip.estado}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          {formatDate(trip.fechaFinReal || trip.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                        <span className="truncate">{trip.origenNombre}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{trip.destinoNombre}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span className="font-mono">
                          {trip.vehiculoPatente || driver?.vehiculoHabitualPatente || "Vehículo N/A"}
                        </span>
                        {totalKm !== null && (
                          <span className="font-semibold text-foreground">
                            {totalKm} km recorridos
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="border-dashed bg-muted/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No hay viajes completados en el historial reciente.
                  </p>
                </Card>
              )}
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: INICIAR VIAJE */}
      <Dialog open={startTripModalOpen} onOpenChange={setStartTripModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmStartTrip} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Play className="h-5 w-5 text-primary" />
                Iniciar Viaje {selectedTripToStart?.codigo}
              </DialogTitle>
              <DialogDescription>
                Confirma el vehículo y registra el kilometraje inicial del odómetro antes de comenzar la marcha.
              </DialogDescription>
            </DialogHeader>

            {selectedTripToStart && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1 border">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>{selectedTripToStart.origenNombre}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedTripToStart.destinoNombre}</span>
                </div>
                <div className="text-muted-foreground">{selectedTripToStart.destinoDireccion}</div>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-vehicle" className="text-xs font-semibold">
                  Vehículo Asignado
                </Label>
                <Select
                  value={startVehicleId}
                  onValueChange={(val) => setStartVehicleId(val)}
                >
                  <SelectTrigger id="start-vehicle" className="h-10 rounded-xl bg-card border-input">
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.patente} {v.marca ? `- ${v.marca} ${v.modelo || ""}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="start-km" className="text-xs font-semibold">
                  Kilometraje Inicial del Odómetro (Km Inicio) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start-km"
                  type="number"
                  placeholder="Ej: 145200"
                  value={startKm}
                  onChange={(e) => setStartKm(e.target.value)}
                  required
                  min="1"
                  step="1"
                  className="text-base font-mono font-bold"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Ingresa el valor numérico exacto visible en el tablero del vehículo.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStartTripModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || !startKm}
                className="bg-primary text-primary-foreground font-bold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Iniciando...
                  </>
                ) : (
                  "Confirmar e Iniciar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: FINALIZAR VIAJE */}
      <Dialog open={finishTripModalOpen} onOpenChange={setFinishTripModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmFinishTrip} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-emerald-600 dark:text-emerald-400">
                <Flag className="h-5 w-5" />
                Finalizar Viaje {selectedTripToFinish?.codigo}
              </DialogTitle>
              <DialogDescription>
                Registra el kilometraje final del vehículo y observaciones de llegada para dar por concluido el servicio.
              </DialogDescription>
            </DialogHeader>

            {selectedTripToFinish && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>{selectedTripToFinish.origenNombre}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedTripToFinish.destinoNombre}</span>
                </div>
                {selectedTripToFinish.kmInicio && (
                  <div className="text-muted-foreground font-mono">
                    Km Inicial registrado: <span className="font-bold text-foreground">{selectedTripToFinish.kmInicio.toLocaleString("es-AR")} km</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="finish-km" className="text-xs font-semibold">
                  Kilometraje Final del Odómetro (Km Fin) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="finish-km"
                  type="number"
                  placeholder="Ej: 145435"
                  value={finishKm}
                  onChange={(e) => setFinishKm(e.target.value)}
                  required
                  min={selectedTripToFinish?.kmInicio ? String(selectedTripToFinish.kmInicio) : "1"}
                  step="1"
                  className="text-base font-mono font-bold"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="finish-notes" className="text-xs font-semibold">
                  Novedades u Observaciones de Llegada (Opcional)
                </Label>
                <Input
                  id="finish-notes"
                  placeholder="Ej: Carga entregada conforme, sin demoras..."
                  value={finishNotes}
                  onChange={(e) => setFinishNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFinishTripModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || !finishKm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...
                  </>
                ) : (
                  "🏁 Confirmar Finalización"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CREAR VIAJE LIBRE / EXPRESS */}
      <Dialog open={freeTripModalOpen} onOpenChange={setFreeTripModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateFreeTrip} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-primary" />
                Iniciar Nuevo Viaje Libre / Express
              </DialogTitle>
              <DialogDescription>
                Configura rápidamente el origen, destino y kilometraje para iniciar un recorrido no planificado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Origen */}
              <LocationSelector
                label="Punto de Origen"
                sitios={sites}
                value={freeOrigin}
                onLocationSelected={setFreeOrigin}
                required
              />

              {/* Destino */}
              <LocationSelector
                label="Punto de Destino"
                sitios={sites}
                value={freeDestination}
                onLocationSelected={setFreeDestination}
                required
              />

              {/* Vehículo */}
              <div className="space-y-1.5">
                <Label htmlFor="free-vehicle" className="text-xs font-semibold">
                  Vehículo
                </Label>
                <Select
                  value={freeVehicleId}
                  onValueChange={(val) => setFreeVehicleId(val)}
                >
                  <SelectTrigger id="free-vehicle" className="h-10 rounded-xl bg-card border-input">
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.patente} {v.marca ? `- ${v.marca} ${v.modelo || ""}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kilometraje Inicial */}
              <div className="space-y-1.5">
                <Label htmlFor="free-km" className="text-xs font-semibold">
                  Kilometraje Inicial (Opcional)
                </Label>
                <Input
                  id="free-km"
                  type="number"
                  placeholder="Ej: 145200"
                  value={freeKmInicio}
                  onChange={(e) => setFreeKmInicio(e.target.value)}
                  min="1"
                  step="1"
                  className="font-mono font-medium"
                />
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label htmlFor="free-notes" className="text-xs font-semibold">
                  Motivo / Observaciones (Opcional)
                </Label>
                <Input
                  id="free-notes"
                  placeholder="Ej: Traslado express de mercadería urgente..."
                  value={freeNotes}
                  onChange={(e) => setFreeNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFreeTripModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || !freeOrigin || !freeDestination}
                className="bg-primary text-primary-foreground font-bold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...
                  </>
                ) : (
                  "Iniciar Viaje Libre"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}