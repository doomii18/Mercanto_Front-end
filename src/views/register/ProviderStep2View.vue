<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useProviderRegisterStore } from "@/stores/providerRegisterStore";
import { useAlertStore } from "@/stores/alertStore";
import {
  nationalIdSchema,
  personNameSchema,
  emailSchema,
  phoneNumberSchema,
} from "@/api/services/identity/domain";

const router = useRouter();
const accountStore = useAccountRegisterStore();
const providerStore = useProviderRegisterStore();
const alertStore = useAlertStore();

const errors = ref<Record<string, string>>({});
const verificationDocName = ref(
  providerStore.verificationDocumentFile?.name || ""
);

const ProviderStep2Schema = z.object({
  nationalId: nationalIdSchema,
  firstName: personNameSchema,
  lastName: personNameSchema,
  email: emailSchema,
  phoneNumber: phoneNumberSchema,
});

const clearFieldError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};

const handleDocumentFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    providerStore.setVerificationDocument(file);
    verificationDocName.value = file.name;
  }
};

const validateStep2 = (): boolean => {
  errors.value = {};

  accountStore.nationalId = accountStore.nationalId.trim().toUpperCase();
  accountStore.phoneNumber = accountStore.phoneNumber.replace(/\s+/g, "");

  const result = ProviderStep2Schema.safeParse({
    nationalId: accountStore.nationalId,
    firstName: accountStore.firstName,
    lastName: accountStore.lastName,
    email: accountStore.email,
    phoneNumber: accountStore.phoneNumber,
  });

  if (!result.success) {
    const mappedErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!mappedErrors[field]) {
        mappedErrors[field] = issue.message;
      }
    }
    errors.value = mappedErrors;
    alertStore.showError(
      "Por favor corrige los campos marcados en rojo antes de continuar.",
      "Datos inválidos"
    );
    return false;
  }

  return true;
};

const handleContinue = () => {
  if (!validateStep2()) return;
  router.push({ name: "provider-step-3" });
};
</script>

<template>
  <div class="wizard-box">
    <h3 class="step-title">Información del Propietario</h3>

    <div class="form-grid">
      <!-- Cédula de Identidad -->
      <div class="form-group">
        <label>Cédula de Identidad <span class="required">*</span></label>
        <input
          v-model="accountStore.nationalId"
          type="text"
          placeholder="001-000000-0000A"
          :class="{ 'input-error': errors.nationalId }"
          @input="clearFieldError('nationalId')"
        />
        <span v-if="errors.nationalId" class="field-error-msg">{{ errors.nationalId }}</span>

        <div class="doc-upload-row">
          <label class="btn-subir-doc">
            <i class="fa-regular fa-file-image"></i>
            <span>{{
              verificationDocName
                ? "Documento seleccionado"
                : "Subir documento"
            }}</span>
            <input
              type="file"
              accept="image/png, image/jpeg, application/pdf"
              style="display: none"
              @change="handleDocumentFile"
            />
          </label>
          <span v-if="verificationDocName" class="upload-filename">
            {{ verificationDocName }}
          </span>
        </div>
      </div>

      <!-- Nombres -->
      <div class="form-group">
        <label>Nombres del Propietario <span class="required">*</span></label>
        <input
          v-model="accountStore.firstName"
          type="text"
          placeholder="Nombre del propietario"
          :class="{ 'input-error': errors.firstName }"
          @input="clearFieldError('firstName')"
        />
        <span v-if="errors.firstName" class="field-error-msg">{{ errors.firstName }}</span>
      </div>

      <!-- Apellidos -->
      <div class="form-group">
        <label>Apellidos del Propietario <span class="required">*</span></label>
        <input
          v-model="accountStore.lastName"
          type="text"
          placeholder="Apellido del propietario"
          :class="{ 'input-error': errors.lastName }"
          @input="clearFieldError('lastName')"
        />
        <span v-if="errors.lastName" class="field-error-msg">{{ errors.lastName }}</span>
      </div>

      <!-- Correo electrónico -->
      <div class="form-group">
        <label>Correo electrónico <span class="required">*</span></label>
        <input
          v-model="accountStore.email"
          type="email"
          placeholder="propietario@ejemplo.com"
          :class="{ 'input-error': errors.email }"
          @input="clearFieldError('email')"
        />
        <span v-if="errors.email" class="field-error-msg">{{ errors.email }}</span>
      </div>

      <!-- Teléfono -->
      <div class="form-group">
        <label>Teléfono <span class="required">*</span></label>
        <input
          v-model="accountStore.phoneNumber"
          type="tel"
          placeholder="+50588880000"
          :class="{ 'input-error': errors.phoneNumber }"
          @input="clearFieldError('phoneNumber')"
        />
        <span v-if="errors.phoneNumber" class="field-error-msg">{{ errors.phoneNumber }}</span>
      </div>
    </div>

    <div class="step-actions right-align">
      <router-link :to="{ name: 'provider-step-1' }" class="btn-orange">
        <i class="fa-solid fa-arrow-left"></i> Atrás
      </router-link>
      <button type="button" class="btn-teal" @click="handleContinue">
        Continuar <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.wizard-box {
  background: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: var(--shadow-sm);
}

.step-title {
  font-size: 1.3rem;
  color: var(--primary-blue);
  margin-bottom: 1.8rem;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.9rem;
}

.required {
  color: var(--primary-orange);
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: var(--light-teal);
}

.input-error {
  border-color: #ef4444 !important;
  background-color: #fffafb;
}

.field-error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.15rem;
}

.doc-upload-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.btn-subir-doc {
  border: 1px solid var(--light-teal);
  background: transparent;
  color: var(--light-teal);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.upload-filename {
  font-size: 0.85rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-actions {
  display: flex;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
}

.step-actions.right-align {
  justify-content: flex-end;
}

.btn-orange {
  background: var(--primary-orange);
  color: #ffffff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-teal {
  background: var(--light-teal);
  color: #ffffff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
