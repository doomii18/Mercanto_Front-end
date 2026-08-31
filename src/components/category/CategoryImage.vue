<script setup lang="ts">
import { useBlobUrl } from "../../modules/blob/useBlob";
import { categoryApi } from "../../api";

const props = defineProps<{
  blobId?: string | null;
  alt?: string;
}>();

const { url, isLoading } = useBlobUrl(
  () => props.blobId,
  (id) => categoryApi.getCategoryImageBlob(id)
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
      :alt="alt || 'Categoría'"
      class="h-full w-full object-contain"
    />

    <div
      v-else
      class="flex h-full w-full items-center justify-center text-2xl text-slate-300"
      aria-hidden="true"
    >
      <i class="fa-solid fa-image"></i>
    </div>
  </div>
</template>
