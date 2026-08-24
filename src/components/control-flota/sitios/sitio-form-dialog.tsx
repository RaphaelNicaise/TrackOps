"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Building2,
  Navigation,
  Check,
  Building,
  Factory,
  Warehouse,
  Store,
  Truck,
  Wrench,
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
import { NativeSelect } from "@/components/ui/native-select";
import { appAlert } from "@/lib/alerts";
import { createSitio, updateSitio, deleteSitio } from "@/lib/flota-actions";
import type {
  SitioRow,
  SitioTipo,
  CreateSitioInput,
  UpdateSitioInput,
} from "@/types/flota-viajes";

export interface SitioFormDialogProps {
  sitio?: SitioRow | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: (sitio: SitioRow) => void;
}

export const SITIO_TIPOS: { value: SitioTipo; label: string; icon: any }[] = [
  { value: "PLANTA", label: "Planta Industrial", icon: Factory },
  { value: "DEPOSITO", label: "Depósito Logístico", icon: Warehouse },
  { value: "CLIENTE", label: "Cliente", icon: Building2 },
  { value: "SUCURSAL", label: "Sucursal", icon: Store },
  { value: "PROVEEDOR", label: "Proveedor", icon: Truck },
  { value: "TALLER", label: "Taller Mecánico", icon: Wrench },
  { value: "OTRO", label: "Otro / Punto de Interés", icon: MapPin },
];

