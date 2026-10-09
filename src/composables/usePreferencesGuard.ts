import { ref, watch } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { useAuthStore, useUserContextStore } from "@/stores/auth";
import type { UserInterest } from "@/api";
import { useUserProfileApi } from "@/api/modules/identity/user_profile/useUserProfileApi";

export function usePreferencesGuard(delayMs = 1200) {
  const authStore = useAuthStore();
  const contextStore = useUserContextStore();
  const showPrompt = ref(false);
  const isChecking = ref(false);
  const currentPreferences = ref<string[]>([]);
  const userProfileApi = useUserProfileApi();

  const isApplicableBuyer = () => {
    return (
      authStore.isAuthenticated &&
      contextStore.isInitialized &&
      !contextStore.isLoading &&
      contextStore.isBuyer &&
      !contextStore.isProvider &&
      !contextStore.isStaff
    );
  };

  const { start: triggerDelayedPrompt, stop: cancelDelayedPrompt } = useTimeoutFn(
    () => {
      // Only show if user is authenticated, has buyer context, and needs preferences
      if (isApplicableBuyer() && currentPreferences.value.length === 0) {
        showPrompt.value = true;
      }
    },
    delayMs,
    { immediate: false }
  );

  // Automatically dismiss or cancel prompt if the user changes context or logs out
  watch(
    [
      () => authStore.isAuthenticated,
      () => contextStore.isInitialized,
      () => contextStore.isLoading,
      () => contextStore.isBuyer,
      () => contextStore.isProvider,
      () => contextStore.isStaff,
    ],
    () => {
      if (!isApplicableBuyer()) {
        cancelDelayedPrompt();
        showPrompt.value = false;
      }
    }
  );

  const checkPreferences = async () => {
    if (!authStore.account || !authStore.isAuthenticated || isChecking.value) return;

    isChecking.value = true;
    try {
      if (!contextStore.isInitialized || contextStore.isLoading) {
        await contextStore.initialize();
      }

      // Interests prompt should ONLY be shown to users in the buyer context (never providers, admins, or auditors)
      if (!isApplicableBuyer()) {
        cancelDelayedPrompt();
        showPrompt.value = false;
        return;
      }

      // Call dedicated interests endpoint instead of getMyProfile
      const interests: UserInterest[] = await userProfileApi.getMyInterests();

      currentPreferences.value = (interests || []).map((item) => item.id);
      if (currentPreferences.value.length === 0) {
        triggerDelayedPrompt();
      } else {
        cancelDelayedPrompt();
        showPrompt.value = false;
      }
    } catch (err) {
      console.warn("Could not verify user preferences on load:", err);
      cancelDelayedPrompt();
      showPrompt.value = false;
    } finally {
      isChecking.value = false;
    }
  };

  const savePreferences = async (categoryIds: string[]) => {
    await userProfileApi.setMyInterests({ category_ids: categoryIds });
    currentPreferences.value = categoryIds;
    showPrompt.value = false;
  };

  return {
    showPrompt,
    isChecking,
    currentPreferences,
    checkPreferences,
    savePreferences,
  };
}
