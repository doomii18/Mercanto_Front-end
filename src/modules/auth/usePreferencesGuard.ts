import { ref } from "vue";
import { useAuthStore } from "./authStore";
import { userProfileApi } from "../../api";

export function usePreferencesGuard() {
  const authStore = useAuthStore();
  const showPrompt = ref(false);
  const isChecking = ref(false);
  const currentPreferences = ref<string[]>([]);

  const checkPreferences = async () => {
    if (!authStore.account) return;

    isChecking.value = true;
    try {
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
