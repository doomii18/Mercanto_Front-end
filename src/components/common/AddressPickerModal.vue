<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import BaseModal from "./BaseModal.vue";
import { GeocodingService } from "../../modules/geo";
import { geographyApi } from "../../api";

export interface AddressPickerResult {
  latitude: number;
  longitude: number;
  address: string;
  municipalityId: string;
}

interface Props {
  modelValue: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialLat: null,
  initialLng: null,
  initialAddress: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", result: AddressPickerResult): void;
  (e: "cancel"): void;
}>();

const DEFAULT_CENTER = [12.1328, -86.2504];

const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: any = null;
let markerInstance: any = null;

const isLocating = ref(false);
const mapAddressText = ref("Ninguna ubicación seleccionada");
const tempLat = ref<number | null>(null);
const tempLng = ref<number | null>(null);
const tempAddress = ref("");
const tempMunicipalityId = ref<string | null>(null);

const ensureLeafletAssets = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      resolve();
      return;
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      const existingScript = document.getElementById("leaflet-js") as HTMLScriptElement;
      existingScript.addEventListener("load", () => resolve(), { once: true });
    }
  });
};

const updateMapMarker = async (lat: number, lng: number) => {
  const L = (window as any).L;
  if (!L || !mapInstance) return;

  tempLat.value = lat;
  tempLng.value = lng;

  if (markerInstance) {
    markerInstance.setLatLng([lat, lng]);
  } else {
    markerInstance = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);
    markerInstance.on("dragend", (e: any) => {
      const pos = e.target.getLatLng();
      updateMapMarker(pos.lat, pos.lng);
    });
  }

  mapAddressText.value = "Obteniendo dirección y municipio...";
  try {
    tempAddress.value = await GeocodingService.reverseGeocode(lat, lng);
    mapAddressText.value = tempAddress.value;

    const geoRes = await geographyApi.getMunicipalityByCoordinates({ lat, lng });
    tempMunicipalityId.value = geoRes.id;
  } catch (error) {
    console.error("Geocoding / Municipality resolution failed:", error);
    tempMunicipalityId.value = null;
    mapAddressText.value = `${tempAddress.value || "Ubicación seleccionada"} (Fuera de cobertura municipal)`;
  }
};

const initMap = async () => {
  await ensureLeafletAssets();
  await nextTick();

  const L = (window as any).L;
  if (!L || !mapContainer.value) return;

  const lat = props.initialLat || DEFAULT_CENTER[0];
  const lng = props.initialLng || DEFAULT_CENTER[1];

  if (!mapInstance) {
    mapInstance = L.map(mapContainer.value).setView([lat, lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapInstance);

    mapInstance.on("click", (e: any) => updateMapMarker(e.latlng.lat, e.latlng.lng));
  } else {
    mapInstance.invalidateSize();
  }

  if (props.initialLat && props.initialLng) {
    mapInstance.setView([props.initialLat, props.initialLng], 15);
    updateMapMarker(props.initialLat, props.initialLng);
  } else if (props.initialAddress) {
    mapAddressText.value = props.initialAddress;
  }
};

const destroyMap = () => {
  if (markerInstance) {
    markerInstance = null;
  }
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
};

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocalización no soportada por el navegador.");
    return;
  }

  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      if (mapInstance) {
        mapInstance.setView([latitude, longitude], 16);
        await updateMapMarker(latitude, longitude);
      }
      isLocating.value = false;
    },
    () => {
      alert("Permiso denegado o error al obtener la ubicación actual.");
      isLocating.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  if (tempLat.value === null || tempLng.value === null || !tempMunicipalityId.value) return;

  emit("confirm", {
    latitude: tempLat.value,
    longitude: tempLng.value,
    address: tempAddress.value,
    municipalityId: tempMunicipalityId.value,
  });
  emit("update:modelValue", false);
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      tempLat.value = props.initialLat ?? null;
      tempLng.value = props.initialLng ?? null;
      tempAddress.value = props.initialAddress || "";
      mapAddressText.value = props.initialAddress || "Ninguna ubicación seleccionada";
      setTimeout(initMap, 50);
    } else {
      destroyMap();
    }
  }
);

onMounted(() => {
  ensureLeafletAssets();
});

onBeforeUnmount(() => {
  destroyMap();
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="680px"
    @close="handleCancel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <h2 class="map-modal-header">
      <i class="fa-solid fa-location-dot"></i> Seleccionar Ubicación
    </h2>

    <button
      type="button"
      class="btn-teal map-btn-current"
      :disabled="isLocating"
      @click="useCurrentLocation"
    >
      <i :class="isLocating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-location-crosshairs'"></i>
      <span>{{ isLocating ? "Obteniendo..." : "Usar mi ubicación actual" }}</span>
    </button>

    <div ref="mapContainer" class="map-container-wrapper"></div>

    <label class="map-address-label">Dirección detectada:</label>
    <div class="map-address-box">
      {{ mapAddressText }}
    </div>

    <template #footer>
      <div class="map-modal-actions">
        <button
          type="button"
          class="btn-secondary"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn-teal"
          :disabled="!tempMunicipalityId"
          @click="handleConfirm"
        >
          Confirmar Ubicación
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.map-modal-header {
  text-align: left;
  font-size: 1.3rem;
  color: var(--primary-blue);
  margin-bottom: 1rem;
}

.map-btn-current {
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 8px;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.map-container-wrapper {
  height: 320px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-gray);
  z-index: 1;
}

.map-address-label {
  display: block;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-blue);
  margin-top: 1rem;
}

.map-address-box {
  padding: 0.75rem;
  background: var(--bg-gray);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #475569;
  text-align: left;
  margin-top: 0.4rem;
}

.map-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

.btn-teal {
  background: var(--light-teal);
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-teal:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid var(--border-gray);
  color: var(--primary-blue);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>
