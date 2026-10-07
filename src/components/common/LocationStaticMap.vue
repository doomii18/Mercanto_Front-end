<script setup lang="ts">
import { computed } from "vue";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/api/modules/shared/types";

// Default coordinates: Managua, Nicaragua fallback
const DEFAULT_CENTER: [number, number] = [12.1328, -86.2504];

interface Props {
  coordinates?: GeoPoint | [number, number] | null;
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number;
  heightClass?: string;
  roundedClass?: string;
  markerTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  coordinates: null,
  latitude: null,
  longitude: null,
  zoom: 15,
  heightClass: "h-48 sm:h-56",
  roundedClass: "rounded-xl",
  markerTitle: "Ubicación del negocio",
});

const resolvedCoords = computed<[number, number] | null>(() => {
  if (props.coordinates) {
    if (Array.isArray(props.coordinates)) {
      return [props.coordinates[0], props.coordinates[1]];
    }
    if (
      typeof props.coordinates === "object" &&
      props.coordinates.latitude != null &&
      props.coordinates.longitude != null
    ) {
      return [props.coordinates.latitude, props.coordinates.longitude];
    }
  }

  if (props.latitude != null && props.longitude != null) {
    return [props.latitude, props.longitude];
  }

  return null;
});

const center = computed<[number, number]>(() => {
  return resolvedCoords.value ?? DEFAULT_CENTER;
});

const hasValidCoordinates = computed(() => resolvedCoords.value !== null);

const formattedCoordinates = computed(() => {
  if (!resolvedCoords.value) return "Sin coordenadas registradas";
  const [lat, lng] = resolvedCoords.value;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
});
</script>

<template>
  <div
    class="relative w-full overflow-hidden border border-neutral-200 shadow-sm bg-neutral-100 group select-none"
    :class="[heightClass, roundedClass]"
  >
    <!-- Map Display -->
    <l-map
      v-if="hasValidCoordinates"
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      :options="{
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
        keyboard: false,
      }"
      class="h-full w-full z-0"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        layer-type="base"
        name="OpenStreetMap"
      />
      <l-marker
        :lat-lng="center"
        :draggable="false"
        :title="markerTitle"
      />
    </l-map>

    <!-- Empty State Fallback -->
    <div
      v-else
      class="h-full w-full flex flex-col items-center justify-center p-4 text-center text-neutral-400 gap-2"
    >
      <i class="fa-solid fa-map-location-dot text-2xl text-neutral-300"></i>
      <span class="text-xs font-medium">Ubicación geográfica no disponible</span>
    </div>

    <!-- Human-friendly subtle overlay badge -->
    <div
      v-if="hasValidCoordinates"
      class="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs border border-neutral-200/80 px-2.5 py-1 rounded-md text-[11px] font-medium text-neutral-600 shadow-xs flex items-center gap-1.5 pointer-events-none"
    >
      <i class="fa-solid fa-location-dot text-teal-600"></i>
      <span>{{ formattedCoordinates }}</span>
    </div>
  </div>
</template>
