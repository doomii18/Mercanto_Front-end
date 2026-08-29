<script setup lang="ts">
import { onMounted } from "vue";
import { authManager } from "./modules/auth";
import { usePreferencesGuard } from "./modules/auth/usePreferencesGuard";
import UserPreferencesModal from "./components/profile/UserPreferencesModal.vue";

const { showPrompt, currentPreferences, checkPreferences } = usePreferencesGuard();

onMounted(async () => {
  await authManager.initialize();
  if (authManager.isAuthenticated()) {
    await checkPreferences();
  }
});

authManager.subscribe((account) => {
  if (account) {
    checkPreferences();
  } else {
    showPrompt.value = false;
  }
});
</script>

<template>
  <router-view />

  <UserPreferencesModal
    v-model="showPrompt"
    :initial-preferences="currentPreferences"
    :is-mandatory="true"
  />
</template>
