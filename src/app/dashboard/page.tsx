import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user?.role === "SUPER_ADMIN") {
    redirect("/dashboard/superadmin/dashboard");
  }

  redirect("/dashboard/monitoreo/dashboard");
}
