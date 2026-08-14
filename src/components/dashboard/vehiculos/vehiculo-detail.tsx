"use client";

import Link from "next/link";
import { ArrowLeft, Truck, CircleAlert, FileText } from "lucide-react";
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

export type VehiculoDetailData = {
  id: number;
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
  const rtoVencido = vehicle.rto ? isBefore(vehicle.rto, new Date()) : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/dashboard/control-flota/vehiculos">
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
          <EditVehicleDialog vehicle={vehicle} />
          <DeleteVehicleButton id={vehicle.id} patente={vehicle.patente} />
        </div>
      </div>

      <Tabs defaultValue="informacion" className="max-w-4xl">
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

        <TabsContent value="informacion">
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

        <TabsContent value="vencimientos">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleAlert className="h-4 w-4" />
                Sin vencimientos ni alertas cargadas.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentacion">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Sin documentación cargada.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}