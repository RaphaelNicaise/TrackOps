import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { UmamiAnalytics } from "@/components/umami-analytics";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "TRACKOPS - Control & Mantenimiento de Flota",
  description: "Plataforma de gestión de flota, bitácora de mantenimiento, tracking GPS y analíticas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${outfit.variable} ${playfair.variable}`}>
      <body className="overflow-x-hidden w-full max-w-full font-sans">
        {children}
        <UmamiAnalytics />
      </body>
    </html>
  );
}
