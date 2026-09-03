<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { useGeoStore } from "@/stores/geo";
import type { Municipality } from "@/stores/geo";
import { geographyApi } from "@/api";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useAlertStore } from "@/stores/alertStore";
import BaseFileDropZone from "@/components/common/BaseFileDropZone.vue";
import {
    personNameSchema,
    nationalIdSchema,
    phoneNumberSchema,
    emailSchema,
    uuidSchema,
} from "@/api/services/identity/domain";

const router = useRouter();
const geoStore = useGeoStore();
const registerStore = useAccountRegisterStore();
const alertStore = useAlertStore();

const isGeoLoading = ref(false);
const errors = ref<Record<string, string>>({});

const AccountStep1Schema = z.object({
    firstName: personNameSchema,
    lastName: personNameSchema,
    nationalId: nationalIdSchema,
    phoneNumber: phoneNumberSchema,
    departmentId: uuidSchema,
    municipalityId: uuidSchema,
    email: emailSchema,
});

const departments = computed(() => geoStore.departmentList);

const municipalities = computed<Municipality[]>(() => {
    if (!registerStore.departmentId) return [];
    return geoStore.getMunicipalitiesByDepartment(registerStore.departmentId);
});

const avatarModel = computed({
    get: () => registerStore.avatarFile ?? null,
    set: (file: File[] | File | null) => {
        if (file instanceof File) {
            try {
                registerStore.setAvatar(file);
            } catch (err: any) {
                alertStore.showError(
                    err.message || "Error al procesar el archivo seleccionado."
                );
            }
        } else {
            registerStore.clearAvatar();
        }
    },
});

const clearFieldError = (field: string) => {
    if (errors.value[field]) {
        delete errors.value[field];
    }
};

watch(
    () => registerStore.departmentId,
    () => {
        if (
            !municipalities.value.some(
                (m) => m.id === registerStore.municipalityId
            )
        ) {
            registerStore.municipalityId = null;
        }
        clearFieldError("departmentId");
    }
);

watch(
    () => registerStore.municipalityId,
    () => {
        clearFieldError("municipalityId");
    }
);

onMounted(async () => {
    try {
        if (!geoStore.isInitialized) {
            await geoStore.initialize();
        }
    } catch (err) {
        console.error("Failed to initialize geo store:", err);
    }
});

