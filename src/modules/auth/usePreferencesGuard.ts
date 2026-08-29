import { ref } from "vue";
import { authManager } from "./index";
import { userProfileApi } from "../../api";

export function usePreferencesGuard() {
  const showPrompt = ref(false);
  const isChecking = ref(false);
  const currentPreferences = ref<string[]>([]);

  const checkPreferences = async () => {
    const account = authManager.getAccount();
    if (!account) return;

    isChecking.value = true;
    try {
      // If user profile API provides preference list or check against profile payload
      const profile = await userProfileApi.getMyProfile();
      const interests = (profile as any).interests || [];
      currentPreferences.value = interests;

      if (interests.length === 0) {
        showPrompt.value = true;
      }
    } catch (err) {
      console.warn("Could not verify user preferences on load:", err);
    } finally {
      isChecking.value = false;
    }
  };

  return {
    showPrompt,
    isChecking,
    currentPreferences,
    checkPreferences,
  };
}
