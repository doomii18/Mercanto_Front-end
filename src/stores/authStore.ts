import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useTokenStore } from "./tokenStore";
import { useIdentityApi } from "@/composables/api/useIdentityApi";
import type {
  AccountResponse,
  LoginRequest,
} from "@/api/services/identity/types";
import { useUserContextStore } from "./userContextStore";
import { authBus } from "@/events/authEvents";

export const useAuthStore = defineStore("auth", () => {
  const tokenStore = useTokenStore();
  const identityApi = useIdentityApi();

  const account = ref<AccountResponse | null>(null);
  const isInitialized = ref(false);
  const isLoading = ref(false);

  let initPromise: Promise<AccountResponse | null> | null = null;
  let refreshPromise: Promise<string> | null = null;

  const isAuthenticated = computed(() => account.value !== null);
  const accountRole = computed(() => account.value?.role ?? null);

  async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        if (!tokenStore.refreshToken) {
          throw new Error("No refresh token available");
        }

        const tokens = await identityApi.refresh({
          refresh_token: tokenStore.refreshToken,
        });

        tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
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
      const tokens = await identityApi.login(credentials);
      tokenStore.setTokens(tokens.access_token, tokens.refresh_token);

      const profile = await identityApi.getMyAccount();
      account.value = profile;

      const userContext = useUserContextStore();
      await userContext.initialize(true);

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
      if (!tokenStore.refreshToken) {
        handleSessionExpired();
        return null;
      }

      try {
        await refreshAccessToken();
        const profile = await identityApi.getMyAccount();
        account.value = profile;
      } catch (err) {
        console.warn("[Auth] Initialization failed or token expired:", err);
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
    const currentRefreshToken = tokenStore.refreshToken;
    handleSessionExpired();

    if (currentRefreshToken) {
      try {
        await identityApi.logout({
          refresh_token: currentRefreshToken,
        });
      } catch (err) {
        console.warn("Logout request failed:", err);
      }
    }
  }

  function handleSessionExpired(): void {
    tokenStore.clearTokens();
    account.value = null;
    initPromise = null;
    refreshPromise = null;
    isInitialized.value = true;

    authBus.emit({ type: "session_expired" });
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
