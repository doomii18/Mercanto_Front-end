import type { NavigationGuardWithThis } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore();
  const contextStore = useUserContextStore();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresProvider = to.matched.some((record) => record.meta.requiresProvider);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  // Unauthenticated check
  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Guest-only redirect (logged-in users accessing login/register)
  if (guestOnly && authStore.isAuthenticated) {
    return contextStore.isProvider ? { name: "provider-products" } : { name: "profile" };
  }

  // Provider authorization check (prevents buyers accessing provider panels)
  if (requiresProvider && !contextStore.isProvider) {
    return { name: "profile" };
  }

  return true;
};
