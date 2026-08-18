import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { UmamiAnalytics } from "@/components/umami-analytics";
import { ThemeProvider } from "@/components/theme/theme-provider";

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

import { AppAlertProvider } from "@/components/ui/app-alert-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${outfit.variable} ${playfair.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body className="overflow-x-hidden w-full max-w-full font-sans">
        <ThemeProvider>
          {children}
          <AppAlertProvider />
        </ThemeProvider>
        <UmamiAnalytics />
      </body>
    </html>
  );
}
