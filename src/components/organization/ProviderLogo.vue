<script setup lang="ts">
import { computed } from "vue";
import { useBlobUrl } from "../../modules/blob/useBlob";
import { organizationApi } from "../../api";

interface Props {
  blobId?: string | null;
  alt?: string;
  fallbackIcon?: string;
  fallbackText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  blobId: null,
  alt: "Logo del proveedor",
  fallbackIcon: "fa-regular fa-user",
  fallbackText: "",
});

const { url, isLoading, error } = useBlobUrl(
  () => props.blobId,
  (id) => organizationApi.getOrganizationLogoBlob(id)
);

const initial = computed(() => {
  return props.fallbackText ? props.fallbackText.charAt(0).toUpperCase() : null;
});

defineExpose({
  url,
  isLoading,
  error,
});
</script>

<template>
  <div class="provider-logo-wrapper">
    <div v-if="isLoading" class="provider-logo-skeleton"></div>
    <img
      v-else-if="url"
      :src="url"
      :alt="alt"
      class="provider-logo-img"
    />
    <span v-else-if="initial" class="provider-logo-initial">
      {{ initial }}
    </span>
    <div v-else class="provider-logo-fallback">
      <i :class="fallbackIcon"></i>
    </div>
  </div>
</template>

<style scoped>
.provider-logo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: transparent;
}

.provider-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}

.provider-logo-skeleton {
  width: 100%;
  height: 100%;
  background-color: #edf2f7;
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out;
}

.provider-logo-initial {
  font-weight: 700;
  color: inherit;
}

.provider-logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: inherit;
  color: inherit;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
