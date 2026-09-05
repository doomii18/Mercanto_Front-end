<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import AddressPickerModal, {
  type AddressPickerResult,
} from "@/components/common/AddressPickerModal.vue";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";
import { useUserContextStore } from "@/stores/userContextStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useAlertStore } from "@/stores/alertStore";
import type { ProviderOrganizationPatch } from "@/api/services/organization/types";

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
  (e: "change-photo"): void;
}>();

const contextStore = useUserContextStore();
const orgStore = useOrganizationStore();
const alertStore = useAlertStore();

const showMapModal = ref(false);
const isSaving = ref(false);

// Form fields
const companyName = ref("");
const companyDescription = ref("");
const phoneNumber = ref("");
const address = ref("");
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);

// Read-only fields (from store, not editable)
const taxId = computed(() => contextStore.activeOrganization?.tax_id ?? "—");
const kind = computed(() => contextStore.activeOrganization?.kind ?? "—");
const logoBlobId = computed(
  () => contextStore.activeOrganization?.logo_blob_id ?? null
);

const KIND_LABELS: Record<string, string> = {
  manufacturer: "Industria Manufacturera",
  wholesaler: "Comercio al por mayor",
  distributor: "Distribuidora",
  retailer: "Comercio minorista",
  service: "Servicios",
};

const kindLabel = computed(() => KIND_LABELS[kind.value] ?? kind.value);

function hydrateForm() {
  const org = contextStore.activeOrganization;
  if (!org) return;
  companyName.value = org.company_name || "";
  companyDescription.value = org.company_description || "";
  phoneNumber.value = org.phone_number || "";
  latitude.value = org.location?.latitude ?? null;
  longitude.value = org.location?.longitude ?? null;
  address.value = "";
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) hydrateForm();
  }
);

const handleClose = () => {
  emit("update:modelValue", false);
};

const handleLocationConfirmed = (location: AddressPickerResult) => {
  latitude.value = location.latitude;
  longitude.value = location.longitude;
  address.value = location.address;
};

const handleSave = async () => {
  const orgId = contextStore.activeOrganizationId;
  if (!orgId) {
    alertStore.showError("No se encontró la organización activa.");
    return;
  }

  if (!companyName.value.trim()) {
    alertStore.showError("El nombre del negocio es requerido.");
    return;
  }

  isSaving.value = true;
  try {
    const patch: ProviderOrganizationPatch = {
      company_name: companyName.value.trim(),
      company_description: companyDescription.value.trim() || null,
      phone_number: phoneNumber.value.trim() || null,
    };

    if (latitude.value !== null && longitude.value !== null) {
      patch.location = {
        latitude: latitude.value,
        longitude: longitude.value,
      };
    }

    await orgStore.updateOrganization(orgId, patch);

    alertStore.spawnAlert({
      title: "Información actualizada",
      message: "Los datos del negocio se han guardado correctamente.",
      iconVariant: "teal",
      icon: "fa-solid fa-circle-check",
      confirmText: "Aceptar",
    });

    emit("saved");
    handleClose();
  } catch (err: any) {
    alertStore.showError(
      err.message || "Error al actualizar la información del negocio."
    );
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="620px"
    :show-close-button="false"
    @close="handleClose"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="modal-nav-header">
        <button class="btn-back-nav" @click="handleClose">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h3 class="modal-heading">Editar Información del Proveedor</h3>
        <div style="width: 30px"></div>
      </div>
    </template>

    <div class="edit-provider-modal-content">
      <!-- Photo Section Trigger -->
      <div class="edit-photo-section">
        <!-- Logo Preview -->
        <div class="edit-photo-preview">
          <ProviderLogo
            :blob-id="logoBlobId"
            :alt="companyName || 'Logo del negocio'"
          />
        </div>
        <div class="edit-photo-meta">
          <span class="edit-photo-label">Logo del Negocio</span>
          <span class="edit-photo-formats">JPG, PNG. Máx. 3MB.</span>
          <button
            type="button"
            class="btn-change-photo"
            @click="$emit('change-photo')"
          >
            <i class="fa-solid fa-rotate"></i> Cambiar Logo
          </button>
        </div>
      </div>

      <div class="modal-divider"></div>

      <!-- Business Form -->
      <h3 class="edit-section-title">Información del Negocio</h3>
      <div class="modal-divider thin"></div>

      <div class="edit-fields-grid">
        <!-- RUC (Disabled) -->
        <div class="edit-field-group">
          <label class="edit-field-label">Número RUC</label>
          <div class="edit-input-wrap locked">
            <i class="fa-regular fa-id-card edit-input-icon"></i>
            <input
              :value="taxId"
              type="text"
              class="edit-input locked-input"
              disabled
            />
          </div>
        </div>

        <!-- Company Name -->
        <div class="edit-field-group">
          <label class="edit-field-label">Negocio <span class="required">*</span></label>
          <div class="edit-input-wrap">
            <i class="fa-solid fa-building edit-input-icon"></i>
            <input
              v-model="companyName"
              type="text"
              class="edit-input"
              placeholder="Nombre del negocio"
            />
          </div>
        </div>

        <!-- Kind (Disabled) -->
        <div class="edit-field-group">
          <label class="edit-field-label">Tipo de Negocio</label>
          <div class="edit-input-wrap locked">
            <i class="fa-solid fa-briefcase edit-input-icon"></i>
            <input
              :value="kindLabel"
              type="text"
              class="edit-input locked-input"
              disabled
            />
          </div>
        </div>

        <!-- Phone -->
        <div class="edit-field-group">
          <label class="edit-field-label">Teléfono</label>
          <div class="edit-input-wrap">
            <i class="fa-solid fa-phone edit-input-icon"></i>
            <input
              v-model="phoneNumber"
              type="tel"
              class="edit-input"
              placeholder="+505 0000 0000"
            />
          </div>
        </div>

        <!-- Description (NEW) -->
        <div class="edit-field-group full-col">
          <label class="edit-field-label">Descripción del Negocio</label>
          <div class="edit-textarea-wrap">
            <i class="fa-solid fa-align-left edit-input-icon textarea-icon"></i>
            <textarea
              v-model="companyDescription"
              class="edit-textarea"
              rows="3"
              maxlength="2000"
              placeholder="Describe los productos o rubros que comercializa tu empresa..."
            ></textarea>
          </div>
          <span class="char-count">{{ companyDescription.length }}/2000</span>
        </div>

        <!-- Location via Map Picker (NEW) -->
        <div class="edit-field-group full-col">
          <label class="edit-field-label">Ubicación</label>
          <div class="edit-input-wrap location-wrap">
            <i class="fa-solid fa-location-dot edit-input-icon"></i>
            <input
              :value="
                address ||
                (latitude !== null && longitude !== null
                  ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : '')
              "
              type="text"
              class="edit-input"
              placeholder="Selecciona la ubicación en el mapa..."
              readonly
            />
            <button
              type="button"
              :class="[
                'btn-mapa',
                { used: latitude !== null && longitude !== null },
              ]"
              @click="showMapModal = true"
            >
              <i class="fa-solid fa-map-location-dot"></i>
              {{ latitude !== null ? "Cambiar" : "Mapa" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <button
        type="button"
        class="btn-cancel"
        :disabled="isSaving"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="btn-save"
        :disabled="isSaving || !companyName.trim()"
        @click="handleSave"
      >
        <i
          :class="
            isSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'
          "
        ></i>
        {{ isSaving ? "Guardando..." : "Actualizar" }}
      </button>
    </div>
  </BaseModal>

  <!-- Reused Address Picker Modal -->
  <AddressPickerModal
    v-model="showMapModal"
    :initial-lat="latitude"
    :initial-lng="longitude"
    :initial-address="address"
    @confirm="handleLocationConfirmed"
  />
</template>

<style scoped>
.modal-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-heading {
  font-size: 1.3rem;
  color: var(--primary-blue);
}

.btn-back-nav {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--primary-blue);
  cursor: pointer;
}

.edit-provider-modal-content {
  padding: 0.5rem 0;
}

.edit-photo-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

/* Logo preview container - circular frame matching the buyer avatar editor */
.edit-photo-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border-gray);
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-photo-preview :deep(.provider-logo-wrapper),
.edit-photo-preview :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-photo-meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.edit-photo-label {
  font-weight: 700;
  color: #083c5a;
  font-size: 0.95rem;
}

.edit-photo-formats {
  font-size: 0.85rem;
  color: #666;
}

.btn-change-photo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #c9e8e5;
  color: #00a896;
  border: none;
  border-radius: 20px;
  padding: 0.45rem 1.1rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.4rem;
  width: fit-content;
  transition: background 0.2s;
}

