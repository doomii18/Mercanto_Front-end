<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import BaseModal from "./BaseModal.vue";
import { GeocodingService, useGeoStore } from "../../stores/geo";
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

const geoStore = useGeoStore();

const DEFAULT_CENTER = [12.1328, -86.2504] as [number, number];

const zoom = ref(13);
const center = ref<[number, number]>(
  props.initialLat && props.initialLng
    ? [props.initialLat, props.initialLng]
    : DEFAULT_CENTER
);
const markerPosition = ref<[number, number] | null>(
  props.initialLat && props.initialLng
    ? [props.initialLat, props.initialLng]
    : null
);

const isLocating = ref(false);
const mapAddressText = ref(props.initialAddress || "Ninguna ubicación seleccionada");
const tempAddress = ref(props.initialAddress || "");
const tempMunicipalityId = ref<string | null>(null);

const updateMarker = async (lat: number, lng: number) => {
  markerPosition.value = [lat, lng];
  mapAddressText.value = "Obteniendo dirección y municipio...";

  try {
    tempAddress.value = await GeocodingService.reverseGeocode(lat, lng);

    const geoRes = await geographyApi.getMunicipalityByCoordinates({ lat, lng });
    tempMunicipalityId.value = geoRes.id;

    const hierarchy = geoStore.resolveLocationHierarchy(geoRes.id);
    if (hierarchy?.municipality && hierarchy?.department) {
      mapAddressText.value = `${tempAddress.value} (${hierarchy.municipality.name}, ${hierarchy.department.name})`;
    } else {
      mapAddressText.value = tempAddress.value;
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
    tempMunicipalityId.value = null;
    mapAddressText.value = `${tempAddress.value || "Ubicación seleccionada"} (Fuera de cobertura)`;
  }
};

const handleMapClick = (e: any) => {
  const { lat, lng } = e.latlng;
  updateMarker(lat, lng);
};

const handleMarkerMove = (e: any) => {
  const { lat, lng } = e.target.getLatLng();
  updateMarker(lat, lng);
};

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocalización no soportada.");
    return;
  }
  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      center.value = [latitude, longitude];
      zoom.value = 16;
      updateMarker(latitude, longitude);
      isLocating.value = false;
    },
    () => {
      alert("Permiso denegado o error al obtener ubicación.");
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
  if (!markerPosition.value || !tempMunicipalityId.value) return;
  emit("confirm", {
    latitude: markerPosition.value[0],
    longitude: markerPosition.value[1],
    address: tempAddress.value,
    municipalityId: tempMunicipalityId.value,
  });
  emit("update:modelValue", false);
};

onMounted(async () => {
  if (!geoStore.isInitialized) {
    await geoStore.initialize();
  }
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      const lat = props.initialLat ?? DEFAULT_CENTER[0];
      const lng = props.initialLng ?? DEFAULT_CENTER[1];
      center.value = [lat, lng];
      zoom.value = props.initialLat && props.initialLng ? 15 : 13;
      markerPosition.value = props.initialLat && props.initialLng ? [lat, lng] : null;
      tempAddress.value = props.initialAddress || "";
      mapAddressText.value = props.initialAddress || "Ninguna ubicación seleccionada";
      tempMunicipalityId.value = null;
      if (props.initialLat && props.initialLng) {
        updateMarker(lat, lng);
      }
    }
  }
);
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="680px"
    @close="handleCancel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <h2 class="text-left text-xl text-blue-500 mb-4 font-serif">
      <i class="fa-solid fa-location-dot"></i> Seleccionar Ubicación
    </h2>

    <button
      type="button"
      class="w-full mb-4 rounded-lg p-3 flex items-center justify-center gap-2 bg-teal-500 text-white font-semibold transition-opacity duration-200 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed"
      :disabled="isLocating"
      @click="useCurrentLocation"
    >
      <i :class="isLocating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-location-crosshairs'"></i>
      <span>{{ isLocating ? "Obteniendo..." : "Usar mi ubicación actual" }}</span>
    </button>

    <div class="h-80 w-full rounded-lg overflow-hidden border border-neutral-200 mb-4">
      <l-map
        v-model:zoom="zoom"
        :center="center"
        :use-global-leaflet="false"
        @click="handleMapClick"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
          layer-type="base"
          name="OpenStreetMap"
        />
        <l-marker
          v-if="markerPosition"
          :lat-lng="markerPosition"
          draggable
          @moveend="handleMarkerMove"
        />
      </l-map>
    </div>

    <label class="block text-left text-sm font-semibold text-blue-500 mt-2">Dirección detectada:</label>
    <div class="p-3 bg-neutral-100 rounded-lg text-sm text-neutral-600 text-left mt-2 mb-2">
      {{ mapAddressText }}
    </div>

    <template #footer>
      <div class="flex justify-end gap-4 w-full pt-4">
        <button
          type="button"
          class="bg-white border border-neutral-200 text-blue-500 py-3 px-6 rounded-lg font-semibold cursor-pointer hover:bg-neutral-50 transition-colors"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="bg-teal-500 text-white border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition-opacity duration-200 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed hover:bg-teal-600"
          :disabled="!tempMunicipalityId"
          @click="handleConfirm"
        >
          Confirmar Ubicación
        </button>
      </div>
    </template>
  </BaseModal>
</template>
