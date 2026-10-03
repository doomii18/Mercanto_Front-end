import { authBus } from "./authEvents";
import { blobCache } from "@/composables/blob";
import { useOrganizationStore } from "@/stores/organization";
import { useUserContextStore } from "@/stores/auth";
import { useFavoritesStore } from "@/stores/commerce";
import { useWalletStore } from "@/stores/wallet";

export function registerSessionListeners(): void {
  authBus.on(async (event) => {
    if (event.type === "session_expired" || event.type === "logout") {
      useUserContextStore().reset();
      useFavoritesStore().reset();
      useWalletStore().reset();
      blobCache.clearMemory();
      await useOrganizationStore().resetAllCaches().catch(console.warn);
    }
  });
}
