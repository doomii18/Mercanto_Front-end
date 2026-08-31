<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useProviderRegisterStore } from "@/stores/providerRegisterStore";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import CreatePasswordModal from "@/components/CreatePasswordModal.vue";

const router = useRouter();
const accountStore = useAccountRegisterStore();
const providerStore = useProviderRegisterStore();

const showConfirmModal = ref(false);
const showPasswordModal = ref(false);
const showSuccessModal = ref(false);

const providerKindLabels: Record<string, string> = {
  manufacturer: "Industria Manufacturera",
  wholesaler: "Comercio al por mayor",
  distributor: "Distribuidora",
  retailer: "Comercio minorista",
  service: "Servicios",
};

const handleRegistration = async (credentials: {
  password: string;
  passwordConfirm?: string;
}) => {
  try {
    await providerStore.submitProviderRegistration(credentials.password);
    showPasswordModal.value = false;
    showSuccessModal.value = true;
  } catch (err: any) {
    alert(err.message || "Ocurrió un error al procesar el registro del proveedor.");
  }
};

const finishRegistration = () => {
  providerStore.resetForm();
  accountStore.resetForm();
  router.push({ name: "login" });
};
</script>

<template>
  <div class="split-view">
    <div class="review-left">
      <h3 class="step-title section-border-bottom">Información del Negocio</h3>
      <div class="review-grid-new">
        <div class="review-logo-area">
          <div class="review-logo-circle">
            <img
              v-if="providerStore.logoPreviewUrl"
              :src="providerStore.logoPreviewUrl"
              alt="Logo de empresa"
            />
            <i v-else class="fa-solid fa-image"></i>
          </div>
        </div>
        <div class="review-data-list">
          <div class="review-row">
            <span class="label">Número RUC</span>
            <span class="value">{{ providerStore.taxId || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Nombre del Negocio</span>
            <span class="value">{{ providerStore.companyName || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Tipo de Negocio</span>
            <span class="value">{{ providerKindLabels[providerStore.kind] || providerStore.kind || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Teléfono del Negocio</span>
            <span class="value">{{ providerStore.companyPhone || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Dirección</span>
            <span class="value">{{ providerStore.address || "-" }}</span>
          </div>
        </div>
      </div>

      <h3 class="step-title section-border-bottom" style="margin-top: 2.5rem">
        Información del Propietario
      </h3>
      <div class="review-grid-new">
        <div class="review-logo-area" style="visibility: hidden">
          <div class="review-logo-circle"></div>
        </div>
        <div class="review-data-list">
          <div class="review-row">
            <span class="label">Cédula de Identidad</span>
            <span class="value">{{ accountStore.nationalId || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Nombre del Propietario</span>
            <span class="value">{{ `${accountStore.firstName} ${accountStore.lastName}`.trim() || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Correo electrónico</span>
            <span class="value">{{ accountStore.email || "-" }}</span>
          </div>
          <div class="review-row">
            <span class="label">Teléfono</span>
            <span class="value">{{ accountStore.phoneNumber || "-" }}</span>
          </div>
        </div>
      </div>

      <div class="checkbox-container-new">
        <input
          v-model="providerStore.termsAccepted"
          type="checkbox"
          id="confirm-check"
        />
        <label for="confirm-check">
          Confirmo que la información enviada es correcta y autorizo a Mercanto a
          verificar los datos enviados.
        </label>
      </div>
    </div>

    <div class="review-right">
      <div class="approval-panel">
        <div class="shield-icon">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <h4>¿Qué sucederá después?</h4>
        <p class="approval-desc">
          Nuestro equipo revisará la información y verificará que los datos
          enviados sean correctos.
        </p>
        <hr />
        <h4 style="text-align: left; margin-bottom: 1.25rem">
          Proceso de Aprobación
        </h4>
        <div class="approval-timeline">
          <div class="timeline-item">
            <i class="fa-regular fa-clock timeline-icon orange"></i>
            <div class="timeline-content">
              <h5>En revisión</h5>
              <p>Tu solicitud es revisada por nuestro equipo.</p>
            </div>
          </div>
          <div class="timeline-item">
            <i class="fa-regular fa-circle-check timeline-icon teal"></i>
            <div class="timeline-content">
              <h5>Aprobado</h5>
              <p>Se te notificará por correo que tu solicitud ha sido aprobada.</p>
            </div>
          </div>
          <div class="timeline-item">
            <i class="fa-regular fa-circle-xmark timeline-icon orange"></i>
            <div class="timeline-content">
              <h5>Desaprobado</h5>
              <p>Te pediremos actualizar la información.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="global-actions">
    <router-link :to="{ name: 'provider-step-2' }" class="btn-orange">
      <i class="fa-solid fa-arrow-left"></i> Atrás
    </router-link>
    <button
      type="button"
      class="btn-teal"
      :disabled="!providerStore.termsAccepted || providerStore.isLoading"
      @click="showConfirmModal = true"
    >
      Enviar
    </button>
  </div>

  <ConfirmModal
    v-model="showConfirmModal"
    title="¿Deseas enviar tu información?"
    description="Una vez enviada, nuestro equipo revisará la información proporcionada."
    confirm-text="Enviar Información"
    cancel-text="Cancelar"
    :loading="providerStore.isLoading"
    @confirm="
      () => {
        showConfirmModal = false;
        showPasswordModal = true;
      }
    "
  />

  <CreatePasswordModal
    v-model="showPasswordModal"
    :email="accountStore.email"
    :loading="providerStore.isLoading"
    @submit="handleRegistration"
    @cancel="showPasswordModal = false"
  />

  <ConfirmModal
    v-model="showSuccessModal"
    title="¡Información Enviada!"
    description="Tu solicitud de registro de proveedor ha sido enviada con éxito."
    confirm-text="Continuar"
    :show-close-button="false"
    @confirm="finishRegistration"
  >
    <template #footer>
      <button
        type="button"
        class="btn-teal full-width"
        @click="finishRegistration"
      >
        Continuar <i class="fa-solid fa-arrow-right"></i>
      </button>
    </template>
  </ConfirmModal>
</template>

<style scoped>
.split-view {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.review-left {
  flex: 2;
  background: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: var(--shadow-sm);
}

.review-right {
  flex: 1.1;
  position: sticky;
  top: 2rem;
}

.step-title {
  font-size: 1.3rem;
  color: var(--primary-blue);
  margin-bottom: 1.8rem;
  font-weight: 700;
}

.section-border-bottom {
  border-bottom: 1px solid var(--border-gray);
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.review-grid-new {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.review-logo-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 1px solid var(--border-gray);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.2rem;
  color: #94a3b8;
  overflow: hidden;
}

.review-logo-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-data-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
}

.review-row .label {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.9rem;
}

.review-row .value {
  color: #475569;
  font-size: 0.92rem;
}

.checkbox-container-new {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin-top: 2.5rem;
  padding: 1.25rem;
  background: var(--bg-gray);
  border-radius: 8px;
}

.checkbox-container-new input {
  margin-top: 0.2rem;
  width: 18px;
  height: 18px;
  accent-color: var(--light-teal);
}

.checkbox-container-new label {
  font-size: 0.9rem;
  color: var(--primary-blue);
  cursor: pointer;
}

.approval-panel {
  background: #eaf5f4;
  border: 1px solid var(--light-teal);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
}

.shield-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #bae5e2;
  color: var(--primary-orange);
  font-size: 2.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.25rem auto;
  border: 2.5px solid var(--light-teal);
}

.approval-panel h4 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: 0.6rem;
}

.approval-desc {
  font-size: 0.88rem;
  color: var(--primary-blue);
  margin-bottom: 1.2rem;
  line-height: 1.4;
}

.approval-panel hr {
  border: none;
  border-top: 1px solid #bae5e2;
  margin: 1.5rem 0;
}

.approval-timeline {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.timeline-item {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}

.timeline-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.timeline-icon.orange {
  color: var(--primary-orange);
}

.timeline-icon.teal {
  color: var(--light-teal);
}

.timeline-content h5 {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.timeline-content p {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.35;
}

.global-actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
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

.btn-teal.full-width {
  width: 100%;
}

.btn-teal:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .split-view {
    flex-direction: column;
  }
  .review-left,
  .review-right {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .review-grid-new {
    flex-direction: column;
  }
  .review-row {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
  .global-actions {
    flex-direction: column;
  }
  .global-actions button,
  .global-actions a {
    width: 100%;
  }
}
</style>
