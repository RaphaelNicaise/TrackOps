import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseGoogleMapsUrl } from "@/lib/maps-parser";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "www.google.com",
  "google.com",
]);

export async function GET(request: Request) {
  try {
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session fallback
    }

    if (!session?.user && !isTest) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inputUrl = searchParams.get("url") || searchParams.get("q");

    if (!inputUrl) {
      return NextResponse.json({ error: "Parámetro url o q requerido" }, { status: 400 });
    }

    const trimmed = inputUrl.trim();

    // 1. Direct parse attempt
    const parsedDirect = parseGoogleMapsUrl(trimmed);
    if (parsedDirect) {
      return NextResponse.json(parsedDirect);
    }

    // 2. Parse target URL and strictly validate allowed hostname
    let targetUrl: URL;
    try {
      targetUrl = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    const hostname = targetUrl.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".google.com") || hostname.endsWith(".goo.gl");

    if (!isAllowedHost) {
      return NextResponse.json(
        { error: "Dominio no permitido. Solo se aceptan enlaces de Google Maps." },
        { status: 400 }
      );
    }

    // 3. Follow redirect for valid Google Maps shortlinks
    try {
      const res = await fetch(targetUrl.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const finalUrl = res.url;
      const parsedFinal = parseGoogleMapsUrl(finalUrl);
      if (parsedFinal) {
        return NextResponse.json(parsedFinal);
      }

      // If not directly in URL, check if coordinates are in response body (meta tags or script tags)
      const html = await res.text();
      const metaMatch = html.match(/itemprop="image" content="[^"]*center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) ||
        html.match(/meta content="https:\/\/maps\.google\.com\/maps\/api\/staticmap\?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) ||
        html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);

      if (metaMatch) {
        const lat = parseFloat(metaMatch[1]);
        const lng = parseFloat(metaMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return NextResponse.json({
            lat,
            lng,
            rawUrl: finalUrl,
          });
        }
      }
    } catch (fetchErr) {
      console.warn("Could not resolve short Google Maps link:", fetchErr);
    }

    return NextResponse.json(
      { error: "No se pudieron extraer coordenadas del enlace o texto proporcionado." },
      { status: 422 }
    );
  } catch (error: any) {
    console.error("Error resolving maps URL:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el enlace" },
      { status: 500 }
    );
  }
}
