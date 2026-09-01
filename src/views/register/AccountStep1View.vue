<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useGeoStore } from "@/modules/geo";
import type { Municipality } from "@/modules/geo";
import { geographyApi } from "@/api";
import { useAccountRegisterStore } from "@/stores/accountRegisterStore";
import { useAlertStore } from "@/stores/alertStore";

const router = useRouter();
const geoStore = useGeoStore();
const registerStore = useAccountRegisterStore();
const alertStore = useAlertStore();

const isGeoLoading = ref(false);

const departments = computed(() => geoStore.departmentList);

const municipalities = computed<Municipality[]>(() => {
    if (!registerStore.departmentId) return [];
    return geoStore.getMunicipalitiesByDepartment(registerStore.departmentId);
});

watch(
    () => registerStore.departmentId,
    () => {
        if (
            !municipalities.value.some(
                (m) => m.id === registerStore.municipalityId,
            )
        ) {
            registerStore.municipalityId = null;
        }
    },
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
        alertStore.showError("Geolocalización no soportada por el navegador.", "Geolocalización no disponible");
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
            alertStore.showError("Permiso denegado para geolocalización.", "Permiso Requerido");
        },
        { enableHighAccuracy: true, timeout: 10000 },
    );
};

const handleAvatarSelection = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        try {
            registerStore.setAvatar(input.files[0]);
        } catch (err: any) {
            alertStore.showError(err.message || "Error al procesar el archivo seleccionado.");
        }
    }
};

const handleAvatarDrop = (event: DragEvent) => {
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        try {
            registerStore.setAvatar(event.dataTransfer.files[0]);
        } catch (err: any) {
            alertStore.showError(err.message || "Error al procesar el archivo seleccionado.");
        }
    }
};

const validateStep1 = (): boolean => {
    const {
        firstName,
        lastName,
        nationalId,
        phoneNumber,
        departmentId,
        municipalityId,
        email,
    } = registerStore;

    if (
        !firstName.trim() ||
        !lastName.trim() ||
        !nationalId.trim() ||
        !phoneNumber.trim() ||
        !departmentId ||
        !municipalityId ||
        !email.trim()
    ) {
        alertStore.showError("Por favor completa todos los campos requeridos.", "Campos Incompletos");
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
                    required
                />
            </div>
            <div class="form-group">
                <label>Apellidos <span class="required">*</span></label>
                <input
                    v-model="registerStore.lastName"
                    type="text"
                    placeholder="Hernández López"
                    required
                />
            </div>
            <div class="form-group">
                <label>Cédula de identidad <span class="required">*</span></label>
                <input
                    v-model="registerStore.nationalId"
                    type="text"
                    placeholder="401-241200-1006E"
                    required
                />
            </div>
            <div class="form-group">
                <label>Teléfono <span class="required">*</span></label>
                <input
                    v-model="registerStore.phoneNumber"
                    type="tel"
                    placeholder="8730 9208"
                    required
                />
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
                <div class="select-wrapper">
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
            </div>

            <div class="form-group">
                <label>Municipio <span class="required">*</span></label>
                <div class="select-wrapper">
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
            </div>

            <div class="form-group full-width">
                <label>Correo electrónico <span class="required">*</span></label>
                <input
                    v-model="registerStore.email"
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    required
                />
            </div>

            <div class="form-group full-width">
                <label>Foto de Perfil</label>
                <div
                    v-if="!registerStore.avatarPreviewUrl"
                    class="drag-drop-zone"
                    @dragover.prevent
                    @drop.prevent="handleAvatarDrop"
                >
                    <i class="fa-solid fa-cloud-arrow-up cloud-icon"></i>
                    <p>Arrastra una imagen aquí</p>
                    <span>o</span>
                    <label class="btn-outline">
                        Seleccionar archivo
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            style="display: none"
                            @change="handleAvatarSelection"
                        />
                    </label>
                </div>
                <div v-else class="preview-container">
                    <img :src="registerStore.avatarPreviewUrl" alt="Foto de perfil" />
                    <button
                        type="button"
                        class="btn-remove-photo"
                        @click="registerStore.clearAvatar"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
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

.drag-drop-zone {
    border: 2px dashed var(--border-gray);
    border-radius: 10px;
    padding: 2rem;
    text-align: center;
    background-color: var(--bg-gray);
    color: #64748b;
}

.cloud-icon {
    font-size: 2.4rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
}

.btn-outline {
    border: 1px solid var(--light-teal);
    background: transparent;
    color: var(--light-teal);
    padding: 0.45rem 1.4rem;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.88rem;
    display: inline-block;
    margin-top: 0.5rem;
}

.preview-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
}

.preview-container img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
}

.btn-remove-photo {
    background: #ef4444;
    color: #ffffff;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
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
