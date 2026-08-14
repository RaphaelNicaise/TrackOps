"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function DashboardMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === "/dashboard/mapa";
  const isVehiculos = pathname.startsWith("/dashboard/control-flota/vehiculos");

  if (isMap) {
    return <div className="relative w-full h-[calc(100dvh-3.5rem)] overflow-hidden">{children}</div>;
  }

  if (isVehiculos) {
    return <div className="w-full flex-1">{children}</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
      {children}
    </div>
  );
}
