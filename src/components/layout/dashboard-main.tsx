"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function DashboardMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === "/panel/mapa" || pathname.startsWith("/panel/control-flota/geocercas") || pathname === "/dashboard/mapa" || pathname.startsWith("/dashboard/control-flota/geocercas");

  if (isMap) {
    return <div className="relative w-full h-[calc(100dvh-3.5rem)] overflow-hidden">{children}</div>;
  }

  return (
    <div className="w-full flex-1 min-w-0 overflow-x-hidden p-4 md:p-8">
      {children}
    </div>
  );
}
