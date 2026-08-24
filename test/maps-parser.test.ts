import { describe, it, expect } from "vitest";
import { parseGoogleMapsUrl, isGoogleMapsUrl, extractPlaceNameFromUrl } from "@/lib/maps-parser";

describe("Google Maps URL and Coordinate Parser", () => {
  it("detects Google Maps URLs accurately", () => {
    expect(isGoogleMapsUrl("https://www.google.com/maps/place/Planta/@-34.60,-58.38,17z")).toBe(true);
    expect(isGoogleMapsUrl("https://maps.app.goo.gl/9ZxyzAbc")).toBe(true);
    expect(isGoogleMapsUrl("https://goo.gl/maps/12345")).toBe(true);
    expect(isGoogleMapsUrl("https://maps.google.com/?q=-34.6037,-58.3816")).toBe(true);
    expect(isGoogleMapsUrl("Calle Falsa 123")).toBe(false);
  });

  it("parses direct coordinate strings", () => {
    const res1 = parseGoogleMapsUrl("-34.6037, -58.3816");
    expect(res1).toEqual({ lat: -34.6037, lng: -58.3816 });

    const res2 = parseGoogleMapsUrl("-38.7183 -62.2663");
    expect(res2).toEqual({ lat: -38.7183, lng: -62.2663 });
  });

  it("parses standard Google Maps URLs with @lat,lng format and place name", () => {
    const url = "https://www.google.com/maps/place/Planta+Industrial+Z%C3%A1rate/@-34.123456,-58.987654,15z/data=!3m1!4b1";
    const res = parseGoogleMapsUrl(url);

    expect(res).toBeDefined();
    expect(res?.lat).toBe(-34.123456);
    expect(res?.lng).toBe(-58.987654);
    expect(res?.placeName).toBe("Planta Industrial Zárate");
  });

  it("parses Google Maps URLs with ?q=lat,lng format", () => {
    const url = "https://maps.google.com/?q=-34.603722,-58.381611";
    const res = parseGoogleMapsUrl(url);

    expect(res).toBeDefined();
    expect(res?.lat).toBe(-34.603722);
    expect(res?.lng).toBe(-58.381611);
  });

  it("parses Google Maps URLs with embedded !3d !4d data params", () => {
    const url = "https://www.google.com/maps/place/Retiro/@-34.5900,-58.3700,14z/data=!4m6!3m5!1s0x0:0x0!8m2!3d-34.592233!4d-58.375544!16s%2Fg";
    const res = parseGoogleMapsUrl(url);

    expect(res).toBeDefined();
    // @ or !3d match
    expect(res?.lat).toBeCloseTo(-34.59, 1);
  });

  it("returns null for non-coordinate text", () => {
    expect(parseGoogleMapsUrl("Buenos Aires")).toBeNull();
    expect(parseGoogleMapsUrl("")).toBeNull();
  });
});
