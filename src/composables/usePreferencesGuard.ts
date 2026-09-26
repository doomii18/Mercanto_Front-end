import { ref } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { useAuthStore } from "../stores/authStore";
import type { UserInterest } from "@/api/modules/user_profile/types";
import { useUserProfileApi } from "@/api/modules/user_profile/useUserProfileApi";

export function usePreferencesGuard(delayMs = 1200) {
  const authStore = useAuthStore();
  const showPrompt = ref(false);
  const isChecking = ref(false);
  const currentPreferences = ref<string[]>([]);
  const userProfileApi = useUserProfileApi();

  const { start: triggerDelayedPrompt, stop: cancelDelayedPrompt } = useTimeoutFn(
    () => {
      // Only show if user is still authenticated and needs preferences
      if (authStore.isAuthenticated && currentPreferences.value.length === 0) {
        showPrompt.value = true;
      }
    },
    delayMs,
    { immediate: false }
  );

  const checkPreferences = async () => {
    if (!authStore.account || isChecking.value) return;

    isChecking.value = true;
    try {
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
