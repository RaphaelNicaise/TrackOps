/**
 * Utility to parse Google Maps links, search queries, and GPS coordinates.
 */

export interface ParsedLocationResult {
  lat: number;
  lng: number;
  placeName?: string;
  rawUrl?: string;
}

/**
 * Checks if a string looks like a Google Maps URL or short link.
 */
export function isGoogleMapsUrl(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const trimmed = input.trim();
  return (
    trimmed.includes("google.com/maps") ||
    trimmed.includes("maps.google.com") ||
    trimmed.includes("maps.app.goo.gl") ||
    trimmed.includes("goo.gl/maps") ||
    trimmed.startsWith("http://maps.google") ||
    trimmed.startsWith("https://maps.google")
  );
}

/**
 * Extracts place name from Google Maps URL path if available.
 * e.g., /maps/place/Planta+Industrial+Zárate/@-34... -> "Planta Industrial Zárate"
 */
export function extractPlaceNameFromUrl(url: string): string | undefined {
  try {
    const match = url.match(/\/place\/([^/@?#]+)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1].replace(/\+/g, " ")).trim();
      if (decoded && !/^-?\d+(\.\d+)?$/.test(decoded)) {
        return decoded;
      }
    }
  } catch {
    // Ignore decoding errors
  }
  return undefined;
}

/**
 * Parses coordinates and place name from any Google Maps URL or direct coordinates string.
 */
export function parseGoogleMapsUrl(input: string): ParsedLocationResult | null {
  if (!input || typeof input !== "string") return null;
  const text = input.trim();

  // 1. Direct coordinates format: "-34.6037, -58.3816" or "-34.6037 -58.3816"
  const directCoordMatch = text.match(/^(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (directCoordMatch) {
    const lat = parseFloat(directCoordMatch[1]);
    const lng = parseFloat(directCoordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 2. Google Maps URL with @lat,lng format
  // e.g., https://www.google.com/maps/place/Something/@-34.603722,-58.381611,17z/...
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        placeName: extractPlaceNameFromUrl(text),
        rawUrl: text,
      };
    }
  }

  // 3. Google Maps with ?q=lat,lng or &q=lat,lng
  // e.g., https://maps.google.com/?q=-34.6037,-58.3816
  const qMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        placeName: extractPlaceNameFromUrl(text),
        rawUrl: text,
      };
    }
  }

  // 4. Google Maps with ?ll=lat,lng
  // e.g., https://maps.google.com/?ll=-34.6037,-58.3816
  const llMatch = text.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        placeName: extractPlaceNameFromUrl(text),
        rawUrl: text,
      };
    }
  }

  // 5. Embedded data params (!3d... !4d...)
  // e.g., ...!8m2!3d-34.603722!4d-58.381611...
  const dataMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        placeName: extractPlaceNameFromUrl(text),
        rawUrl: text,
      };
    }
  }

  return null;
}

export interface GeocodedPlace {
  nombre: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  lat: number;
  lng: number;
}

/**
 * Reverse geocodes lat/lng into address, city, and province using OpenStreetMap / Nominatim.
 */
export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<GeocodedPlace | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const road = addr.road || addr.pedestrian || addr.street || addr.industrial || "";
    const house = addr.house_number || "";
    const street = road ? (house ? `${road} ${house}` : road) : (data.display_name?.split(",")[0] || "");
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const state = addr.state || addr.province || "";
    const name = data.name || data.display_name?.split(",")[0] || street;

    return {
      nombre: name,
      direccion: street || data.display_name || "",
      ciudad: city || undefined,
      provincia: state || undefined,
      lat,
      lng,
    };
  } catch (err) {
    console.warn("Reverse geocoding failed:", err);
    return null;
  }
}
