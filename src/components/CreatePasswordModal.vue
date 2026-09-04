<script setup lang="ts">
import { ref, watch } from "vue";
import BaseModal from "./common/BaseModal.vue";

interface Props {
  modelValue: boolean;
  email: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "¡Registro guardado!",
  subtitle: "Para completar tu registro, crea una contraseña para tu cuenta.",
  loading: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", payload: { password: string; passwordConfirm: string }): void;
  (e: "cancel"): void;
}>();

const password = ref("");
const passwordConfirm = ref("");
const showPass = ref(false);
const showPassConfirm = ref(false);
const validationError = ref<string | null>(null);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      password.value = "";
      passwordConfirm.value = "";
      showPass.value = false;
      showPassConfirm.value = false;
      validationError.value = null;
    }
  }
);

const handleCancel = () => {
  emit("cancel");
  emit("update:modelValue", false);
};

const handleSubmit = () => {
  validationError.value = null;

  if (!password.value || !passwordConfirm.value) {
    validationError.value = "Todos los campos de contraseña son requeridos.";
    return;
  }

  if (password.value !== passwordConfirm.value) {
    validationError.value = "Las contraseñas no coinciden.";
    return;
  }

  if (password.value.length < 8) {
    validationError.value = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }

  emit("submit", {
    password: password.value,
    passwordConfirm: passwordConfirm.value,
  });
};
</script>

<template>
  <BaseModal
    :modelValue="modelValue"
    max-width="480px"
    :show-close-button="false"
    @close="handleCancel"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <div class="password-modal-content">
      <div class="success-icon">
        <i class="fa-solid fa-check"></i>
      </div>

      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>

      <div v-if="validationError" class="error-banner">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>{{ validationError }}</span>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Correo electrónico</label>
          <div class="input-icon-wrapper">
            <i class="fa-regular fa-envelope left-icon"></i>
            <input type="email" :value="email" disabled />
          </div>
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-lock left-icon"></i>
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              placeholder="Ingresa tu contraseña"
              :disabled="loading"
              required
            />
            <i
              :class="showPass ? 'fa-regular fa-eye-slash right-icon' : 'fa-regular fa-eye right-icon'"
              @click="showPass = !showPass"
            ></i>
          </div>
        </div>

        <div class="form-group">
          <label>Confirmar contraseña</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-lock left-icon"></i>
            <input
              v-model="passwordConfirm"
              :type="showPassConfirm ? 'text' : 'password'"
              placeholder="Confirma tu contraseña"
              :disabled="loading"
              required
            />
            <i
              :class="showPassConfirm ? 'fa-regular fa-eye-slash right-icon' : 'fa-regular fa-eye right-icon'"
              @click="showPassConfirm = !showPassConfirm"
            ></i>
          </div>
        </div>

        <div class="card-actions">
          <button
            type="button"
            class="btn-cancel"
            :disabled="loading"
            @click="handleCancel"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-save"
            :disabled="loading"
          >
            <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
            <span>{{ loading ? "Guardando..." : "Guardar y continuar" }}</span>
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
<style scoped>
.password-modal-content {
  padding: 0.5rem;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #c9ebe8;
  color: var(--light-teal, #189c94);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.2rem;
  margin: 0 auto 1.25rem auto;
}

/* Explicitly define text colors with fallbacks to prevent DaisyUI base styles from overriding them */
.password-modal-content h2 {
  text-align: center;
  color: var(--primary-blue, #083c5a);
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
}

.password-modal-content p {
  text-align: center;
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 0.92rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 600;
  font-size: 0.88rem;
}

.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon-wrapper i.left-icon {
  position: absolute;
  left: 14px;
  color: var(--primary-blue, #083c5a);
  pointer-events: none;
}

.input-icon-wrapper i.right-icon {
  position: absolute;
  right: 14px;
  color: var(--light-teal, #189c94);
  cursor: pointer;
}

.input-icon-wrapper input {
  width: 100%;
  padding: 0.75rem 2.5rem;
  border: 1px solid var(--border-gray, #e2e8f0);
  border-radius: 8px;
  font-family: "Lato", sans-serif;
  font-size: 0.95rem;
  outline: none;
  background: #ffffff;
  color: var(--text-dark, #1e293b); /* Added explicit text color for inputs */
  transition: border-color 0.2s;
}

.input-icon-wrapper input:focus {
  border-color: var(--light-teal, #189c94);
}

.input-icon-wrapper input:disabled {
  background-color: var(--bg-gray, #f1f5f9);
  color: #64748b;
  cursor: not-allowed;
  border: 1px solid var(--border-gray, #e2e8f0);
}

.card-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.75rem;
}

.btn-cancel {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-gray, #e2e8f0);
  background-color: #ffffff;
  color: var(--primary-blue, #083c5a); /* Added explicit fallback */
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background-color: var(--bg-gray, #f1f5f9);
}

.btn-save {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background-color: var(--primary-orange, #ff6a00);
  color: #ffffff; /* Added explicit fallback */
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-cancel:disabled,
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 500px) {
  .card-actions {
    flex-direction: column;
  }
}
</style>
