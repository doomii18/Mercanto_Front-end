import { authBus } from "./authEvents";
import { blobCache } from "@/composables/blob";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useUserContextStore } from "@/stores/userContextStore";
import { useFavoritesStore } from "@/stores/favoritesStore";

export function registerSessionListeners(): void {
  authBus.on(async (event) => {
    if (event.type === "session_expired" || event.type === "logout") {
      useUserContextStore().reset();
      useFavoritesStore().reset();
      blobCache.clearMemory();
      await useOrganizationStore().resetAllCaches().catch(console.warn);
    }
  });
}
