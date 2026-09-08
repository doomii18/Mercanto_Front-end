import { useUserContextStore } from "@/stores/userContextStore";
import { useGeoStore } from "@/stores/geo";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";

let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapApp(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }


  bootstrapPromise = (async () => {
    const authStore = useAuthStore();
    await authStore.initialize();
    return
    const contextStore = useUserContextStore();
    const geoStore = useGeoStore();
    const notificationStore = useNotificationStore();

    try {
      const account = await authStore.initialize();

      if (account) {
        await contextStore.initialize().catch((err) => {
          console.error("[Bootstrap] User context initialization failed:", err);
        });

        notificationStore.connect().catch((err) => {
          console.warn("[Bootstrap] Non-critical notification connection failed:", err);
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
