<script setup lang="ts">
import { ref, computed } from "vue";
import { useGeoStore } from "@/stores/geo";
import { useUserContextStore } from "@/stores/userContextStore";
import { useProfileUpdateStore } from "@/stores/profileUpdateStore";
import { useAlertStore } from "@/stores/alertStore";
import BaseModal from "@/components/common/BaseModal.vue";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";

const geoStore = useGeoStore();
const contextStore = useUserContextStore();
const formStore = useProfileUpdateStore();
const alertStore = useAlertStore();

const isVisible = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const departments = computed(() => geoStore.departmentList);
const currentAvatarBlobId = computed(() => contextStore.userProfile?.avatar_blob_id ?? null);
const displayName = computed(() => contextStore.displayName);

const editErrors = ref({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  nationalId: "",
});

function validate(): boolean {
  let isValid = true;
  const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  const digitsRegex = /^[0-9]+$/;

  editErrors.value = { firstName: "", lastName: "", phoneNumber: "", nationalId: "" };

  if (!formStore.firstName.trim()) { editErrors.value.firstName = "El nombre es requerido."; isValid = false; }
  else if (!lettersRegex.test(formStore.firstName)) { editErrors.value.firstName = "Solo se permiten letras."; isValid = false; }

  if (!formStore.lastName.trim()) { editErrors.value.lastName = "El apellido es requerido."; isValid = false; }
  else if (!lettersRegex.test(formStore.lastName)) { editErrors.value.lastName = "Solo se permiten letras."; isValid = false; }

  if (formStore.phoneNumber && !digitsRegex.test(formStore.phoneNumber)) {
    editErrors.value.phoneNumber = "Solo se permiten números."; isValid = false;
  }

  return isValid;
}