const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
        alertStore.showError(
            "Geolocalización no soportada por el navegador.",
            "Geolocalización no disponible"
        );
        return;
    }

    isGeoLoading.value = true;
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                if (!geoStore.isInitialized) {
                    await geoStore.initialize();
                }

                const { latitude, longitude } = position.coords;
                const res = await geographyApi.getMunicipalityByCoordinates({
                    lat: latitude,
                    lng: longitude,
                });

                registerStore.departmentId = res.department_id;
                registerStore.municipalityId = res.id;
                clearFieldError("departmentId");
                clearFieldError("municipalityId");
            } catch (err) {
                console.error("Reverse geocoding failed:", err);
                alertStore.showError(
                    "No se pudo detectar el municipio correspondiente a su ubicación.",
                    "Error de Ubicación"
                );
            } finally {
                isGeoLoading.value = false;
            }
        },
        () => {
            isGeoLoading.value = false;
            alertStore.showError(
                "Permiso denegado para geolocalización.",
                "Permiso Requerido"
            );
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

const validateStep1 = (): boolean => {
    errors.value = {};

    registerStore.nationalId = registerStore.nationalId.trim().toUpperCase();
    registerStore.phoneNumber = registerStore.phoneNumber.replace(/\s+/g, "");

    const result = AccountStep1Schema.safeParse({
        firstName: registerStore.firstName,
        lastName: registerStore.lastName,
        nationalId: registerStore.nationalId,
        phoneNumber: registerStore.phoneNumber,
        departmentId: registerStore.departmentId,
        municipalityId: registerStore.municipalityId,
        email: registerStore.email,
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
            "Por favor corrige los campos con errores antes de continuar.",
            "Datos inválidos"
        );
        return false;
    }

    return true;
};

const handleContinue = () => {
    if (!validateStep1()) return;
    router.push({ name: "account-step-2" });
};
</script>

<template>
    <div class="wizard-card">
        <h3 class="step-title">Información Personal y Cuenta</h3>
        <div class="form-grid">
            <div class="form-group">
                <label>Nombres <span class="required">*</span></label>
                <input
                    v-model="registerStore.firstName"
                    type="text"
                    placeholder="Héctor Raúl"
                    :class="{ 'input-error': errors.firstName }"
                    @input="clearFieldError('firstName')"
                />
                <span v-if="errors.firstName" class="field-error-msg">{{
                    errors.firstName
                }}</span>
            </div>

            <div class="form-group">
                <label>Apellidos <span class="required">*</span></label>
                <input
                    v-model="registerStore.lastName"
                    type="text"
                    placeholder="Hernández López"
                    :class="{ 'input-error': errors.lastName }"
                    @input="clearFieldError('lastName')"
                />
                <span v-if="errors.lastName" class="field-error-msg">{{
                    errors.lastName
                }}</span>
            </div>

            <div class="form-group">
                <label>Cédula de identidad <span class="required">*</span></label>
                <input
                    v-model="registerStore.nationalId"
                    type="text"
                    placeholder="401-241200-1006E"
                    :class="{ 'input-error': errors.nationalId }"
                    @input="clearFieldError('nationalId')"
                />
                <span v-if="errors.nationalId" class="field-error-msg">{{
                    errors.nationalId
                }}</span>
            </div>

            <div class="form-group">
                <label>Teléfono <span class="required">*</span></label>
                <input
                    v-model="registerStore.phoneNumber"
                    type="tel"
                    placeholder="+50587309208"
                    :class="{ 'input-error': errors.phoneNumber }"
                    @input="clearFieldError('phoneNumber')"
                />
                <span v-if="errors.phoneNumber" class="field-error-msg">{{
                    errors.phoneNumber
                }}</span>
            </div>

            <div class="form-group full-width auto-geo-wrapper">
                <button
                    type="button"
                    class="btn-auto-geo"
                    :disabled="isGeoLoading"
                    @click="handleAutoDetectLocation"
                >
                    <i
                        :class="
                            isGeoLoading
                                ? 'fa-solid fa-spinner fa-spin'
                                : 'fa-solid fa-location-crosshairs'
                        "
                    ></i>
                    <span>{{
                        isGeoLoading
                            ? "Detectando..."
                            : "Auto-detectar ubicación"
                    }}</span>
                </button>
            </div>

            <div class="form-group">
                <label>Departamento <span class="required">*</span></label>
                <div
                    class="select-wrapper"
                    :class="{ 'input-error': errors.departmentId }"
                >
                    <select
                        v-model="registerStore.departmentId"
                        :disabled="departments.length === 0"
                    >
                        <option value="" disabled selected>
                            Seleccione...
                        </option>
                        <option
                            v-for="dept in departments"
                            :key="dept.id"
                            :value="dept.id"
                        >
                            {{ dept.name }}
                        </option>
                    </select>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <span v-if="errors.departmentId" class="field-error-msg">{{
                    errors.departmentId
                }}</span>
            </div>

            <div class="form-group">
                <label>Municipio <span class="required">*</span></label>
                <div
                    class="select-wrapper"
                    :class="{ 'input-error': errors.municipalityId }"
                >
                    <select
                        v-model="registerStore.municipalityId"
                        :disabled="!registerStore.departmentId"
                    >
                        <option :value="null" disabled selected>
                            Seleccione...
                        </option>
                        <option
                            v-for="mun in municipalities"
                            :key="mun.id"
                            :value="mun.id"
                        >
                            {{ mun.name }}
                        </option>
                    </select>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <span v-if="errors.municipalityId" class="field-error-msg">{{
                    errors.municipalityId
                }}</span>
            </div>

            <div class="form-group full-width">
                <label>Correo electrónico <span class="required">*</span></label>
                <input
                    v-model="registerStore.email"
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    :class="{ 'input-error': errors.email }"
                    @input="clearFieldError('email')"
                />
                <span v-if="errors.email" class="field-error-msg">{{
                    errors.email
                }}</span>
            </div>

            <div class="form-group full-width">
                <label>Foto de Perfil</label>
                <BaseFileDropZone
                    v-model="avatarModel"
                    :multiple="false"
                    accept="image/png, image/jpeg, image/webp"
                    :max-size-mb="3"
                    title="Arrastra tu foto de perfil aquí"
                    button-text="Seleccionar foto"
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
.select-wrapper select {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-gray);
    border-radius: 8px;
    font-size: 0.95rem;
    outline: none;
    background: #ffffff;
    width: 100%;
    box-sizing: border-box;
}

.form-group input:focus,
.select-wrapper select:focus {
    border-color: var(--light-teal);
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

.input-error,
.select-wrapper.input-error select {
    border-color: #ef4444 !important;
    background-color: #fffafb;
}

.field-error-msg {
    color: #ef4444;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 0.15rem;
}

.auto-geo-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: -0.5rem;
}

.btn-auto-geo {
    background: transparent;
    border: 1px solid var(--light-teal);
    color: var(--light-teal);
    padding: 0.4rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

.btn-auto-geo:hover {
    background-color: var(--light-teal);
    color: #ffffff;
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
