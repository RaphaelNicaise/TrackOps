"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Truck, CircleAlert, Bell } from "lucide-react";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { EditVehicleDialog, DeleteVehicleButton } from "./vehicle-dialogs";
import { VehiculoDocumentos } from "./documentos";

export type VehiculoDetailData = {
  id: number;
  empresaId?: number | null;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string | null;
  chasis: string | null;
  kilometrajeActual: number;
  rto: Date | null;
};

interface VehiculoDetailProps {
  vehicle: VehiculoDetailData;
}

const TIPO_LABEL: Record<string, string> = {
  camion: "Camión",
  bus: "Colectivo",
  utilitario: "Utilitario",
  auto: "Auto",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export function VehiculoDetail({ vehicle }: VehiculoDetailProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams?.get("tab");
  const validTabs = ["informacion", "vencimientos", "documentacion"];
  const activeTab = tabParam && validTabs.includes(tabParam) ? tabParam : "informacion";

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const rtoVencido = vehicle.rto ? isBefore(vehicle.rto, new Date()) : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/panel/control-flota/vehiculos">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Truck className="h-7 w-7 text-primary" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono uppercase">
              {vehicle.patente}
            </h1>
            <p className="text-sm text-muted-foreground">
              {vehicle.marca} {vehicle.modelo} · {vehicle.anio ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vehicle.rto && (
            <Badge
              variant={rtoVencido ? "destructive" : "outline"}
              className={rtoVencido ? "" : "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15"}
            >
              RTO {rtoVencido ? "Vencido" : "Vigente"} ·{" "}
              {format(vehicle.rto, "dd/MM/yyyy", { locale: es })}
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(vehicle.patente)}`}>
              <Bell className="h-4 w-4 text-amber-500" />
              Ver Alertas
            </Link>
          </Button>
          <EditVehicleDialog vehicle={vehicle} />
          <DeleteVehicleButton id={vehicle.id} patente={vehicle.patente} />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="informacion">
            Información
          </TabsTrigger>
          <TabsTrigger value="vencimientos">
            Vencimientos y alertas
          </TabsTrigger>
          <TabsTrigger value="documentacion">
            Documentación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="pt-2">
          <div className="grid gap-6 md:grid-cols-2 items-stretch max-w-4xl">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Información General</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow label="Patente" value={<span className="font-mono uppercase">{vehicle.patente}</span>} />
                <InfoRow label="Marca" value={vehicle.marca} />
                <InfoRow label="Modelo" value={vehicle.modelo} />
                <InfoRow label="Año" value={vehicle.anio ?? "—"} />
                <InfoRow label="Chasis" value={<span className="font-mono">{vehicle.chasis ?? "—"}</span>} />
                <InfoRow label="Tipo" value={vehicle.tipo ? (TIPO_LABEL[vehicle.tipo] ?? vehicle.tipo) : "—"} />
                <InfoRow label="Grupos" value="—" />
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Uso</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sin datos de uso cargados.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vencimientos" className="pt-2">
          <Card className="max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Vencimientos y Alertas</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Alertas operativas, mantenimientos preventivos y vencimientos legales.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="gap-2 shrink-0">
                <Link href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(vehicle.patente)}`}>
                  <Bell className="h-4 w-4 text-amber-500" />
                  Ver Alertas
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircleAlert className="h-4 w-4" />
                  Consulte las alertas e incidentes registrados para la unidad {vehicle.patente}.
                </div>
                <Button variant="link" size="sm" asChild className="gap-1.5 p-0 h-auto font-medium">
                  <Link href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(vehicle.patente)}`}>
                    Ver historial de alertas &rarr;
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentacion" className="pt-2">
          <VehiculoDocumentos
            vehicleId={vehicle.id}
            empresaId={vehicle.empresaId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}