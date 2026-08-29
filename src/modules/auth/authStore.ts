import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { identityApi, tokenProvider } from "../../api";
import type { AccountResponse, LoginRequest } from "../../api/services/identity/types";

export const useAuthStore = defineStore("auth", () => {
  const account = ref<AccountResponse | null>(null);
  const isInitialized = ref(false);
  const isLoading = ref(false);

  let initPromise: Promise<AccountResponse | null> | null = null;
  let refreshPromise: Promise<string> | null = null;

  const isAuthenticated = computed(() => account.value !== null);
  const accountRole = computed(() => account.value?.role ?? null);

  async function refreshAccessToken(): Promise<string> {

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const refreshToken = tokenProvider.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const tokens = await identityApi.refresh({ refresh_token: refreshToken });

        if (tokens?.access_token) {
          tokenProvider.setAccessToken(tokens.access_token);
        }
        if (tokens?.refresh_token) {
          tokenProvider.setRefreshToken(tokens.refresh_token);
        }

        return tokens.access_token;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async function login(credentials: LoginRequest): Promise<AccountResponse> {
    isLoading.value = true;
    try {
      const authResponse = await identityApi.login(credentials);
      if (authResponse?.access_token) tokenProvider.setAccessToken(authResponse.access_token);
      if (authResponse?.refresh_token) tokenProvider.setRefreshToken(authResponse.refresh_token);

      const profile = await identityApi.getMyAccount();
      account.value = profile;
      return profile;
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  async function initialize(): Promise<AccountResponse | null> {
    if (isInitialized.value) return account.value;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const refreshToken = tokenProvider.getRefreshToken();
      if (!refreshToken) {
        handleSessionExpired();
        return null;
      }

      try {
        // Obtain a fresh access token before fetching profile
        await refreshAccessToken();
        account.value = await identityApi.getMyAccount();
      } catch (err) {
        console.error("[Auth] Initialization failed:", err);
        handleSessionExpired();
      } finally {
        isInitialized.value = true;
        initPromise = null;
      }
      return account.value;
    })();

    return initPromise;
  }

  async function logout(): Promise<void> {
    const refreshToken = tokenProvider.getRefreshToken();
    handleSessionExpired();

    if (refreshToken) {
      try {
        await identityApi.logout({ refresh_token: refreshToken });
      } catch (err) {
        console.warn("Logout request failed:", err);
      }
    }
  }

  function handleSessionExpired(): void {
    tokenProvider.clear();
    account.value = null;
    initPromise = null;
    refreshPromise = null;
    isInitialized.value = true;
  }

  return {
    account,
    isInitialized,
    isLoading,
    isAuthenticated,
    accountRole,
    initialize,
    login,
    logout,
    refreshAccessToken,
    handleSessionExpired,
  };
});
