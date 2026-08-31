<script setup lang="ts">
import { useBlobUrl } from "../../modules/blob/useBlob";
import { userProfileApi } from "../../api";

const props = defineProps<{
  blobId?: string | null;
  alt?: string;
}>();

const { url, isLoading } = useBlobUrl(
  () => props.blobId,
  (id) => userProfileApi.getProfilePictureBlob(id)
);
</script>

<template>
  <div class="relative flex aspect-square h-full w-full items-center justify-center overflow-hidden">
    <div
      v-if="isLoading"
      class="h-full w-full animate-pulse rounded-full bg-slate-200"
      aria-hidden="true"
    ></div>

    <img
      v-else-if="url"
      :src="url"
      :alt="alt || 'Foto de perfil'"
      class="h-full w-full rounded-full object-cover"
    />

    <div
      v-else
      class="flex h-full w-full items-center justify-center text-xl text-slate-400"
      aria-hidden="true"
    >
      <i class="fa-solid fa-user"></i>
    </div>
  </div>
</template>
