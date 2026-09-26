<script setup lang="ts">
import { useBlobUrl } from "../../composables/blob/useBlob";
import { useProductApi } from "@/api/modules/product/useProductApi";

const props = withDefaults(
  defineProps<{
    blobId?: string | null;
    alt?: string;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    fallbackIcon?: string;
    imgClass?: string;
  }>(),
  {
    blobId: null,
    alt: "Imagen del producto",
    objectFit: "contain",
    fallbackIcon: "fa-solid fa-box",
    imgClass: "",
  }
);

const productApi = useProductApi();

const { url, isLoading } = useBlobUrl(
  () => props.blobId,
  (id) => productApi.getProductImageBlob(id)
);
</script>

<template>
  <div class="relative flex aspect-square h-full w-full items-center justify-center overflow-hidden">
    <div
      v-if="isLoading"
      class="h-full w-full animate-pulse rounded-md bg-slate-200"
      aria-hidden="true"
    ></div>

    <img
      v-else-if="url"
      :src="url"
      :alt="alt || 'Imagen del producto'"
      :class="[
        'h-full w-full',
        objectFit === 'cover' ? 'object-cover' : 'object-contain',
        imgClass
      ]"
    />

    <div
      v-else
      class="flex h-full w-full items-center justify-center text-2xl text-slate-300"
      aria-hidden="true"
    >
      <i :class="fallbackIcon || 'fa-solid fa-box'"></i>
    </div>
  </div>
</template>
