import type { Metadata } from "next";
import "./globals.css";
import { UmamiAnalytics } from "@/components/umami-analytics";

export const metadata: Metadata = {
  title: "PRADA - Control & Mantenimiento de Flota",
  description: "Plataforma de gestión de flota, bitácora de mantenimiento, tracking GPS y analíticas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <UmamiAnalytics />
      </body>
    </html>
  );
}
