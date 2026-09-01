<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useAuthStore } from "./modules/auth/authStore";
import { usePreferencesGuard } from "./modules/auth/usePreferencesGuard";
import { useAlertStore } from "./stores/alertStore";
import UserPreferencesModal from "./components/profile/UserPreferencesModal.vue";
import GlobalAlerts from "./components/common/GlobalAlerts.vue";

const authStore = useAuthStore();
const alertStore = useAlertStore();
const { showPrompt, currentPreferences, checkPreferences, savePreferences } =
  usePreferencesGuard();

onMounted(async () => {
  await authStore.initialize();
  if (authStore.isAuthenticated) {
    await checkPreferences();
  }

  alertStore.showError(
    "Esto es una prueba para verificar que el store global de alertas funciona correctamente.",
    "Prueba de Alerta Global"
  );
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
