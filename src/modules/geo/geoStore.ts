import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { geographyApi } from "../../api";
import type { CountryNodeResponse } from "../../api/services/geography/types";
import type { Country, Department, Municipality, CachedGeoPayload } from "./types";

const DB_NAME = "mercanto_geo_db";
const STORE_NAME = "geo_tree";
const DB_VERSION = 1;
const CACHE_KEY = "country_data";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function openGeoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet<T>(db: IDBDatabase, key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export const useGeoStore = defineStore("geo", () => {
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const countries = ref<Map<string, Country>>(new Map());
  const departments = ref<Map<string, Department>>(new Map());
  const municipalities = ref<Map<string, Municipality>>(new Map());

  let initPromise: Promise<void> | null = null;
  let dbPromise: Promise<IDBDatabase | null> | null = null;

  if (typeof indexedDB !== "undefined") {
    dbPromise = openGeoDb().catch((err) => {
      console.warn("IndexedDB geo init failed:", err);
      return null;
    });
  }

  const countryList = computed(() => Array.from(countries.value.values()));
  const departmentList = computed(() => Array.from(departments.value.values()));
  const municipalityList = computed(() => Array.from(municipalities.value.values()));

  function hydrateEntities(rawCountries: CountryNodeResponse[]) {
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
    if (initPromise) return initPromise;

    initPromise = (async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const db = dbPromise ? await dbPromise : null;

        // IndexedDB Cache Hit Check
        if (db && !forceRefresh) {
          const cached = await idbGet<CachedGeoPayload>(db, CACHE_KEY);
          if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.countries?.length) {
            hydrateEntities(cached.countries);
            isInitialized.value = true;
            return;
          }
        }

        //  Fetch from Backend
        const countryNode = await geographyApi.getGeographyTree({ country_iso: countryIso });
        hydrateEntities([countryNode]);

        //  Persist to IndexedDB (Non-blocking)
        if (db) {
          const cachePayload: CachedGeoPayload = {
            countries: [countryNode],
            timestamp: Date.now(),
          };
          idbSet(db, CACHE_KEY, cachePayload).catch(console.warn);
        }

        isInitialized.value = true;
      } catch (err: any) {
        error.value = err instanceof Error ? err : new Error(String(err));
        throw error.value;
      } finally {
        isLoading.value = false;
        initPromise = null;
      }
    })();

    return initPromise;
  }

  function getCountryById(id: string) { return countries.value.get(id); }
  function getDepartmentById(id: string) { return departments.value.get(id); }
  function getMunicipalityById(id: string) { return municipalities.value.get(id); }
  function getDepartmentsByCountry(countryId: string) { return countries.value.get(countryId)?.departments ?? []; }
  function getMunicipalitiesByDepartment(departmentId: string) { return departments.value.get(departmentId)?.municipalities ?? []; }

  function resolveLocationHierarchy(municipalityId: string) {
    const mun = municipalities.value.get(municipalityId);
    if (!mun) return null;
    return {
      municipality: mun,
      department: departments.value.get(mun.departmentId) ?? null,
      country: countries.value.get(mun.countryId) ?? null,
    };
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
  };
});
