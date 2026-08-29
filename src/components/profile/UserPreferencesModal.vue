<script setup lang="ts">
import { ref, watch } from "vue";
import BaseModal from "../common/BaseModal.vue";
import CategoryImage from "../category/CategoryImage.vue";
import { categoryApi, userProfileApi } from "../../api";
import type { ProductCategoryResponse } from "../../api/services/category/types";

interface Props {
  modelValue: boolean;
  initialPreferences?: string[];
  isMandatory?: boolean;
  saveHandler?: (categoryIds: string[]) => Promise<void>;
}

const props = withDefaults(defineProps<Props>(), {
  initialPreferences: () => [],
  isMandatory: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved", categoryIds: string[]): void;
}>();

const categories = ref<ProductCategoryResponse[]>([]);
const selectedInterests = ref<Set<string>>(new Set());
const isLoadingCategories = ref(false);
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);

const loadCategories = async () => {
  if (categories.value.length > 0) return;
  isLoadingCategories.value = true;
  errorMessage.value = null;
  try {
    const res = await categoryApi.getCategories({ limit: 100 });
    categories.value = res.data;
  } catch (err: any) {
    errorMessage.value = err.message || "Error al cargar categorías.";
  } finally {
    isLoadingCategories.value = false;
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      selectedInterests.value = new Set(props.initialPreferences);
      errorMessage.value = null;
      loadCategories();
    }
  },
  { immediate: true }
);

const toggleInterest = (categoryId: string) => {
  if (selectedInterests.value.has(categoryId)) {
    selectedInterests.value.delete(categoryId);
  } else {
    selectedInterests.value.add(categoryId);
  }
};

const handleClose = () => {
  if (!props.isMandatory) {
    emit("update:modelValue", false);
  }
};

const handleSave = async () => {
  if (props.isMandatory && selectedInterests.value.size === 0) {
    errorMessage.value = "Debes seleccionar al menos una categoría para continuar.";
    return;
  }

  isSaving.value = true;
  errorMessage.value = null;
  const payload = Array.from(selectedInterests.value);

  try {
    if (props.saveHandler) {
      await props.saveHandler(payload);
    } else if (typeof (userProfileApi as any).updatePreferences === "function") {
      await (userProfileApi as any).updatePreferences(payload);
    }
    emit("saved", payload);
    emit("update:modelValue", false);
  } catch (err: any) {
    errorMessage.value = err.message || "Error al actualizar preferencias.";
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="720px"
    :close-on-backdrop="!isMandatory"
    :close-on-esc="!isMandatory"
    :show-close-button="!isMandatory"
    @close="handleClose"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="preferences-modal">
      <div class="modal-header-content">
        <div class="icon-badge">
          <i class="fa-solid fa-heart"></i>
        </div>
        <h2>Selecciona tus Categorías de Interés</h2>
        <p>
          {{ isMandatory
              ? "Para brindarte una experiencia personalizada, selecciona al menos una categoría obligatoria."
              : "Selecciona las categorías que te interesan para personalizar tus recomendaciones."
          }}
        </p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="isLoadingCategories" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Cargando categorías...</span>
      </div>

      <div v-else class="categories-grid">
        <div
          v-for="cat in categories"
          :key="cat.id"
          :class="['category-card', { selected: selectedInterests.has(cat.id) }]"
          @click="toggleInterest(cat.id)"
        >
          <div class="category-image-wrap">
            <CategoryImage :blob-id="cat.image_blob_id" :alt="cat.name" />
          </div>
          <p class="category-name">{{ cat.name }}</p>
          <div class="check-indicator">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <button
          v-if="!isMandatory"
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
          :class="{ 'full-width': isMandatory }"
          :disabled="isSaving || (isMandatory && selectedInterests.size === 0)"
          @click="handleSave"
        >
          <i v-if="isSaving" class="fa-solid fa-spinner fa-spin"></i>
          <span>{{ isSaving ? "Guardando..." : "Guardar Preferencias" }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>
<style scoped>
.preferences-modal {
  padding: 0.5rem;
}

.modal-header-content {
  text-align: center;
  margin-bottom: 1.5rem;
}

.icon-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e6f7f5;
  color: var(--light-teal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.modal-header-content h2 {
  font-size: 1.4rem;
  color: var(--primary-blue);
  margin-bottom: 0.35rem;
}

.modal-header-content p {
  color: #64748b;
  font-size: 0.9rem;
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
  margin-bottom: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: #64748b;
  font-size: 0.95rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  max-height: 420px;
  overflow-y: auto;
  padding: 0.25rem;
}

.category-card {
  aspect-ratio: 1 / 1;
  border: 2px solid var(--border-gray);
  border-radius: 16px;
  padding: 0.75rem 0.6rem;
  text-align: center;
  cursor: pointer;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
  box-sizing: border-box;
}

.category-card:hover {
  border-color: var(--light-teal);
  transform: translateY(-2px);
}

.category-card.selected {
  border-color: var(--primary-orange);
  background-color: #fffaf5;
}

.category-image-wrap {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.category-image-wrap :deep(.category-image-container) {
  height: 100% !important;
  margin-bottom: 0 !important;
}

.category-image-wrap :deep(.category-img) {
  max-height: 52px;
  max-width: 100%;
  object-fit: contain;
}

.category-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary-blue);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--primary-orange);
  color: #ffffff;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.category-card.selected .check-indicator {
  display: flex;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

.btn-cancel {
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-gray);
  background-color: #ffffff;
  color: var(--primary-blue);
  font-weight: 600;
  cursor: pointer;
}

.btn-save {
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  border: none;
  background-color: var(--primary-orange);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-save.full-width {
  width: 100%;
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
