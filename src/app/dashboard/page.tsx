import { auth } from "@/auth";
import { getEffectiveTenantContext } from "@/lib/impersonation";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const tenantContext = await getEffectiveTenantContext();

  if (session?.user?.role === "SUPER_ADMIN" && !tenantContext?.isImpersonating) {
    redirect("/dashboard/superadmin/dashboard");
  }

  redirect("/dashboard/monitoreo/dashboard");
}
