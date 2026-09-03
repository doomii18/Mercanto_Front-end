<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { geographyApi } from "@/api";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useProviderRegisterStore } from "@/stores/providerRegisterStore";
import { useAlertStore } from "@/stores/alertStore";
import AddressPickerModal, {
  type AddressPickerResult,
} from "@/components/common/AddressPickerModal.vue";
import BaseFileDropZone from "@/components/common/BaseFileDropZone.vue";
import {
  companyNameSchema,
  taxIdSchema,
  ProviderKindSchema,
  phoneNumberSchema,
  addressSchema,
  companyDescriptionSchema,
} from "@/api/services/organization/domain";

const router = useRouter();
const providerStore = useProviderRegisterStore();
const accountStore = useAccountRegisterStore();
const alertStore = useAlertStore();

const showMapModal = ref(false);
const errors = ref<Record<string, string>>({});

const ProviderStep1Schema = z.object({
  taxId: taxIdSchema,
  companyName: companyNameSchema,
  kind: ProviderKindSchema,
  companyPhone: phoneNumberSchema,
  companyDescription: companyDescriptionSchema.optional().or(z.literal("")),
  address: addressSchema,
  latitude: z.number({ message: "Debe seleccionar la ubicación en el mapa" }),
  longitude: z.number({ message: "Debe seleccionar la ubicación en el mapa" }),
});

const logoModel = computed({
  get: () => providerStore.logoFile ?? null,
  set: (file: File[] | File | null) => {
    if (file instanceof File) {
      try {
        providerStore.setLogo(file);
      } catch (err: any) {
        alertStore.showError(err.message || "Error al procesar el logo seleccionado.");
      }
    } else {
      providerStore.clearLogo();
    }
  },
});

const clearFieldError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};

const handleLocationConfirmed = async (location: AddressPickerResult) => {
  providerStore.setLocation({
    lat: location.latitude,
    lng: location.longitude,
    address: location.address,
  });
  clearFieldError("address");
  clearFieldError("latitude");
  clearFieldError("longitude");

  try {
    const geoRes = await geographyApi.getMunicipalityByCoordinates({
      lat: location.latitude,
      lng: location.longitude,
    });
    accountStore.municipalityId = geoRes.id;
    accountStore.departmentId = geoRes.department_id;
  } catch (err) {
    console.error("Failed to reverse geocode provider location:", err);
    alertStore.showError(
      "No se pudo obtener el municipio para la ubicación seleccionada.",
      "Error de Ubicación"
    );
  }
};

