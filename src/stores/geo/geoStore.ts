import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { geographyApi } from "@/api";
import { StoreCache } from "@/utils/cache";
import type { CountryNodeResponse } from "@/api/services/geography/types";
import type { Country, Department, Municipality } from "./types";

const GEO_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const useGeoStore = defineStore("geo", () => {
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const countries = ref<Map<string, Country>>(new Map());
  const departments = ref<Map<string, Department>>(new Map());
  const municipalities = ref<Map<string, Municipality>>(new Map());

  // L1 Memory + L2 IndexedDB Persistent Cache
  const geoCache = new StoreCache<CountryNodeResponse>({
    persistent: true,
    dbName: "mercanto_geo_db",
    storeName: "geo_tree",
    ttlMs: GEO_TTL_MS,
    maxMemoryEntries: 10,
  });

  const countryList = computed(() => Array.from(countries.value.values()));
  const departmentList = computed(() => Array.from(departments.value.values()));
  const municipalityList = computed(() => Array.from(municipalities.value.values()));

  function hydrateEntities(rawCountries: CountryNodeResponse[]): void {
    const cMap = new Map<string, Country>();
    const dMap = new Map<string, Department>();
    const mMap = new Map<string, Municipality>();

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
          mMap.set(municipality.id, municipality);
        }

        const department: Department = {
          id: rawDept.id,
          name: rawDept.name,
          countryId: rawCountry.id,
          municipalities: deptMunicipalities,
        };
        countryDepartments.push(department);
        dMap.set(department.id, department);
      }

      const country: Country = {
        id: rawCountry.id,
        name: rawCountry.name,
        isoCode: rawCountry.iso_code,
        departments: countryDepartments,
      };
      cMap.set(country.id, country);
    }

    countries.value = cMap;
    departments.value = dMap;
    municipalities.value = mMap;
  }

  async function initialize(countryIso = "NIC", forceRefresh = false): Promise<void> {
    if (isInitialized.value && !forceRefresh) return;

    isLoading.value = true;
    error.value = null;

    try {
      const countryNode = await geoCache.getOrFetch(
        countryIso,
        () => geographyApi.getGeographyTree({ country_iso: countryIso }),
        { forceRefresh },
      );

      hydrateEntities([countryNode]);
      isInitialized.value = true;
    } catch (err: any) {
      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  function getCountryById(id: string): Country | undefined {
    return countries.value.get(id);
  }

  function getDepartmentById(id: string): Department | undefined {
    return departments.value.get(id);
  }

  function getMunicipalityById(id: string): Municipality | undefined {
    return municipalities.value.get(id);
  }

  function getDepartmentsByCountry(countryId: string): Department[] {
    return countries.value.get(countryId)?.departments ?? [];
  }

  function getMunicipalitiesByDepartment(departmentId: string): Municipality[] {
    return departments.value.get(departmentId)?.municipalities ?? [];
  }

  function resolveLocationHierarchy(municipalityId: string) {
    const mun = municipalities.value.get(municipalityId);
    if (!mun) return null;
    return {
      municipality: mun,
      department: departments.value.get(mun.departmentId) ?? null,
      country: countries.value.get(mun.countryId) ?? null,
    };
  }

  async function clearCache(): Promise<void> {
    await geoCache.clear();
    countries.value = new Map();
    departments.value = new Map();
    municipalities.value = new Map();
    isInitialized.value = false;
  }

  return {
    isInitialized,
    isLoading,
    error,
    countryList,
    departmentList,
    municipalityList,
    initialize,
    getCountryById,
    getDepartmentById,
    getMunicipalityById,
    getDepartmentsByCountry,
    getMunicipalitiesByDepartment,
    resolveLocationHierarchy,
    clearCache,
  };
});
