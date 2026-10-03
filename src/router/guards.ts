import type { NavigationGuardWithThis } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUserContextStore } from "@/stores/auth";

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore();
  const contextStore = useUserContextStore();

  // Ensure authentication state is initialized before verifying route rules
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  // If authenticated, ensure user context (buyer vs provider, profile, roles) is loaded
  if (authStore.isAuthenticated && !contextStore.isInitialized) {
    try {
      await contextStore.initialize();
    } catch (error) {
      console.warn("[RouterGuard] Failed to initialize user context:", error);
    }
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresProvider = to.matched.some(
    (record) => record.meta.requiresProvider || record.meta.userGroup === "provider"
  );
  const requiresBuyer = to.matched.some(
    (record) => record.meta.requiresBuyer || record.meta.userGroup === "buyer"
  );
  const requiresStaff = to.matched.some((record) => record.meta.requiresStaff);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  // 1. Guest-only redirect (logged-in users accessing /login, /register, etc.)
  if (guestOnly && authStore.isAuthenticated) {
    if (contextStore.isStaff) {
      return { name: "admin-home" };
    }
    return contextStore.isProvider ? { name: "provider-products" } : { name: "profile" };
  }

  // 2. Unauthenticated check: All dashboard and role-specific routes require authentication
  const needsAuth = requiresAuth || requiresStaff || requiresProvider || requiresBuyer;
  if (needsAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // 3. Staff-only sections (administrative dashboard) for admin/auditor accounts
  if (requiresStaff) {
    if (!contextStore.isStaff) {
      return { name: "profile" };
    }
  }

  // 4. Common user guards: Provider authorization check (prevents buyers from accessing provider panels)
  if (requiresProvider && !contextStore.isProvider) {
    return { name: "profile" };
  }

  // 5. Common user guards: Buyer authorization check (prevents providers from accessing buyer-only sections)
  if (requiresBuyer && !contextStore.isBuyer) {
    return contextStore.isProvider ? { name: "provider-products" } : { name: "profile" };
  }

  // 6. Explicit allowedUserGroups check if configured on route meta
  const restrictedRecord = to.matched.find((record) => record.meta.allowedUserGroups?.length);
  if (restrictedRecord?.meta.allowedUserGroups) {
    const allowed = restrictedRecord.meta.allowedUserGroups;
    if (!allowed.includes(contextStore.userGroup)) {
      return contextStore.isProvider ? { name: "provider-products" } : { name: "profile" };
    }
  }

  return true;
};