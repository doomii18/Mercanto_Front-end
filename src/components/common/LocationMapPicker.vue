<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { useVModel } from "@vueuse/core";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/api/modules/shared/types";

// Default coordinates: Managua, Nicaragua
const DEFAULT_CENTER: [number, number] = [12.1328, -86.2504];

interface Props {
  modelValue?: GeoPoint | null;
  initialLat?: number | null;
  initialLng?: number | null;
  zoom?: number;
  heightClass?: string;
  disabled?: boolean;
  autoLocateIfEmpty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  initialLat: null,
  initialLng: null,
  zoom: 13,
  heightClass: "h-80",
  disabled: false,
  autoLocateIfEmpty: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: GeoPoint | null): void;
  (e: "change", value: GeoPoint): void;
}>();

const model = useVModel(props, "modelValue", emit, {
  passive: true,
  defaultValue: null,
});

const currentZoom = ref(props.zoom);
const center = ref<[number, number]>(DEFAULT_CENTER);
const isLocating = ref(false);

const markerPosition = computed<[number, number] | null>(() => {
  if (model.value?.latitude != null && model.value?.longitude != null) {
    return [model.value.latitude, model.value.longitude];
  }
  return null;
});

function setCoordinates(lat: number, lng: number, updateCenter = true) {
  if (props.disabled) return;
  const point: GeoPoint = {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
  };
  model.value = point;
  emit("change", point);

  if (updateCenter) {
    center.value = [lat, lng];
  }
}

function handleMapClick(e: any) {
  if (props.disabled) return;
  const { lat, lng } = e.latlng;
  setCoordinates(lat, lng, false);
}

function handleMarkerMove(e: any) {
  if (props.disabled) return;
  const { lat, lng } = e.target.getLatLng();
  setCoordinates(lat, lng, false);
}

function requestBrowserLocation(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(false);
  }

  isLocating.value = true;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        center.value = [latitude, longitude];
        currentZoom.value = 16;
        setCoordinates(latitude, longitude, true);
        isLocating.value = false;
        resolve(true);
      },
      (err) => {
        console.debug("Geolocation prompt dismissed or denied:", err.message);
        isLocating.value = false;
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// Initialize coordinates based on modelValue, initialLat/Lng, or fallback to geolocation
onMounted(async () => {
  if (model.value?.latitude != null && model.value?.longitude != null) {
    center.value = [model.value.latitude, model.value.longitude];
    currentZoom.value = 15;
    return;
  }

  if (props.initialLat != null && props.initialLng != null) {
    setCoordinates(props.initialLat, props.initialLng, true);
    currentZoom.value = 15;
    return;
  }

  if (props.autoLocateIfEmpty) {
    await requestBrowserLocation();
  }
});

// Watch modelValue changes externally
watch(
  () => model.value,
  (val) => {
    if (val?.latitude != null && val?.longitude != null) {
      center.value = [val.latitude, val.longitude];
    }
  },
  { deep: true }
);

defineExpose({
  requestBrowserLocation,
  center,
  currentZoom,
  markerPosition,
});
</script>

<template>
  <div class="relative w-full rounded-lg overflow-hidden border border-neutral-200" :class="heightClass">
    <!-- Map Canvas -->
    <l-map
      v-model:zoom="currentZoom"
      :center="center"
      :use-global-leaflet="false"
      class="h-full w-full z-0"
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
        :draggable="!disabled"
        @moveend="handleMarkerMove"
      />
    </l-map>

    <!-- Floating Re-center / Locate Control -->
    <button
      v-if="!disabled"
      type="button"
      class="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm border border-neutral-200 shadow-md text-neutral-700 hover:text-teal-600 hover:bg-neutral-50 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="isLocating"
      title="Obtener mi ubicación actual"
      @click.stop="requestBrowserLocation"
    >
      <i :class="isLocating ? 'fa-solid fa-spinner fa-spin text-teal-600' : 'fa-solid fa-location-crosshairs text-teal-600'"></i>
      <span>{{ isLocating ? "Localizando..." : "Mi ubicación" }}</span>
    </button>
  </div>
</template>
