<script setup lang="ts">
import { ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved", updatedData: any): void;
  (e: "change-photo"): void;
}>();

// Mock Data
const initialProviderData = {
  ruc: "J0310000664348",
  negocioName: "E. Chamorro Industrial S.A",
  tipoNegocio: "Industria manufacturera",
  telNegocio: "8730 9208",
  direccion: "Calle La Inmaculada en la ciudad de Granada, Nicaragua.",
};

const editForm = ref({ ...initialProviderData });

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      editForm.value = { ...initialProviderData };
    }
  }
);

const handleClose = () => {
  emit("update:modelValue", false);
};

const handleSave = () => {
  console.log("Saving provider data:", editForm.value);
  emit("saved", editForm.value);
  handleClose();
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
        <div class="edit-photo-meta">
          <span class="edit-photo-label">Logo del Negocio</span>
          <span class="edit-photo-formats">JPG, PNG. Máx. 3MB.</span>
          <button type="button" class="btn-change-photo" @click="$emit('change-photo')">
            <i class="fa-solid fa-rotate"></i> Cambiar Logo
          </button>
        </div>
      </div>

      <div class="modal-divider"></div>

      <!-- Business Form -->
      <h3 class="edit-section-title">Información del Negocio</h3>
      <div class="modal-divider thin"></div>

      <div class="edit-fields-grid">
        <div class="edit-field-group">
          <label class="edit-field-label">Número RUC</label>
          <div class="edit-input-wrap locked">
            <i class="fa-regular fa-id-card edit-input-icon"></i>
            <input v-model="editForm.ruc" type="text" class="edit-input locked-input" disabled />
          </div>
        </div>

        <div class="edit-field-group">
          <label class="edit-field-label">Negocio</label>
          <div class="edit-input-wrap">
            <i class="fa-solid fa-building edit-input-icon"></i>
            <input v-model="editForm.negocioName" type="text" class="edit-input" />
          </div>
        </div>

        <div class="edit-field-group">
          <label class="edit-field-label">Tipo de Negocio</label>
          <div class="edit-input-wrap">
            <i class="fa-solid fa-briefcase edit-input-icon"></i>
            <input v-model="editForm.tipoNegocio" type="text" class="edit-input" />
          </div>
        </div>

        <div class="edit-field-group">
          <label class="edit-field-label">Teléfono</label>
          <div class="edit-input-wrap">
            <i class="fa-solid fa-phone edit-input-icon"></i>
            <input v-model="editForm.telNegocio" type="tel" class="edit-input" />
          </div>
        </div>

        <div class="edit-field-group full-col">
          <label class="edit-field-label">Dirección</label>
          <div class="edit-input-wrap">
            <i class="fa-solid fa-location-dot edit-input-icon"></i>
            <input v-model="editForm.direccion" type="text" class="edit-input" />
          </div>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn-cancel" @click="handleClose">Cancelar</button>
      <button type="button" class="btn-save" @click="handleSave">
        <i class="fa-solid fa-check"></i> Actualizar
      </button>
    </div>
  </BaseModal>
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
  gap: 2rem;
  padding: 0.5rem 0;
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

.edit-input-icon {
  color: #083c5a;
  font-size: 1rem;
  opacity: 0.8;
}

.edit-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #083c5a;
  width: 100%;
}

.edit-input.locked-input {
  color: #666;
  cursor: not-allowed;
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

.btn-cancel:hover {
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

.btn-save:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .edit-fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
