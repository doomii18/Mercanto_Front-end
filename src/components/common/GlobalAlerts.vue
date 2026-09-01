<script setup lang="ts">
import BaseModal from "@/components/common/BaseModal.vue";
import { useAlertStore } from "@/stores/alertStore";

const alertStore = useAlertStore();

const handleClose = () => {
  alertStore.dismiss();
};
</script>

<template>
  <BaseModal
    :model-value="alertStore.isOpen"
    max-width="420px"
    :show-close-button="true"
    :close-on-backdrop="true"
    :close-on-esc="true"
    @update:model-value="handleClose"
  >
    <div v-if="alertStore.currentAlert" class="alert-body">
      <div :class="['alert-icon-wrapper', `${alertStore.currentAlert.iconVariant}-bg`]">
        <i :class="alertStore.currentAlert.icon"></i>
      </div>

      <h3 class="alert-title">{{ alertStore.currentAlert.title }}</h3>
      <p class="alert-message">{{ alertStore.currentAlert.message }}</p>

      <div class="alert-actions">
        <button
          type="button"
          class="btn-dismiss"
          @click="handleClose"
        >
          {{ alertStore.currentAlert.confirmText }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.alert-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.alert-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  margin-bottom: 1.25rem;
}

.alert-icon-wrapper.danger-bg {
  background-color: #fee2e2;
  color: #dc2626;
}

.alert-icon-wrapper.orange-bg {
  background-color: #fff0e0;
  color: var(--primary-orange, #ff6a00);
}

.alert-icon-wrapper.teal-bg {
  background-color: #e0f5f4;
  color: var(--light-teal, #189c94);
}

.alert-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  margin: 0 0 0.5rem 0;
}

.alert-message {
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
  word-break: break-word;
}

.alert-actions {
  width: 100%;
}

.btn-dismiss {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-blue, #083c5a);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-dismiss:hover {
  opacity: 0.9;
}
</style>
