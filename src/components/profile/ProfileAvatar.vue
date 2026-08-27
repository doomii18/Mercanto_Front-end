<script setup lang="ts">
import { useBlobUrl } from "../../modules/blob/useBlob";
import { userProfileApi } from "../../api";

interface Props {
  blobId?: string | null;
  alt?: string;
  fallbackIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  blobId: null,
  alt: "Foto de perfil",
  fallbackIcon: "fa-solid fa-user",
});

const { url, isLoading, error } = useBlobUrl(
  () => props.blobId,
  (id) => userProfileApi.getProfilePictureBlob(id)
);

defineExpose({
  url,
  isLoading,
  error,
});
</script>

<template>
  <div class="avatar-wrapper">
    <div v-if="isLoading" class="avatar-skeleton"></div>
    <img
      v-else-if="url"
      :src="url"
      :alt="alt"
      class="avatar-img"
    />
    <div v-else class="avatar-fallback">
      <i :class="fallbackIcon"></i>
    </div>
  </div>
</template>

<style scoped>
.avatar-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #64748b;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-skeleton {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #cbd5e1;
  animation: pulse 1.5s infinite ease-in-out;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: inherit;
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
