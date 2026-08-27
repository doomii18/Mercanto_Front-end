
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
  <div class="category-image-container">
    <div v-if="isLoading" class="category-skeleton"></div>
    <img
      v-else-if="url"
      :src="url"
      :alt="alt || 'Categoría'"
      class="category-img"
    />
    <div v-else class="category-fallback">
      <i class="fa-solid fa-image"></i>
    </div>
  </div>
</template>

<style scoped>
.category-image-container {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.category-img {
  max-width: 75%;
  max-height: 120px;
  object-fit: contain;
}

.category-skeleton {
  width: 80px;
  height: 80px;
  background-color: #edf2f7;
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out;
}

.category-fallback {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #cbd5e1;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