const validateStep1 = (): boolean => {
  errors.value = {};

  providerStore.taxId = providerStore.taxId.trim().toUpperCase();
  providerStore.companyPhone = providerStore.companyPhone.replace(/\s+/g, "");

  const result = ProviderStep1Schema.safeParse({
    taxId: providerStore.taxId,
    companyName: providerStore.companyName,
    kind: providerStore.kind,
    companyPhone: providerStore.companyPhone,
    companyDescription: providerStore.companyDescription,
    address: providerStore.address,
    latitude: providerStore.latitude,
    longitude: providerStore.longitude,
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
  if (!validateStep1()) return;
  router.push({ name: "provider-step-2" });
};
</script>

<template>
  <div class="wizard-box">
    <h3 class="step-title">Información del Negocio</h3>

    <div class="form-grid">
      <!-- Número RUC -->
      <div class="form-group">
        <label>Número RUC <span class="required">*</span></label>
        <input
          v-model="providerStore.taxId"
          type="text"
          placeholder="J0000000000000"
          :class="{ 'input-error': errors.taxId }"
          @input="clearFieldError('taxId')"
        />
        <span v-if="errors.taxId" class="field-error-msg">{{ errors.taxId }}</span>
      </div>

      <!-- Nombre del Negocio -->
      <div class="form-group">
        <label>Nombre del Negocio <span class="required">*</span></label>
        <input
          v-model="providerStore.companyName"
          type="text"
          placeholder="Distribuidora Ejemplo S.A."
          :class="{ 'input-error': errors.companyName }"
          @input="clearFieldError('companyName')"
        />
        <span v-if="errors.companyName" class="field-error-msg">{{ errors.companyName }}</span>
      </div>

      <!-- Tipo de Negocio -->
      <div class="form-group">
        <label>Tipo de Negocio <span class="required">*</span></label>
        <div class="select-wrapper" :class="{ 'input-error': errors.kind }">
          <select
            v-model="providerStore.kind"
            @change="clearFieldError('kind')"
          >
            <option value="" disabled selected>Seleccione...</option>
            <option value="manufacturer">Industria Manufacturera</option>
            <option value="wholesaler">Comercio al por mayor</option>
            <option value="distributor">Distribuidora</option>
            <option value="retailer">Comercio minorista</option>
            <option value="service">Servicios</option>
          </select>
          <i class="fa-solid fa-chevron-down"></i>
        </div>
        <span v-if="errors.kind" class="field-error-msg">{{ errors.kind }}</span>
      </div>

      <!-- Teléfono del Negocio -->
      <div class="form-group">
        <label>Teléfono del Negocio <span class="required">*</span></label>
        <input
          v-model="providerStore.companyPhone"
          type="tel"
          placeholder="+50522220000"
          :class="{ 'input-error': errors.companyPhone }"
          @input="clearFieldError('companyPhone')"
        />
        <span v-if="errors.companyPhone" class="field-error-msg">{{ errors.companyPhone }}</span>
      </div>

      <!-- Descripción del Negocio -->
      <div class="form-group full-width">
        <label>Descripción del Negocio</label>
        <textarea
          v-model="providerStore.companyDescription"
          placeholder="Describe los productos o rubros que comercializa tu empresa..."
          rows="3"
          :class="{ 'input-error': errors.companyDescription }"
          @input="clearFieldError('companyDescription')"
        ></textarea>
        <span v-if="errors.companyDescription" class="field-error-msg">{{ errors.companyDescription }}</span>
      </div>

      <!-- Dirección y Mapa -->
      <div class="form-group full-width">
        <label>Dirección <span class="required">*</span></label>
        <div class="input-with-button" :class="{ 'input-error': errors.address || errors.latitude || errors.longitude }">
          <input
            :value="providerStore.address"
            type="text"
            placeholder="Selecciona la ubicación en el mapa..."
            readonly
          />
          <button
            type="button"
            :class="[
              'btn-mapa',
              { used: providerStore.latitude !== null && providerStore.longitude !== null },
            ]"
            @click="showMapModal = true"
          >
            <i class="fa-solid fa-location-dot"></i> Mapa
          </button>
        </div>
        <span v-if="errors.address || errors.latitude || errors.longitude" class="field-error-msg">
          {{ errors.address || errors.latitude || errors.longitude }}
        </span>
      </div>

      <!-- Logo -->
      <div class="form-group full-width">
        <label>Logo del Negocio</label>
        <BaseFileDropZone
          v-model="logoModel"
          :multiple="false"
          accept="image/png, image/jpeg, image/webp"
          :max-size-mb="3"
          title="Arrastra el logo de tu negocio aquí"
          button-text="Seleccionar logo"
          hint="Formatos soportados: JPG, PNG, WebP. Tamaño máx.: 3MB"
          @error="(msg) => alertStore.showError(msg)"
        />
      </div>
    </div>

    <div class="step-actions right-align">
      <router-link :to="{ name: 'register' }" class="btn-orange">
        Cancelar
      </router-link>
      <button type="button" class="btn-teal" @click="handleContinue">
        Continuar <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>

    <AddressPickerModal
      v-model="showMapModal"
      :initial-lat="providerStore.latitude"
      :initial-lng="providerStore.longitude"
      :initial-address="providerStore.address"
      @confirm="handleLocationConfirmed"
    />
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

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.9rem;
}

.required {
  color: var(--primary-orange);
}

.form-group input,
.form-group textarea,
.select-wrapper select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  background: #ffffff;
  width: 100%;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus,
.select-wrapper select:focus {
  border-color: var(--light-teal);
}

.input-with-button {
  display: flex;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  overflow: hidden;
}

.input-with-button input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}

.input-error,
.select-wrapper.input-error select,
.input-with-button.input-error {
  border-color: #ef4444 !important;
  background-color: #fffafb;
}

.field-error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.15rem;
}

.btn-mapa {
  background-color: var(--primary-blue);
  color: #ffffff;
  border: none;
  padding: 0 1.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-mapa.used {
  background-color: var(--primary-orange);
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  cursor: pointer;
}

.select-wrapper i {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
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
