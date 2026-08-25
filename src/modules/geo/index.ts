import type { CountryNodeResponse } from "../../api/services/geography/types";
import { geographyApi } from "../../api";
import type {
  Municipality,
  Department,
  Country,
  CachedGeoPayload,
  BootstrapGeoOptions,
} from "./types.d.ts";

// Config
const CACHE_KEY = "mercanto:geo_cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

//  GeoManager
export class GeoManager {
  private readonly countries = new Map<string, Country>();
  private readonly departments = new Map<string, Department>();
  private readonly municipalities = new Map<string, Municipality>();

  constructor(rawCountries: CountryNodeResponse[]) {
    for (const rawCountry of rawCountries) {
      const countryDepartments: Department[] = [];

      for (const rawDept of rawCountry.departments) {
        const deptMunicipalities: Municipality[] = [];

        for (const rawMun of rawDept.municipalities) {
          const municipality: Municipality = {
            id: rawMun.id,
            name: rawMun.name,
            departmentId: rawDept.id,
            countryId: rawCountry.id,
          };
          deptMunicipalities.push(municipality);
          this.municipalities.set(municipality.id, municipality);
        }

        const department: Department = {
          id: rawDept.id,
          name: rawDept.name,
          countryId: rawCountry.id,
          municipalities: deptMunicipalities,
        };
        countryDepartments.push(department);
        this.departments.set(department.id, department);
      }

      const country: Country = {
        id: rawCountry.id,
        name: rawCountry.name,
        isoCode: rawCountry.iso_code,
        departments: countryDepartments,
      };
      this.countries.set(country.id, country);
    }
  }

  // By ID

  getCountryById(id: string): Country | undefined {
    return this.countries.get(id);
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments.get(id);
  }

  getMunicipalityById(id: string): Municipality | undefined {
    return this.municipalities.get(id);
  }

  getCountryByIsoCode(isoCode: string): Country | undefined {
    for (const country of this.countries.values()) {
      if (country.isoCode === isoCode) return country;
    }
    return undefined;
  }

  // Lists

  getCountries(): Country[] {
    return Array.from(this.countries.values());
  }

  getDepartments(): Department[] {
    return Array.from(this.departments.values());
  }

  getMunicipalities(): Municipality[] {
    return Array.from(this.municipalities.values());
  }

  // By Parent

  getDepartmentsByCountry(countryId: string): Department[] {
    return this.countries.get(countryId)?.departments ?? [];
  }

  getMunicipalitiesByDepartment(departmentId: string): Municipality[] {
    return this.departments.get(departmentId)?.municipalities ?? [];
  }

  getMunicipalitiesByCountry(countryId: string): Municipality[] {
    return (
      this.countries
        .get(countryId)
        ?.departments.flatMap((d) => d.municipalities) ?? []
    );
  }

  toJSON(): CachedGeoPayload {
    const countries: CountryNodeResponse[] = Array.from(
      this.countries.values(),
    ).map((c) => ({
      id: c.id,
      name: c.name,
      iso_code: c.isoCode,
      departments: c.departments.map((d) => ({
        id: d.id,
        name: d.name,
        municipalities: d.municipalities.map((m) => ({
          id: m.id,
          name: m.name,
        })),
      })),
    }));

    return { countries, timestamp: Date.now() };
  }
}

// Module - level singleton
let geoManager: GeoManager | undefined = undefined;

// Access the module-level GeoManager instance
export function getGeoManager(): GeoManager | undefined {
  return geoManager;
}

//  Bootstrap
export async function bootstrapGeo(
  options: BootstrapGeoOptions = {},
): Promise<GeoManager> {
  const countryIso = options.countryIso ?? "NIC";

  if (!options.forceRefresh) {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached: CachedGeoPayload = JSON.parse(cachedRaw);
        const age = Date.now() - cached.timestamp;

        if (age < CACHE_TTL_MS && cached.countries?.length > 0) {
          geoManager = new GeoManager(cached.countries);
          return geoManager;
        }
      } catch {
        // Corrupted cache
      }
    }
  }

  const country = await geographyApi.getGeographyTree({
    country_iso: countryIso,
  });

  geoManager = new GeoManager([country]);

  localStorage.setItem(CACHE_KEY, JSON.stringify(geoManager.toJSON()));

  return geoManager;
}

export function clearGeoCache(): void {
  localStorage.removeItem(CACHE_KEY);
  geoManager = undefined;
}

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
      return (
        data?.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
      );
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)} (Error de conexión)`;
    }
  }
}
