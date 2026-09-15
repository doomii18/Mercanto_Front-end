import { useUserContextStore } from "@/stores/userContextStore";
import { useGeoStore } from "@/stores/geo";
import { useAuthStore } from "@/stores/authStore";

let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapApp(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }


  bootstrapPromise = (async () => {
    const authStore = useAuthStore();
    const contextStore = useUserContextStore();
    const geoStore = useGeoStore();

    try {
      const account = await authStore.initialize();

      if (account) {
        await contextStore.initialize().catch((err) => {
          console.error("[Bootstrap] User context initialization failed:", err);
        });
      } else {
        contextStore.reset();
      }

      if (!geoStore.isInitialized) {
        geoStore.initialize().catch((err) => {
          console.warn("[Bootstrap] Non-critical geo prefetch failed:", err);
        });
      }
    } catch (error) {
      console.error("[Bootstrap] Startup recovery:", error);
      contextStore.reset();
    }
  })();

  return bootstrapPromise;
}