async function handleSave() {
  if (!validate()) {
    alertStore.showError("Por favor corrige los campos marcados en rojo.");
    return;
  }

  const success = await formStore.submitUpdate();
  if (success) {
    alertStore.spawnAlert({
      title: "Perfil actualizado",
      message: "Tu información se ha guardado correctamente.",
      iconVariant: "teal",
      icon: "fa-solid fa-circle-check",
      confirmText: "Aceptar"
    });
    close();
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    try {
      formStore.setAvatar(target.files[0]);
    } catch (err: any) {
      alertStore.showError(err.message);
    }
  }
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

// Exposed methods for the parent component
function open() {
  formStore.hydrateFromProfile(contextStore.userProfile);
  isVisible.value = true;
}

function close() {
  isVisible.value = false;
  formStore.resetForm();
  editErrors.value = { firstName: "", lastName: "", phoneNumber: "", nationalId: "" };
}

defineExpose({ open, close });
</script>

<template>
  <BaseModal
    :model-value="isVisible"
    max-width="620px"
    :show-close-button="false"
    @close="close"
    @update:model-value="isVisible = $event"
  >
    <template #header>
      <div class="modal-nav-header">
        <button class="btn-back-nav" @click="close"> <i class="fa-solid fa-arrow-left"></i> </button>
        <h3 class="modal-heading">Editar Información Personal</h3>
        <div style="width: 30px"></div>
      </div>
    </template>

    <div class="edit-photo-section">
      <div class="edit-photo-preview">
        <!-- Show preview from store if exists, otherwise current profile avatar -->
        <img
          v-if="formStore.avatarPreviewUrl"
          :src="formStore.avatarPreviewUrl"
          alt="Preview"
          class="w-full h-full object-cover rounded-full"
        />
        <ProfileAvatar v-else :blob-id="currentAvatarBlobId" :alt="displayName" />
      </div>
      <div class="edit-photo-info">
        <p class="edit-photo-label">Foto de Perfil</p>
        <p class="edit-photo-formats">JPG, PNG. Máx. 3MB.</p>
        <button type="button" class="btn-change-photo" @click="triggerFileInput">
          <i class="fa-solid fa-rotate"></i> Cambiar Foto
        </button>
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          accept="image/png, image/jpeg, image/webp"
          @change="handleFileChange"
        />
      </div>
    </div>

    <form @submit.prevent="handleSave" class="edit-form-grid">
      <div class="edit-form-group">
        <label>Nombres</label>
        <div :class="['input-with-icon', { error: !!editErrors.firstName }]">
          <i class="fa-solid fa-user"></i>
          <input v-model="formStore.firstName" type="text" placeholder="Nombres" maxlength="50" required />
        </div>
        <span v-if="editErrors.firstName" class="field-error">{{ editErrors.firstName }}</span>
      </div>

      <div class="edit-form-group">
        <label>Apellidos</label>
        <div :class="['input-with-icon', { error: !!editErrors.lastName }]">
          <i class="fa-solid fa-user"></i>
          <input v-model="formStore.lastName" type="text" placeholder="Apellidos" maxlength="50" required />
        </div>
        <span v-if="editErrors.lastName" class="field-error">{{ editErrors.lastName }}</span>
      </div>

      <div class="edit-form-group">
        <label>Teléfono</label>
        <div :class="['input-with-icon', { error: !!editErrors.phoneNumber }]">
          <i class="fa-solid fa-phone"></i>
          <input v-model="formStore.phoneNumber" type="tel" placeholder="Teléfono" maxlength="15" />
        </div>
        <span v-if="editErrors.phoneNumber" class="field-error">{{ editErrors.phoneNumber }}</span>
      </div>

      <div class="edit-form-group">
        <label>Cédula</label>
        <div class="input-with-icon">
          <i class="fa-regular fa-id-card"></i>
          <input v-model="formStore.nationalId" type="text" placeholder="Cédula" maxlength="20" />
        </div>
      </div>

      <div class="edit-form-group full-width">
        <label>Municipio</label>
        <div class="input-with-icon select-wrapper">
          <i class="fa-solid fa-location-dot"></i>
          <select v-model="formStore.municipalityId">
            <option :value="null">Seleccione su municipio</option>
            <optgroup v-for="dept in departments" :key="dept.id" :label="dept.name">
              <option v-for="mun in dept.municipalities" :key="mun.id" :value="mun.id">{{ mun.name }}</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="edit-form-actions full-width">
        <button type="button" class="btn-cancel-edit" :disabled="formStore.isLoading" @click="close">Cancelar</button>
        <button type="submit" class="btn-save-edit" :disabled="formStore.isLoading">
          <i :class="formStore.isLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
          {{ formStore.isLoading ? "Guardando..." : "Actualizar" }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
/* Modal Header */
.modal-nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-heading { font-size: 1.3rem; color: var(--primary-blue); }
.btn-back-nav { background: none; border: none; font-size: 1.2rem; color: var(--primary-blue); cursor: pointer; }

/* Photo Section */
.edit-photo-section { display: flex; align-items: center; gap: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-gray); margin-bottom: 1.5rem; }
.edit-photo-preview { width: 75px; height: 75px; border-radius: 50%; overflow: hidden; font-size: 2.2rem; flex-shrink: 0; }
.edit-photo-label { font-weight: 700; font-size: 0.95rem; }
.edit-photo-formats { font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; }
.btn-change-photo { background: #ffffff; border: 1px solid var(--border-gray); padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.85rem; cursor: pointer; font-weight: 600; color: var(--text-dark); }

/* Form Grid */
.edit-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.edit-form-group.full-width { grid-column: 1 / -1; }
.edit-form-group label { display: block; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.4rem; }

.input-with-icon { display: flex; align-items: center; gap: 0.6rem; border: 1px solid var(--border-gray); border-radius: 8px; padding: 0.65rem 0.9rem; background: #ffffff; }
.input-with-icon.error { border-color: #ef4444; }
.input-with-icon input, .input-with-icon select { border: none; outline: none; width: 100%; font-size: 0.92rem; background: transparent; }
.field-error { color: #ef4444; font-size: 0.78rem; margin-top: 0.2rem; }

/* Actions */
.edit-form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn-cancel-edit { background: var(--primary-orange); color: #ffffff; border: none; padding: 0.65rem 1.8rem; border-radius: 25px; font-weight: 600; cursor: pointer; }
.btn-save-edit { background: var(--light-teal); color: #ffffff; border: none; padding: 0.65rem 1.8rem; border-radius: 25px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }

/* Responsive */
@media (max-width: 768px) {
.edit-form-grid { grid-template-columns: 1fr; }
}
</style>
