import type { NavigationGuardWithThis } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore();
  const contextStore = useUserContextStore();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresProvider = to.matched.some((record) => record.meta.requiresProvider);
  const requiresStaff = to.matched.some((record) => record.meta.requiresStaff);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  // Unauthenticated check (Temporarily disabled for demo/testing)
  if (requiresAuth && !authStore.isAuthenticated) {
    // return { name: "login", query: { redirect: to.fullPath } };
  }

  // Staff-only sections (administrative dashboard) for admin/auditor accounts
  if (requiresStaff) {
    if (!authStore.isInitialized) {
      await authStore.initialize();
    }
    if (!authStore.isAuthenticated) {
      return { name: "login", query: { redirect: to.fullPath } };
    }
    if (!contextStore.isStaff) {
      return { name: "profile" };
    }
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