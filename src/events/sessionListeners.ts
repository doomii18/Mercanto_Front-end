import { authBus } from "./authEvents";
import { blobCache } from "@/composables/blob";
import { useOrganizationStore } from "@/stores/organization";
import { useUserContextStore, useAuthStore, useTokenStore } from "@/stores/auth";
import { useFavoritesStore } from "@/stores/commerce";
import { useWalletStore } from "@/stores/wallet";
import { useNotificationStore } from "@/stores/notifications";
import router from "@/router";

export function registerSessionListeners(): void {
  authBus.on(async (event) => {
    if (event.type === "session_expired" || event.type === "logout") {
      useTokenStore().clearTokens();
      const authStore = useAuthStore();
      authStore.account = null;
      useNotificationStore().disconnect();
      useUserContextStore().reset();
      useFavoritesStore().reset();
      useWalletStore().reset();
      blobCache.clearMemory();
      await useOrganizationStore().resetAllCaches().catch(console.warn);

      const currentRoute = router.currentRoute.value;
      const requiresAuth = currentRoute.matched.some(
        (record) =>
          record.meta.requiresAuth ||
          record.meta.requiresStaff ||
          record.meta.requiresProvider ||
          record.meta.requiresBuyer
      );
      if (requiresAuth) {
        router.push({ name: "login", query: { redirect: currentRoute.fullPath } });
      }
    } else if (event.type === "login") {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        await authStore.initialize().catch((err: unknown) => {
          console.warn("[SessionListeners] Auth initialize failed on cross-tab login:", err);
        });
      }
      useNotificationStore().connect().catch((err: unknown) => {
        console.warn("[SessionListeners] Notification connect failed on login:", err);
      });

      const currentRoute = router.currentRoute.value;
      if (currentRoute.matched.some((record) => record.meta.guestOnly)) {
        router.push({ name: "dashboard" });
      }
    }
  });
}
