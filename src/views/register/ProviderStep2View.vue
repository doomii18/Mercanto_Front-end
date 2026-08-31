<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useProviderRegisterStore } from "@/stores/providerRegisterStore";

const router = useRouter();
const accountStore = useAccountRegisterStore();
const providerStore = useProviderRegisterStore();

const verificationDocName = ref(
  providerStore.verificationDocumentFile?.name || ""
);

const handleDocumentFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    providerStore.setVerificationDocument(file);
    verificationDocName.value = file.name;
  }
};

const validateStep2 = (): boolean => {
  const { nationalId, firstName, lastName, email, phoneNumber } = accountStore;

  if (
    !nationalId.trim() ||
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim() ||
    !phoneNumber.trim()
  ) {
    alert("Por favor completa todos los campos obligatorios del propietario.");
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
      <div class="form-group">
        <label>Cédula de Identidad <span class="required">*</span></label>
        <input
          v-model="accountStore.nationalId"
          type="text"
          placeholder="401-230900-5001F"
          required
        />
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

      <div class="form-group">
        <label>Nombres del Propietario <span class="required">*</span></label>
        <input
          v-model="accountStore.firstName"
          type="text"
          placeholder="Ernesto"
          required
        />
      </div>

      <div class="form-group">
        <label>Apellidos del Propietario <span class="required">*</span></label>
        <input
          v-model="accountStore.lastName"
          type="text"
          placeholder="Chamorro"
          required
        />
      </div>

      <div class="form-group">
        <label>Correo electrónico <span class="required">*</span></label>
        <input
          v-model="accountStore.email"
          type="email"
          placeholder="echamorro@gmail.com"
          required
        />
      </div>

      <div class="form-group">
        <label>Teléfono <span class="required">*</span></label>
        <input
          v-model="accountStore.phoneNumber"
          type="tel"
          placeholder="8790 - 6723"
          required
        />
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