export function SitioFormDialog({
  sitio,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: SitioFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [isPending, startTransition] = useTransition();

  // Form State
  const [nombre, setNombre] = useState(sitio?.nombre || "");
  const [tipo, setTipo] = useState<SitioTipo>(sitio?.tipo || "DEPOSITO");
  const [direccion, setDireccion] = useState(sitio?.direccion || "");
  const [ciudad, setCiudad] = useState(sitio?.ciudad || "");
  const [provincia, setProvincia] = useState(sitio?.provincia || "");
  const [lat, setLat] = useState<string>(sitio?.lat !== undefined ? String(sitio.lat) : "-34.6037");
  const [lng, setLng] = useState<string>(sitio?.lng !== undefined ? String(sitio.lng) : "-58.3816");
  const [radioMetros, setRadioMetros] = useState<number>(sitio?.radioMetros ?? 100);
  const [contactoNombre, setContactoNombre] = useState(sitio?.contactoNombre || "");
  const [contactoTelefono, setContactoTelefono] = useState(sitio?.contactoTelefono || "");

  // Sync state when sitio prop changes
  useEffect(() => {
    if (sitio) {
      setNombre(sitio.nombre || "");
      setTipo(sitio.tipo || "DEPOSITO");
      setDireccion(sitio.direccion || "");
      setCiudad(sitio.ciudad || "");
      setProvincia(sitio.provincia || "");
      setLat(String(sitio.lat));
      setLng(String(sitio.lng));
      setRadioMetros(sitio.radioMetros ?? 100);
      setContactoNombre(sitio.contactoNombre || "");
      setContactoTelefono(sitio.contactoTelefono || "");
    } else {
      setNombre("");
      setTipo("DEPOSITO");
      setDireccion("");
      setCiudad("");
      setProvincia("");
      setLat("-34.6037");
      setLng("-58.3816");
      setRadioMetros(100);
      setContactoNombre("");
      setContactoTelefono("");
    }
  }, [sitio, open]);

  const isEdit = !!sitio?.id;

  function handleUseCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
          appAlert.success("Coordenadas GPS obtenidas de tu ubicación actual.");
        },
        (err) => {
          appAlert.error("No se pudo obtener la ubicación GPS del dispositivo.");
        }
      );
    } else {
      appAlert.error("Geolocalización no soportada por el navegador.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nombre.trim()) {
      appAlert.error("El nombre del sitio es obligatorio.");
      return;
    }
    if (!direccion.trim()) {
      appAlert.error("La dirección física es obligatoria.");
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      appAlert.error("Las coordenadas de latitud y longitud deben ser números válidos.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          const payload: UpdateSitioInput = {
            id: sitio.id,
            nombre: nombre.trim(),
            tipo,
            direccion: direccion.trim(),
            ciudad: ciudad.trim() || null,
            provincia: provincia.trim() || null,
            lat: latNum,
            lng: lngNum,
            radioMetros: Number(radioMetros) || 100,
            contactoNombre: contactoNombre.trim() || null,
            contactoTelefono: contactoTelefono.trim() || null,
          };

          const res = await updateSitio(sitio.id, payload);
          if (res.success && res.data) {
            appAlert.success("Sitio actualizado correctamente.");
            setOpen(false);
            onSuccess?.(res.data);
            router.refresh();
          } else {
            appAlert.error(res.error || "No se pudo actualizar el sitio.");
          }
        } else {
          const payload: CreateSitioInput = {
            nombre: nombre.trim(),
            tipo,
            direccion: direccion.trim(),
            ciudad: ciudad.trim() || null,
            provincia: provincia.trim() || null,
            lat: latNum,
            lng: lngNum,
            radioMetros: Number(radioMetros) || 100,
            contactoNombre: contactoNombre.trim() || null,
            contactoTelefono: contactoTelefono.trim() || null,
            activo: 1,
          };

          const res = await createSitio(payload);
          if (res.success && res.data) {
            appAlert.success("Sitio creado exitosamente.");
            setOpen(false);
            onSuccess?.(res.data);
            router.refresh();
          } else {
            appAlert.error(res.error || "No se pudo crear el sitio.");
          }
        }
      } catch (err: any) {
        console.error("Error saving sitio:", err);
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
              + Nuevo Sitio
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
            {isEdit ? `Editar Sitio: ${sitio.nombre}` : "Nuevo Sitio de Interés"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modificá la ubicación física, tipo, geocerca o datos de contacto del sitio."
              : "Definí un nuevo punto de interés (planta, depósito, cliente) para programar viajes y geocercas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Sección 1: Identificación y Tipo */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identificación y Tipo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sitio-nombre" className="text-xs font-medium">
                  Nombre del Sitio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sitio-nombre"
                  placeholder="Ej. Planta Zárate, Depósito Central..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sitio-tipo" className="text-xs font-medium">
                  Tipo de Sitio <span className="text-destructive">*</span>
                </Label>
                <NativeSelect
                  id="sitio-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as SitioTipo)}
                  sizeVariant="lg"
                >
                  {SITIO_TIPOS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* Sección 2: Dirección y Localización */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dirección y Localización
            </h4>
            <div className="space-y-1.5">
              <Label htmlFor="sitio-direccion" className="text-xs font-medium">
                Dirección Física <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sitio-direccion"
                placeholder="Ej. Ruta 9 Km 85, Av. Circunvalación 1200..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sitio-ciudad" className="text-xs font-medium">
                  Ciudad
                </Label>
                <Input
                  id="sitio-ciudad"
                  placeholder="Ej. Zárate, Rosario, Córdoba..."
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sitio-provincia" className="text-xs font-medium">
                  Provincia
                </Label>
                <Input
                  id="sitio-provincia"
                  placeholder="Ej. Buenos Aires, Santa Fe..."
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Coordenadas GPS y Geocerca */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Coordenadas GPS y Geocerca
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                className="h-7 text-xs gap-1 text-primary hover:text-primary"
              >
                <Navigation className="h-3 w-3" />
                Mi ubicación actual
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sitio-lat" className="text-xs font-medium">
                  Latitud (GPS) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sitio-lat"
                  type="number"
                  step="any"
                  placeholder="Ej. -34.6037"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sitio-lng" className="text-xs font-medium">
                  Longitud (GPS) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sitio-lng"
                  type="number"
                  step="any"
                  placeholder="Ej. -58.3816"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sitio-radio" className="text-xs font-medium">
                  Radio de aproximación (metros)
                </Label>
                <Input
                  id="sitio-radio"
                  type="number"
                  min="10"
                  max="5000"
                  placeholder="100"
                  value={radioMetros}
                  onChange={(e) => setRadioMetros(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Contacto en el Sitio */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Datos de Contacto en el Sitio
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sitio-contacto-nombre" className="text-xs font-medium">
                  Nombre de Contacto
                </Label>
                <Input
                  id="sitio-contacto-nombre"
                  placeholder="Ej. Ing. Carlos Gómez (Seguridad)"
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sitio-contacto-telefono" className="text-xs font-medium">
                  Teléfono de Contacto
                </Label>
                <Input
                  id="sitio-contacto-telefono"
                  type="tel"
                  placeholder="Ej. +54 9 3487 112233"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                />
              </div>
            </div>
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
                "Guardando..."
              ) : isEdit ? (
                <>
                  <Check className="h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear Sitio
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateSitioDialog(props: SitioFormDialogProps) {
  return <SitioFormDialog {...props} sitio={null} />;
}

export function EditSitioDialog({
  sitio,
  ...props
}: SitioFormDialogProps & { sitio: SitioRow }) {
  return <SitioFormDialog {...props} sitio={sitio} />;
}

export function DeleteSitioDialog({
  sitio,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: {
  sitio: SitioRow;
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

  function handleDelete() {
    startTransition(async () => {
      try {
        const res = await deleteSitio(sitio.id);
        if (res.success) {
          appAlert.success(`El sitio ${sitio.nombre} fue eliminado.`);
          setOpen(false);
          onSuccess?.();
          router.refresh();
        } else {
          appAlert.error(res.error || "No se pudo eliminar el sitio.");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al eliminar sitio.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar sitio {sitio.nombre}?</DialogTitle>
          <DialogDescription>
            Esta acción eliminará el sitio ubicado en {sitio.direccion} ({sitio.ciudad || "Sin ciudad"}).
            Esta operación no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Eliminando..." : "Eliminar Sitio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
