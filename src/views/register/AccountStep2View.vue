<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useAlertStore } from "@/stores/alertStore";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import CreatePasswordModal from "@/components/CreatePasswordModal.vue";

const router = useRouter();
const registerStore = useAccountRegisterStore();
const alertStore = useAlertStore();

const showConfirmModal = ref(false);
const showPasswordModal = ref(false);
const showSuccessModal = ref(false);

const handleRegistration = async (credentials: {
    password: string;
    passwordConfirm?: string;
}) => {
    try {
        await registerStore.submitRegistration(credentials.password);
        showPasswordModal.value = false;
        showSuccessModal.value = true;
    } catch (err: any) {
        alertStore.showError(
            err.message || "Ocurrió un error al procesar el registro.",
            "Error en el Registro"
        );
    }
};

const finishRegistration = () => {
    registerStore.resetForm();
    router.push({ name: "login" });
};
</script>

<template>
    <div class="wizard-card">
        <h3 class="step-title section-title">Información del Comprador</h3>

        <div class="review-grid">
            <div class="review-logo-area">
                <div class="review-logo-circle">
                    <img
                        v-if="registerStore.avatarPreviewUrl"
                        :src="registerStore.avatarPreviewUrl"
                        alt="Avatar"
                    />
                    <i v-else class="fa-solid fa-user"></i>
                </div>
            </div>

            <div class="review-data-area">
                <div class="review-item">
                    <span class="label">Nombres</span>
                    <span class="value">{{
                        registerStore.firstName || "-"
                    }}</span>
                </div>
                <div class="review-item">
                    <span class="label">Apellidos</span>
                    <span class="value">{{
                        registerStore.lastName || "-"
                    }}</span>
                </div>
                <div class="review-item">
                    <span class="label">Cédula de Identidad</span>
                    <span class="value">{{
                        registerStore.nationalId || "-"
                    }}</span>
                </div>
                <div class="review-item">
                    <span class="label">Teléfono</span>
                    <span class="value">{{
                        registerStore.phoneNumber || "-"
                    }}</span>
                </div>
                <div class="review-item">
                    <span class="label">Correo electrónico</span>
                    <span class="value">{{
                        registerStore.email || "-"
                    }}</span>
                </div>
            </div>
        </div>

        <div class="checkbox-container">
            <input
                v-model="registerStore.termsAccepted"
                type="checkbox"
                id="confirm-check"
            />
            <label for="confirm-check">
                Confirmo que la información enviada es correcta y acepto las
                <a href="#">Políticas de Privacidad</a>.
            </label>
        </div>

        <div class="step-actions center-align">
            <router-link :to="{ name: 'account-step-1' }" class="btn-orange">
                <i class="fa-solid fa-arrow-left"></i> Atrás
            </router-link>
            <button
                type="button"
                class="btn-teal"
                :disabled="!registerStore.termsAccepted || registerStore.isLoading"
                @click="showConfirmModal = true"
            >
                Guardar Registro <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>

        <ConfirmModal
            v-model="showConfirmModal"
            title="¿Deseas enviar tu información?"
            confirm-text="Continuar"
            cancel-text="Cancelar"
            :loading="registerStore.isLoading"
            @confirm="
                () => {
                    showConfirmModal = false;
                    showPasswordModal = true;
                }
            "
        />

        <CreatePasswordModal
            v-model="showPasswordModal"
            :email="registerStore.email"
            :loading="registerStore.isLoading"
            @submit="handleRegistration"
            @cancel="showPasswordModal = false"
        />

        <ConfirmModal
            v-model="showSuccessModal"
            title="¡Información Enviada!"
            description="Tu solicitud de registro de comprador ha sido enviada con éxito."
            confirm-text="Continuar"
            :show-close-button="false"
            @confirm="finishRegistration"
        />
    </div>
</template>

<style scoped>
.wizard-card {
    background: #ffffff;
    border: 1px solid var(--border-gray);
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: var(--shadow-sm);
    min-height: 480px;
}

.step-title {
    font-size: 1.3rem;
    color: var(--primary-blue);
    margin-bottom: 1.8rem;
    font-weight: 700;
}

.review-grid {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
}

.review-logo-area {
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.review-logo-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 1px solid var(--border-gray);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2.5rem;
    color: #94a3b8;
    overflow: hidden;
}

.review-logo-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.review-data-area {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
}

.review-item {
    display: flex;
    flex-direction: column;
}

.review-item .label {
    font-weight: 600;
    color: var(--primary-blue);
    font-size: 0.85rem;
    margin-bottom: 0.2rem;
}

.review-item .value {
    color: #475569;
    font-size: 0.95rem;
}

.checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1.25rem;
    background: var(--bg-gray);
    border-radius: 8px;
    margin-top: 1rem;
}

.checkbox-container input {
    width: 18px;
    height: 18px;
    accent-color: var(--light-teal);
}

.checkbox-container label {
    font-size: 0.9rem;
    color: var(--primary-blue);
    cursor: pointer;
}

.checkbox-container a {
    color: var(--primary-orange);
    text-decoration: underline;
}

.step-actions {
    display: flex;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;
}

.step-actions.center-align {
    justify-content: center;
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

.btn-teal:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .review-grid {
        flex-direction: column;
        align-items: center;
    }
    .review-data-area {
        grid-template-columns: 1fr;
        width: 100%;
    }
}
</style>
