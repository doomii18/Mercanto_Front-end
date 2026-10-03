import { useUserContextStore } from "@/stores/auth";
import { useGeoStore } from "@/stores/geo";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notifications";

let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapApp(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const authStore = useAuthStore();
    const contextStore = useUserContextStore();
    const geoStore = useGeoStore();
    const notificationStore = useNotificationStore();

    try {
      const account = await authStore.initialize();

      if (account) {
        await contextStore.initialize().catch((err: unknown) => {
          console.error("[Bootstrap] User context initialization failed:", err);
        });

        notificationStore.connect().catch((err: unknown) => {
          console.warn("[Bootstrap] WebSocket connection failed:", err);
        });
      } else {
        notificationStore.disconnect();
        contextStore.reset();
      }

      if (!geoStore.isInitialized) {
        geoStore.initialize().catch((err: unknown) => {
          console.warn("[Bootstrap] Non-critical geo prefetch failed:", err);
        });
      }
    } catch (error) {
      console.error("[Bootstrap] Startup recovery:", error);
      notificationStore.disconnect();
      contextStore.reset();
    }
  })();

  return bootstrapPromise;
}
