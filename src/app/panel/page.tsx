import { auth } from "@/auth";
import { getEffectiveTenantContext } from "@/lib/impersonation";
import { redirect } from "next/navigation";

export default async function PanelPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  const tenantContext = await getEffectiveTenantContext();

  if (session.user.role === "SUPER_ADMIN" && !tenantContext?.isImpersonating) {
    redirect("/panel/superadmin/dashboard");
  }

  if (session.user.role === "CHOFER") {
    redirect("/panel/chofer");
  }

  if (session.user.role === "VENDEDOR_INSTALADOR") {
    redirect("/panel/mapa");
  }

  redirect("/panel/monitoreo/dashboard");
}
