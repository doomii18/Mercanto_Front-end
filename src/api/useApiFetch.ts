import { createFetch } from "@vueuse/core";
import { useTokenStore } from "@/stores/tokenStore";
import { useAuthStore } from "@/stores/authStore";
import { ErrorPayloadSchema } from "@/api/modules/shared/schemas";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("FATAL CONFIGURATION ERROR: VITE_API_BASE_URL is missing.");
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

// FIX: Added <string, string> to the Record type
function normalizeHeaders(headersInit: HeadersInit | undefined): Record<string, string> {
  if (!headersInit) return {};
  if (headersInit instanceof Headers) {
    return Object.fromEntries(headersInit.entries());
  }
  if (Array.isArray(headersInit)) {
    return Object.fromEntries(headersInit);
  }
  return { ...headersInit };
}

export const useApiFetch = createFetch({
  baseUrl: API_BASE_URL,
  options: {
    updateDataOnError: true,

    async beforeFetch({ options, url }) {
      const headers = normalizeHeaders(options.headers);
      headers["Content-Type"] = "application/json";

      const tokenStore = useTokenStore();
      const isAuthPath = url.includes("/refresh") || url.includes("/login");

      if (tokenStore.accessToken && !isAuthPath) {
        headers["Authorization"] = `Bearer ${tokenStore.accessToken}`;
      }

      options.headers = headers;
      return { options };
    },

    async onFetchError(ctx) {
      const { response, context, execute } = ctx;
      const tokenStore = useTokenStore();
      const isAuthPath =
        context.url.includes("/refresh") ||
        context.url.includes("/login") ||
        context.url.includes("/logout");

      if (response?.status === 401 && tokenStore.hasRefreshToken && !isAuthPath) {
        const authStore = useAuthStore();

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newAccessToken = await authStore.refreshAccessToken();
            flushQueue(newAccessToken);
          } catch {
            refreshQueue = [];
            authStore.handleSessionExpired();
            return ctx;
          } finally {
            isRefreshing = false;
          }
        }

        return new Promise((resolve) => {
          refreshQueue.push(async (newToken: string) => {
            const headers = normalizeHeaders(context.options.headers);
            headers["Authorization"] = `Bearer ${newToken}`;
            headers["Content-Type"] = "application/json";
            context.options.headers = headers;

            const retryResult = await execute();
            resolve(retryResult);
          });
        });
      }

      if (response?.status === 401 && isAuthPath) {
        const authStore = useAuthStore();
        authStore.handleSessionExpired();
      }

      if (ctx.data) {
        const parsed = ErrorPayloadSchema.safeParse(ctx.data);
        if (parsed.success) {
          ctx.error = new Error(parsed.data.message);
        }
      }

      return ctx;
    },
  },
  fetchOptions: {
    mode: "cors",
  },
});