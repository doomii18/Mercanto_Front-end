<script setup lang="ts">
import { useBlobUrl } from "../../modules/blob/useBlob";
import { productApi } from "../../api";

interface Props {
  blobId?: string | null;
  alt?: string;
  fallbackIcon?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

const props = withDefaults(defineProps<Props>(), {
  blobId: null,
  alt: "Imagen del producto",
  fallbackIcon: "fa-solid fa-box",
  objectFit: "contain",
});

const { url, isLoading, error } = useBlobUrl(
  () => props.blobId,
  (id) => productApi.getProductImageBlob(id)
);

defineExpose({
  url,
  isLoading,
  error,
});
</script>

<template>
  <div class="product-image-wrapper">
    <div v-if="isLoading" class="product-image-skeleton"></div>
    <img
      v-else-if="url"
      :src="url"
      :alt="alt"
      :style="{ objectFit }"
      class="product-img"
    />
    <div v-else class="product-image-fallback">
      <i :class="fallbackIcon"></i>
    </div>
  </div>
</template>

<style scoped>
.product-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
}

.product-img {
  width: 100%;
  height: 100%;
  display: block;
}

.product-image-skeleton {
  width: 100%;
  height: 100%;
  background-color: #edf2f7;
  border-radius: 4px;
  animation: pulse 1.5s infinite ease-in-out;
}

.product-image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 1.2rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
