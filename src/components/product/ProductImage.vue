<script lang="ts">
// Shared cache to avoid duplicated calls across ProductImage instances
const productIdToBlobCache = new Map<string, Promise<string | null>>();
</script>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useBlobUrl } from "../../composables/blob/useBlob";
import { useProductImageApi } from "@/api/modules/catalog/product_image/useProductImageApi";

const props = withDefaults(
  defineProps<{
    blobId?: string | null;
    productId?: string | null;
    alt?: string;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    fallbackIcon?: string;
    imgClass?: string;
  }>(),
  {
    blobId: null,
    productId: null,
    alt: "Imagen del producto",
    objectFit: "contain",
    fallbackIcon: "fa-solid fa-box",
    imgClass: "",
  }
);

const productImageApi = useProductImageApi();
const resolvedBlobId = ref<string | null>(props.blobId ?? null);
const isResolvingBlob = ref(false);

watch(
  () => [props.blobId, props.productId],
  async ([newBlobId, newProductId]) => {
    if (newBlobId) {
      resolvedBlobId.value = newBlobId;
      isResolvingBlob.value = false;
      return;
    }

    if (!newProductId) {
      resolvedBlobId.value = null;
      isResolvingBlob.value = false;
      return;
    }

    isResolvingBlob.value = true;
    try {
      if (!productIdToBlobCache.has(newProductId)) {
        productIdToBlobCache.set(
          newProductId,
          productImageApi.getProductImages(newProductId).then(
            (images) => images[0] ?? null,
            () => null
          )
        );
      }
      resolvedBlobId.value = await productIdToBlobCache.get(newProductId)!;
    } catch {
      resolvedBlobId.value = null;
    } finally {
      isResolvingBlob.value = false;
    }
  },
  { immediate: true }
);

const { url, isLoading: isBlobLoading } = useBlobUrl(
  () => resolvedBlobId.value,
  (id) => productImageApi.getProductImageBlob(id)
);

const isLoading = computed(() => isResolvingBlob.value || isBlobLoading.value);
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
