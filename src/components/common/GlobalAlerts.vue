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
    class="max-w-md"
    :show-close-button="true"
    :close-on-backdrop="true"
    :close-on-esc="true"
    :is-alert="true"
    @update:model-value="handleClose"
  >
    <Transition name="alert-fade" mode="out-in">
      <div
        v-if="alertStore.currentAlert"
        :key="alertStore.currentAlert.id"
        class="alert-body"
      >
        <div :class="['alert-icon-wrapper', `${alertStore.currentAlert.iconVariant}-bg`]">
          <i :class="alertStore.currentAlert.icon"></i>
        </div>

        <!-- Optional badge if multiple alerts are queued -->
        <span
          v-if="alertStore.queue.length > 1"
          class="alert-queue-badge"
        >
          Mensaje más reciente (1 de {{ alertStore.queue.length }})
        </span>

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
    </Transition>
  </BaseModal>
</template>

<style scoped>
.alert-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.alert-fade-enter-from {
  opacity: 0;
  transform: scale(0.96);
}
.alert-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
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

.alert-queue-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #b91c1c;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
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
