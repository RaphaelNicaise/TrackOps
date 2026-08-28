import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { UmamiAnalytics } from "@/components/umami-analytics";
import { ThemeProvider } from "@/components/theme/theme-provider";

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://prada-coral.vercel.app'),
  title: 'TrackOps - Gestión y Telemetría de Flotas',
  description: 'Rastreo satelital híbrido, mantenimiento predictivo y alertas operativas vía WhatsApp.',
  openGraph: {
    title: 'TrackOps - Gestión y Telemetría de Flotas',
    description: 'Rastreo satelital híbrido, mantenimiento predictivo y alertas operativas vía WhatsApp.',
    url: 'https://prada-coral.vercel.app',
    siteName: 'TrackOps',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TrackOps Dashboard',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackOps - Gestión y Telemetría de Flotas',
    description: 'Rastreo satelital híbrido, mantenimiento predictivo y alertas operativas vía WhatsApp.',
    images: ['/og-image.png'],
  },
};

import { AppAlertProvider } from "@/components/ui/app-alert-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body className="overflow-x-hidden w-full max-w-full font-sans antialiased bg-[#F6F4EE] text-[#1E2227] dark:bg-[#1E2227] dark:text-[#F6F4EE]">
        <ThemeProvider>
          {children}
          <AppAlertProvider />
        </ThemeProvider>
        <UmamiAnalytics />
      </body>
    </html>
  );
}
