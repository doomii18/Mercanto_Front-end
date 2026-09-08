import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useTokenStore } from "./tokenStore";
import { useApiFetch } from "@/composables/api/useApiFetch";
import {
  AuthResponseSchema,
  AccountResponseSchema,
} from "@/api/services/identity/payloads";
import type {
  AccountResponse,
  LoginRequest,
  AuthResponse,
} from "@/api/services/identity/types";
import { useUserContextStore } from "./userContextStore";
import { useOrganizationStore } from "./organizationStore";
import { blobCache } from "@/modules/blob";

export const useAuthStore = defineStore("auth", () => {
  const tokenStore = useTokenStore();
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

        const { data, error } = await useApiFetch("/refresh")
          .post({ refresh_token: tokenStore.refreshToken })
          .json<AuthResponse>();

        if (error.value || !data.value) {
          throw error.value || new Error("Failed to refresh token");
        }

        const tokens = AuthResponseSchema.parse(data.value);
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
      const { data: authData, error: authError } = await useApiFetch("/login")
        .post(credentials)
        .json<AuthResponse>();

      if (authError.value || !authData.value) {
        throw authError.value || new Error("Invalid credentials");
      }

      const tokens = AuthResponseSchema.parse(authData.value);
      tokenStore.setTokens(tokens.access_token, tokens.refresh_token);

      const { data: accountData, error: accountError } = await useApiFetch("/accounts/me")
        .get()
        .json<AccountResponse>();

      if (accountError.value || !accountData.value) {
        throw accountError.value || new Error("Failed to load account profile");
      }

      const profile = AccountResponseSchema.parse(accountData.value);
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
        const { data, error } = await useApiFetch("/accounts/me")
          .get()
          .json<AccountResponse>();

        if (error.value || !data.value) {
          throw error.value || new Error("Account check failed");
        }

        account.value = AccountResponseSchema.parse(data.value);
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
        await useApiFetch("/logout").post({
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

    useUserContextStore().reset();
    useOrganizationStore().resetAllCaches().catch(console.warn);
    blobCache.clearMemory();
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
