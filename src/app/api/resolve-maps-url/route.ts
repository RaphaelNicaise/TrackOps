import { NextResponse } from "next/server";
import { parseGoogleMapsUrl, isGoogleMapsUrl } from "@/lib/maps-parser";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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

    // 2. If it's a shortlink (e.g., maps.app.goo.gl/xxx or goo.gl/maps/xxx), follow redirect
    if (trimmed.includes("maps.app.goo.gl") || trimmed.includes("goo.gl/maps")) {
      try {
        const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
        const res = await fetch(fullUrl, {
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
