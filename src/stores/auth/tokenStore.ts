import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useStorage } from "@vueuse/core";

export const useTokenStore = defineStore("token", () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = useStorage<string | null>("mercanto_refresh_token", null);

  const hasAccessToken = computed(() => Boolean(accessToken.value));
  const hasRefreshToken = computed(() => Boolean(refreshToken.value));

  function setTokens(access: string | null, refresh: string | null) {
    accessToken.value = access;
    refreshToken.value = refresh;
  }

  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;
  }

  return {
    accessToken,
    refreshToken,
    hasAccessToken,
    hasRefreshToken,
    setTokens,
    clearTokens,
  };
});
