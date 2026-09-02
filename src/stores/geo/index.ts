export { useGeoStore } from "./geoStore";
export type * from "./types";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const GEO_HEADERS = {
  "Accept-Language": "es",
  "User-Agent": "MercantoApp/1.0",
};

export class GeocodingService {
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const response = await fetch(url, { headers: GEO_HEADERS });
      if (!response.ok) throw new Error("Geocoding request failed");
      const data = await response.json();
      return data?.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)} (Error de conexión)`;
    }
  }
}