.btn-change-photo:hover {
  background: #b5e0dd;
}

.modal-divider {
  height: 1.5px;
  background-color: #e6e6e6;
  margin: 1.5rem 0;
}

.modal-divider.thin {
  height: 1px;
  margin: 0.8rem 0 1.5rem 0;
}

.edit-section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #083c5a;
  margin: 0;
}

.edit-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 2rem;
}

.edit-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-field-group.full-col {
  grid-column: 1 / -1;
}

.edit-field-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #083c5a;
}

.required {
  color: var(--primary-orange);
}

.edit-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border: 1.5px solid #d0d0d0;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  background: #ffffff;
  transition: border-color 0.2s;
}

.edit-input-wrap:focus-within {
  border-color: #00a896;
}

.edit-input-wrap.locked {
  background: #eff0f2;
  border-color: #e0e0e0;
}

.edit-input-wrap.location-wrap {
  padding-right: 0;
  overflow: hidden;
}

.edit-input-icon {
  color: #083c5a;
  font-size: 1rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.edit-input-icon.textarea-icon {
  align-self: flex-start;
  margin-top: 0.85rem;
}

.edit-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #083c5a;
  width: 100%;
  font-family: inherit;
}

.edit-input.locked-input {
  color: #666;
  cursor: not-allowed;
}

.edit-textarea-wrap {
  display: flex;
  gap: 0.8rem;
  border: 1.5px solid #d0d0d0;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  background: #ffffff;
  transition: border-color 0.2s;
}

.edit-textarea-wrap:focus-within {
  border-color: #00a896;
}

.edit-textarea {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #083c5a;
  width: 100%;
  font-family: inherit;
  resize: vertical;
  min-height: 70px;
}

.char-count {
  font-size: 0.75rem;
  color: #aaa;
  text-align: right;
}

.btn-mapa {
  background-color: var(--primary-blue);
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  border-radius: 0 8px 8px 0;
  margin: -0.65rem -1rem -0.65rem 0;
  height: calc(100% + 1.3rem);
}

.btn-mapa.used {
  background-color: var(--primary-orange);
}

.btn-mapa:hover {
  opacity: 0.9;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1.5px solid #e6e6e6;
}

.btn-cancel {
  background: #ff6a00;
  color: #ffffff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-save {
  background: #00a896;
  color: #ffffff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .edit-fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
