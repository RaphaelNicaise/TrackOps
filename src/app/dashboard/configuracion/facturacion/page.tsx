import { CreditCard, ShieldAlert } from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";

export default async function FacturacionPage() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <RequireRole
      userRole={role}
      allowedRoles={["SUPER_ADMIN"]}
      fallback={
        <div className="flex flex-col items-center justify-center h-96 gap-4 text-center border rounded-lg bg-card p-8">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Acceso Restringido</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            La sección de facturación global y suscripciones está reservada exclusivamente para el rol SUPER_ADMIN.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Facturación & Suscripción (SaaS)</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de planes B2B, cobros mensuales y estados de cuenta de empresas.
          </p>
        </div>

        <div className="h-64 rounded-lg border bg-card p-8 flex flex-col items-center justify-center text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium">Panel de Cobros SaaS</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Módulo para administración de pasarelas de pago (Stripe / MercadoPago) e historial de facturas.
          </p>
        </div>
      </div>
    </RequireRole>
  );
}
