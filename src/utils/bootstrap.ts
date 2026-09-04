import { useAuthStore } from "@/modules/auth";
import { useUserContextStore } from "@/stores/userContextStore";
import { useGeoStore } from "@/stores/geo";

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapApp(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const authStore = useAuthStore();
    const contextStore = useUserContextStore();
    const geoStore = useGeoStore();

    try {
      // Authenticate & restore session
      const account = await authStore.initialize();

      // Hydrate user-dependent context if authenticated
      if (account) {
        await contextStore.initialize().catch((err) => {
          console.error("[Bootstrap] User context initialization failed:", err);
        });
      } else {
        contextStore.reset();
      }

      // Background non-blocking pre-fetch for global geography cache
      if (!geoStore.isInitialized) {
        geoStore.initialize().catch((err) => {
          console.warn("[Bootstrap] Non-critical geo prefetch failed:", err);
        });
      }
    } catch (error) {
      console.error("[Bootstrap] Critical startup failure:", error);
      contextStore.reset();
    }
  })();

  return bootstrapPromise;
}
