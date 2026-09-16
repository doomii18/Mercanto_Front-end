<script setup lang="ts">
import { computed } from "vue";
import { useBlobUrl } from "../../composables/blob/useBlob";
import { generateAvatarDataUrl } from "../../utils/avatar";
import { useUserProfileApi } from "@/composables/api/useUserProfileApi";

const props = defineProps<{
  blobId?: string | null;
  alt?: string;
}>();

const userProfileApi = useUserProfileApi();

const { url, isLoading } = useBlobUrl(
  () => props.blobId,
  (id) => userProfileApi.getProfilePictureBlob(id)
);

const fallbackUrl = computed(() => {
  return generateAvatarDataUrl(props.alt);
});
</script>

<template>
  <div class="relative flex aspect-square h-full w-full items-center justify-center overflow-hidden rounded-full">
    <div
      v-if="isLoading"
      class="h-full w-full animate-pulse rounded-full bg-slate-200"
      aria-hidden="true"
    ></div>

    <img
      v-else
      :src="url || fallbackUrl"
      :alt="alt || 'Foto de perfil'"
      class="h-full w-full rounded-full object-cover"
    />
  </div>
</template>
