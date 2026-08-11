import { db } from "@/db";
import { alertConfigs } from "@/db/schema";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAlertConfig } from "@/lib/admin-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default async function AlertasPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  if (session.user.role !== "ADMIN_EMPRESA") {
    redirect("/dashboard");
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) redirect("/dashboard");

  let config = await db.query.alertConfigs.findFirst({
    where: eq(alertConfigs.empresaId, empresaId),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Alertas</h1>
        <p className="text-muted-foreground">Administre las alertas y notificaciones del sistema para su flota.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canales y Parámetros</CardTitle>
          <CardDescription>Defina por dónde y cuándo recibir las alertas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveAlertConfig} className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Activar alertas generales</p>
                <p className="text-sm text-muted-foreground">Habilita o deshabilita el envío de cualquier alerta.</p>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="active" defaultChecked={(config?.activo ?? 1) === 1} className="w-5 h-5 accent-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Canales de envío</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-md space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="emailEnabled" defaultChecked={(config?.canalEmail ?? 0) === 1} className="w-4 h-4" />
                    <label className="font-medium">Vía Email</label>
                  </div>
                  <Input name="emailDestino" placeholder="correo@ejemplo.com" defaultValue={config?.emailDestino ?? ""} />
                </div>
                
                <div className="border p-4 rounded-md space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="whatsappEnabled" defaultChecked={(config?.canalWhatsapp ?? 0) === 1} className="w-4 h-4" />
                    <label className="font-medium">Vía WhatsApp</label>
                  </div>
                  <Input name="whatsappDestino" placeholder="+5491123456789" defaultValue={config?.telefonoWhatsapp ?? ""} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Parámetros de tolerancia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tolerancia Mantenimiento (KM)</label>
                  <Input type="number" name="toleranciaKm" defaultValue={config?.toleranciaKm ?? 500} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tolerancia Vencimientos (Días)</label>
                  <Input type="number" name="toleranciaDias" defaultValue={config?.toleranciaDias ?? 15} required />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">Guardar Configuración</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
