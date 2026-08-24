<script setup lang="ts">
import BaseModal from "./BaseModal.vue";

interface Props {
  modelValue: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconVariant?: "teal" | "orange" | "danger";
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  confirmText: "Continuar",
  cancelText: "Cancelar",
  icon: "fa-regular fa-paper-plane",
  iconVariant: "teal",
  loading: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();
</script>

<template>
  <BaseModal
    :modelValue="modelValue"
    max-width="440px"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <div class="confirm-content">
      <div :class="['modal-icon', `${iconVariant}-bg`]">
        <i :class="icon"></i>
      </div>
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
      <slot />
    </div>

    <template #footer>
      <div class="confirm-actions">
        <button
          type="button"
          class="btn-cancel"
          :disabled="loading"
          @click="emit('cancel'); emit('update:modelValue', false)"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="btn-confirm"
          :disabled="loading"
          @click="emit('confirm')"
        >
          <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
          <span>{{ confirmText }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-content {
  text-align: center;
}

.modal-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  margin: 0 auto 1.25rem auto;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
}

.modal-icon.teal-bg {
  background: #e6f7f5;
  color: var(--light-teal);
}

.modal-icon.orange-bg {
  background: #fff0e6;
  color: var(--primary-orange);
}

.confirm-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-cancel {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-gray);
  background: #fff;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirm {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: var(--light-teal);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
</style>
