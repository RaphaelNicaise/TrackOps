import { auth } from "@/auth";
import SuperAdminPanel from "@/components/dashboard/SuperAdminPanel";
import { EmpresaPanel } from "@/components/dashboard/EmpresaPanel";

export default async function DashboardHomePage() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Bienvenido, {session?.user?.name || session?.user?.email}</h1>
      
      {role === "SUPER_ADMIN" && <SuperAdminPanel />}
      {role === "ADMIN_EMPRESA" && session?.user?.empresaId && <EmpresaPanel empresaId={session.user.empresaId} />}
      {role === "CHOFER" && <p className="mt-4 text-muted-foreground">Panel móvil para reportes rápidos (En desarrollo).</p>}
    </div>
  );
}
