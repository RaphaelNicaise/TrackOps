"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function DashboardMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === "/dashboard/mapa";

  if (isMap) {
    return <div className="relative w-full h-[calc(100dvh-3.5rem)] overflow-hidden">{children}</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
      {children}
    </div>
  );
}
