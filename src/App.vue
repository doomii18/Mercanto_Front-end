<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useAuthStore } from "./modules/auth/authStore";
import { usePreferencesGuard } from "./modules/auth/usePreferencesGuard";
import UserPreferencesModal from "./components/profile/UserPreferencesModal.vue";
import GlobalAlerts from "./components/common/GlobalAlerts.vue";

const authStore = useAuthStore();
const { showPrompt, currentPreferences, checkPreferences, savePreferences } =
  usePreferencesGuard();

onMounted(async () => {
  await authStore.initialize();
  if (authStore.isAuthenticated) {
    await checkPreferences();
  }

});

watch(
  () => authStore.account,
  (account) => {
    if (account) {
      checkPreferences();
    } else {
      showPrompt.value = false;
    }
  }
);
</script>

<template>
  <router-view />

  <UserPreferencesModal
    v-model="showPrompt"
    :initial-preferences="currentPreferences"
    :is-mandatory="true"
    :save-handler="savePreferences"
  />

  <GlobalAlerts />
</template>
