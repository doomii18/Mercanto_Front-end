import { ref } from "vue";
import { useAuthStore } from "./authStore";
import { userProfileApi } from "../../api";
import type { UserInterest } from "../../api/services/user_profile/types";

export function usePreferencesGuard() {
  const authStore = useAuthStore();
  const showPrompt = ref(false);
  const isChecking = ref(false);
  const currentPreferences = ref<string[]>([]);

  const checkPreferences = async () => {
    if (!authStore.account || isChecking.value) return;

    isChecking.value = true;
    try {
      // Call dedicated interests endpoint instead of getMyProfile
      const interests: UserInterest[] = await userProfileApi.getMyInterests();

      currentPreferences.value = (interests || []).map((item) => item.id);
      showPrompt.value = currentPreferences.value.length === 0;
    } catch (err) {
      console.warn("Could not verify user preferences on load:", err);
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
