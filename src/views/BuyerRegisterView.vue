<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { bootstrapGeo, getGeoManager } from "../modules/geo";
import type { Department, Municipality } from "../modules/geo/types";
import { categoryApi, identityApi, userProfileApi, geographyApi } from "../api";
import type { ProductCategoryResponse } from "../api/services/category/types";

const router = useRouter();

// ── Multi-Step Wizard State Machine ──
type WizardStep = 1 | 2 | 3 | 4;
const currentStep = ref<WizardStep>(1);

// ── Form Model State ──
const form = ref({
    firstName: "",
    lastName: "",
    nationalId: "",
    phoneNumber: "",
    departmentId: "",
    municipalityId: "",
    email: "",
    password: "",
    passwordConfirm: "",
    termsAccepted: false,
});

// ── Geo State ──
const isGeoLoading = ref(false);
const departments = ref<Department[]>([]);
const municipalities = computed<Municipality[]>(() => {
    if (!form.value.departmentId) return [];
    const geo = getGeoManager();
    return geo ? geo.getMunicipalitiesByDepartment(form.value.departmentId) : [];
});

watch(() => form.value.departmentId, () => {
    // Reset municipality selection when department changes
    if (!municipalities.value.some((m) => m.id === form.value.municipalityId)) {
        form.value.municipalityId = "";
    }
});

// ── Categories & Interests State ──
interface CategoryOption extends ProductCategoryResponse {
    imageUrl?: string | null;
}
const categories = ref<CategoryOption[]>([]);
const selectedInterests = ref<Set<string>>(new Set());
const isCategoriesLoading = ref(false);

// ── Avatar Asset State ──
const avatarFile = ref<File | null>(null);
const avatarPreviewUrl = ref<string | null>(null);

// ── Modals & Feedback ──
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const isSubmitting = ref(false);
const showPassword = ref(false);
const showPasswordConfirm = ref(false);

// ── Lifecycle Initialization ──
onMounted(async () => {
    try {
        await bootstrapGeo();
        const geo = getGeoManager();
        if (geo) {
            departments.value = geo.getDepartments();
        }
    } catch (err) {
        console.error("Failed to bootstrap geo metadata:", err);
    }
});

onBeforeUnmount(() => {
    if (avatarPreviewUrl.value) {
        URL.revokeObjectURL(avatarPreviewUrl.value);
    }
});

// ── Geolocation Detection ──
const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocalización no soportada por el navegador.");
        return;
    }

    isGeoLoading.value = true;
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const res = await geographyApi.getMunicipalityByCoordinates({ lat: latitude, lng: longitude });
                form.value.departmentId = res.department_id;
                form.value.municipalityId = res.id;
            } catch (err) {
                console.error("Reverse geocoding failed:", err);
                alert("No se pudo detectar el municipio correspondiente a su ubicación.");
            } finally {
                isGeoLoading.value = false;
            }
        },
        () => {
            isGeoLoading.value = false;
            alert("Permiso denegado para geolocalización.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

// ── Category Operations ──
const loadCategories = async () => {
    if (categories.value.length > 0) return;
    isCategoriesLoading.value = true;
    try {
        const res = await categoryApi.getCategories({ limit: 50 });
        categories.value = res.data.map((cat) => ({ ...cat, imageUrl: undefined }));

        res.data.forEach((cat, idx) => {
            if (!cat.image_blob_id) {
                categories.value[idx].imageUrl = null;
                return;
            }
            categoryApi.getCategoryImageBlobUrl(cat.image_blob_id)
                .then((url) => { categories.value[idx].imageUrl = url; })
                .catch(() => { categories.value[idx].imageUrl = null; });
        });
    } catch (err) {
        console.error("Failed to fetch categories:", err);
    } finally {
        isCategoriesLoading.value = false;
    }
};

const toggleInterest = (categoryId: string) => {
    if (selectedInterests.value.has(categoryId)) {
        selectedInterests.value.delete(categoryId);
    } else {
        selectedInterests.value.add(categoryId);
    }
};

// ── Asset Upload Handlers ──
const handleAvatarSelection = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        setAvatar(input.files[0]);
    }
};

const handleAvatarDrop = (event: DragEvent) => {
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        setAvatar(event.dataTransfer.files[0]);
    }
};

const setAvatar = (file: File) => {
    if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen.");
        return;
    }
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarFile.value = file;
    avatarPreviewUrl.value = URL.createObjectURL(file);
};

const clearAvatar = () => {
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarFile.value = null;
    avatarPreviewUrl.value = null;
};

// ── Step Navigation & Validation ──
const validateStep1 = (): boolean => {
    const { firstName, lastName, nationalId, phoneNumber, departmentId, municipalityId, email } = form.value;
    if (!firstName || !lastName || !nationalId || !phoneNumber || !departmentId || !municipalityId || !email) {
        alert("Por favor completa todos los campos requeridos.");
        return false;
    }
    return true;
};

const goToStep = (step: WizardStep) => {
    if (step === 2) {
        if (!validateStep1()) return;
        loadCategories();
    }
    currentStep.value = step;
};

// ── Registration Submission Pipeline ──
const handleRegistration = async () => {
    if (!form.value.password || form.value.password !== form.value.passwordConfirm) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    isSubmitting.value = true;
    try {
        await identityApi.register({
            first_name: form.value.firstName.trim(),
            last_name: form.value.lastName.trim(),
            national_id: form.value.nationalId.trim() || null,
            phone_number: form.value.phoneNumber.trim() || null,
            municipality_id: form.value.municipalityId,
            email: form.value.email.trim(),
            password: form.value.password,
            interests: Array.from(selectedInterests.value),
        });

        if (avatarFile.value) {
            await identityApi.login({
                email: form.value.email.trim(),
                password: form.value.password,
            });
            await userProfileApi.changeProfilePicture(avatarFile.value);
        }

        showConfirmModal.value = false;
        showSuccessModal.value = true;
    } catch (err: any) {
        alert(err.message || "Ocurrió un error al procesar el registro.");
    } finally {
        isSubmitting.value = false;
    }
};

const finishRegistration = () => {
    router.push({ name: "login" });
};
</script>

<template>
    <div class="buyer-register-page">
        <header class="top-header">
            <div class="logo">
                <img src="../assets/logo.png" alt="Mercanto" class="logo-icon" />
            </div>
            <router-link :to="{ name: 'home' }" class="home-icon">
                <i class="fa-solid fa-house"></i>
            </router-link>
        </header>

        <main class="wizard-container">
            <div class="wizard-header">
                <h1>Registro de Comprador</h1>
                <p>Completa la información requerida para crear una cuenta de comprador en la plataforma.</p>
            </div>

            <!-- Stepper Indicator -->
            <div class="stepper">
                <div :class="['step', { active: currentStep === 1, completed: currentStep > 1 }]">
                    <div class="step-circle">1</div>
                    <span class="step-label">Información</span>
                </div>
                <div :class="['step-line', { active: currentStep >= 2 }]"></div>
                <div :class="['step', { active: currentStep === 2, completed: currentStep > 2 }]">
                    <div class="step-circle">2</div>
                    <span class="step-label">Intereses</span>
                </div>
                <div :class="['step-line', { active: currentStep >= 3 }]"></div>
                <div :class="['step', { active: currentStep === 3, completed: currentStep > 3 }]">
                    <div class="step-circle">3</div>
                    <span class="step-label">Revisión</span>
                </div>
                <div :class="['step-line', { active: currentStep >= 4 }]"></div>
                <div :class="['step', { active: currentStep === 4, completed: currentStep === 4 }]">
                    <div class="step-circle">4</div>
                    <span class="step-label">Seguridad</span>
                </div>
            </div>

            <!-- STEP 1: Personal Information -->
            <div v-if="currentStep === 1" class="wizard-card">
                <h3 class="step-title">Información Personal y Cuenta</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombres <span class="required">*</span></label>
                        <input v-model="form.firstName" type="text" placeholder="Héctor Raúl" required />
                    </div>
                    <div class="form-group">
                        <label>Apellidos <span class="required">*</span></label>
                        <input v-model="form.lastName" type="text" placeholder="Hernández López" required />
                    </div>
                    <div class="form-group">
                        <label>Cédula de identidad <span class="required">*</span></label>
                        <input v-model="form.nationalId" type="text" placeholder="401-241200-1006E" required />
                    </div>
                    <div class="form-group">
                        <label>Teléfono <span class="required">*</span></label>
                        <input v-model="form.phoneNumber" type="tel" placeholder="8730 9208" required />
                    </div>

                    <div class="form-group full-width auto-geo-wrapper">
                        <button
                            type="button"
                            class="btn-auto-geo"
                            :disabled="isGeoLoading"
                            @click="handleAutoDetectLocation"
                        >
                            <i :class="isGeoLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-location-crosshairs'"></i>
                            <span>{{ isGeoLoading ? "Detectando..." : "Auto-detectar ubicación" }}</span>
                        </button>
                    </div>

                    <div class="form-group">
                        <label>Departamento <span class="required">*</span></label>
                        <div class="select-wrapper">
                            <select v-model="form.departmentId" :disabled="departments.length === 0">
                                <option value="" disabled selected>Seleccione...</option>
                                <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                                    {{ dept.name }}
                                </option>
                            </select>
                            <i class="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Municipio <span class="required">*</span></label>
                        <div class="select-wrapper">
                            <select v-model="form.municipalityId" :disabled="!form.departmentId">
                                <option value="" disabled selected>Seleccione...</option>
                                <option v-for="mun in municipalities" :key="mun.id" :value="mun.id">
                                    {{ mun.name }}
                                </option>
                            </select>
                            <i class="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label>Correo electrónico <span class="required">*</span></label>
                        <input v-model="form.email" type="email" placeholder="ejemplo@gmail.com" required />
                    </div>

                    <div class="form-group full-width">
                        <label>Foto de Perfil</label>
                        <div
                            v-if="!avatarPreviewUrl"
                            class="drag-drop-zone"
                            @dragover.prevent
                            @drop.prevent="handleAvatarDrop"
                        >
                            <i class="fa-solid fa-cloud-arrow-up cloud-icon"></i>
                            <p>Arrastra una imagen aquí</p>
                            <span>o</span>
                            <label class="btn-outline">
                                Seleccionar archivo
                                <input type="file" accept="image/png, image/jpeg" style="display: none;" @change="handleAvatarSelection" />
                            </label>
                        </div>
                        <div v-else class="preview-container">
                            <img :src="avatarPreviewUrl" alt="Foto de perfil" />
                            <button type="button" class="btn-remove-photo" @click="clearAvatar">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="step-actions right-align">
                    <router-link :to="{ name: 'register' }" class="btn-orange">Cancelar</router-link>
                    <button type="button" class="btn-teal" @click="goToStep(2)">
                        Continuar <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <!-- STEP 2: Interests -->
            <div v-if="currentStep === 2" class="wizard-card">
                <div class="step-subheading">
                    <h3 class="step-title">Selecciona tus intereses</h3>
                    <p>Obtén recomendaciones sobre las categorías seleccionadas para mejorar tu experiencia.</p>
                </div>

                <div v-if="isCategoriesLoading" class="loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i> Cargando categorías...
                </div>
                <div v-else class="categories-grid">
                    <div
                        v-for="cat in categories"
                        :key="cat.id"
                        :class="['category-selectable-card', { selected: selectedInterests.has(cat.id) }]"
                        @click="toggleInterest(cat.id)"
                    >
                        <img v-if="cat.imageUrl" :src="cat.imageUrl" :alt="cat.name" />
                        <div v-else class="category-placeholder">
                            <i class="fa-solid fa-image"></i>
                        </div>
                        <p>{{ cat.name }}</p>
                    </div>
                </div>

                <div class="step-actions right-align">
                    <button type="button" class="btn-orange" @click="goToStep(1)">
                        <i class="fa-solid fa-arrow-left"></i> Atrás
                    </button>
                    <button type="button" class="btn-teal" @click="goToStep(3)">
                        Continuar <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <!-- STEP 3: Review -->
            <div v-if="currentStep === 3" class="wizard-card">
                <h3 class="step-title section-title">Información del Comprador</h3>
                <div class="review-grid">
                    <div class="review-logo-area">
                        <div class="review-logo-circle">
                            <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="Avatar" />
                            <i v-else class="fa-solid fa-user"></i>
                        </div>
                    </div>
                    <div class="review-data-area">
                        <div class="review-item">
                            <span class="label">Nombres</span>
                            <span class="value">{{ form.firstName || "-" }}</span>
                        </div>
                        <div class="review-item">
                            <span class="label">Apellidos</span>
                            <span class="value">{{ form.lastName || "-" }}</span>
                        </div>
                        <div class="review-item">
                            <span class="label">Cédula de Identidad</span>
                            <span class="value">{{ form.nationalId || "-" }}</span>
                        </div>
                        <div class="review-item">
                            <span class="label">Correo electrónico</span>
                            <span class="value">{{ form.email || "-" }}</span>
                        </div>
                    </div>
                </div>

                <div class="checkbox-container">
                    <input v-model="form.termsAccepted" type="checkbox" id="confirm-check" />
                    <label for="confirm-check">
                        Confirmo que la información enviada es correcta y acepto las
                        <a href="#">Políticas de Privacidad</a>.
                    </label>
                </div>

                <div class="step-actions center-align">
                    <button type="button" class="btn-orange" @click="goToStep(2)">
                        <i class="fa-solid fa-arrow-left"></i> Atrás
                    </button>
                    <button type="button" class="btn-teal" :disabled="!form.termsAccepted" @click="goToStep(4)">
                        Continuar <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <!-- STEP 4: Password Setup -->
            <div v-if="currentStep === 4" class="password-card-container">
                <div class="password-card">
                    <h2>Crear Contraseña</h2>
                    <p>Crea una contraseña segura para tu cuenta.</p>

                    <div class="form-group">
                        <label>Correo electrónico</label>
                        <div class="input-icon-wrapper">
                            <i class="fa-regular fa-envelope left-icon"></i>
                            <input :value="form.email" type="email" disabled />
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Contraseña <span class="required">*</span></label>
                        <div class="input-icon-wrapper">
                            <i class="fa-solid fa-lock left-icon"></i>
                            <input
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Ingresa tu contraseña"
                                required
                            />
                            <i
                                :class="showPassword ? 'fa-regular fa-eye-slash right-icon' : 'fa-regular fa-eye right-icon'"
                                @click="showPassword = !showPassword"
                            ></i>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Confirmar contraseña <span class="required">*</span></label>
                        <div class="input-icon-wrapper">
                            <i class="fa-solid fa-lock left-icon"></i>
                            <input
                                v-model="form.passwordConfirm"
                                :type="showPasswordConfirm ? 'text' : 'password'"
                                placeholder="Confirma tu contraseña"
                                required
                            />
                            <i
                                :class="showPasswordConfirm ? 'fa-regular fa-eye-slash right-icon' : 'fa-regular fa-eye right-icon'"
                                @click="showPasswordConfirm = !showPasswordConfirm"
                            ></i>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button type="button" class="btn-cancel" @click="goToStep(3)">
                            <i class="fa-solid fa-arrow-left"></i> Atrás
                        </button>
                        <button type="button" class="btn-save" @click="showConfirmModal = true">
                            Guardar Registro
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modals -->
        <div v-if="showConfirmModal" class="modal-overlay">
            <div class="modal-content">
                <button class="btn-close-modal" @click="showConfirmModal = false">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="modal-icon teal-bg">
                    <i class="fa-regular fa-paper-plane"></i>
                </div>
                <h2>¿Deseas enviar tu información?</h2>
                <div class="modal-actions">
                    <button type="button" class="btn-orange" :disabled="isSubmitting" @click="showConfirmModal = false">
                        Cancelar
                    </button>
                    <button type="button" class="btn-teal" :disabled="isSubmitting" @click="handleRegistration">
                        {{ isSubmitting ? "Enviando..." : "Enviar Información" }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showSuccessModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-icon teal-bg">
                    <i class="fa-regular fa-paper-plane"></i>
                </div>
                <h2>¡Información Enviada!</h2>
                <p>Tu solicitud de registro de comprador ha sido enviada con éxito.</p>
                <div class="modal-actions center-align">
                    <button type="button" class="btn-teal" @click="finishRegistration">
                        Continuar <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.buyer-register-page {
    min-height: 100vh;
    background-color: #ffffff;
    color: var(--primary-blue);
    padding-bottom: 4rem;
}

.top-header {
    background-color: var(--bg-gray);
    padding: 1.25rem 2.5rem;
    border-bottom: 1px solid var(--border-gray);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo-icon {
    height: 50px;
    object-fit: contain;
}

.home-icon {
    font-size: 1.5rem;
    color: var(--primary-blue);
    text-decoration: none;
}

.wizard-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
}

.wizard-header {
    text-align: center;
    margin-bottom: 2.5rem;
}

.wizard-header h1 {
    font-size: 2.2rem;
    color: var(--primary-blue);
    margin-bottom: 0.5rem;
}

.wizard-header p {
    color: #64748b;
    font-size: 1rem;
}

/* ── Stepper ── */
.stepper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2.5rem;
}

.step {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    opacity: 0.45;
    transition: opacity 0.2s ease;
}

.step.active, .step.completed {
    opacity: 1;
}

.step-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #94a3b8;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 700;
    font-size: 0.9rem;
}

.step.active .step-circle {
    background-color: var(--primary-orange);
}

.step.completed .step-circle {
    background-color: var(--light-teal);
}

.step-label {
    font-weight: 600;
    font-size: 0.92rem;
    color: var(--primary-blue);
}

.step-line {
    flex: 1;
    max-width: 100px;
    height: 2px;
    background-color: var(--border-gray);
    margin: 0 1rem;
}

.step-line.active {
    background-color: var(--light-teal);
}

/* ── Wizard Card ── */
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

.step-subheading {
    text-align: center;
    margin-bottom: 2rem;
}

.step-subheading p {
    color: #64748b;
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

/* ── File Uploader ── */
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

/* ── Categories Grid ── */
.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
}

.category-selectable-card {
    border: 2px solid var(--border-gray);
    border-radius: 12px;
    padding: 1.25rem 0.8rem;
    text-align: center;
    cursor: pointer;
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    transition: all 0.2s ease;
}

.category-selectable-card:hover {
    border-color: var(--light-teal);
}

.category-selectable-card.selected {
    border-color: var(--primary-orange);
    background-color: #fffaf5;
}

.category-selectable-card img,
.category-placeholder {
    width: 55px;
    height: 55px;
    object-fit: contain;
}

.category-placeholder {
    background: var(--bg-gray);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #94a3b8;
}

.category-selectable-card p {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--primary-blue);
}

/* ── Review Section ── */
.review-grid {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
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

/* ── Password Card ── */
.password-card-container {
    display: flex;
    justify-content: center;
}

.password-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 2.5rem;
    width: 100%;
    max-width: 480px;
    border: 1px solid var(--border-gray);
    box-shadow: var(--shadow-sm);
}

.password-card h2 {
    text-align: center;
    font-size: 1.5rem;
    margin-bottom: 0.4rem;
}

.password-card p {
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.input-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon-wrapper .left-icon {
    position: absolute;
    left: 12px;
    color: var(--primary-blue);
}

.input-icon-wrapper .right-icon {
    position: absolute;
    right: 12px;
    color: var(--light-teal);
    cursor: pointer;
}

.input-icon-wrapper input {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
}

/* ── Buttons ── */
.step-actions {
    display: flex;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;
}

.step-actions.right-align {
    justify-content: flex-end;
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
    gap: 0.5rem;
}

.btn-teal:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
}

.card-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.btn-cancel {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--border-gray);
    background: #ffffff;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    color: var(--primary-blue);
}

.btn-save {
    flex: 1;
    padding: 0.75rem;
    border: none;
    background: var(--primary-orange);
    color: #ffffff;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

/* ── Modals ── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: #ffffff;
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    max-width: 440px;
    text-align: center;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.btn-close-modal {
    position: absolute;
    top: 14px;
    right: 14px;
    background: transparent;
    border: 2px solid var(--primary-orange);
    color: var(--primary-orange);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-icon {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    margin: 0 auto 1.25rem auto;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
}

.modal-icon.teal-bg {
    background: #e6f7f5;
    color: var(--light-teal);
}

.modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.8rem;
}

.modal-actions.center-align {
    justify-content: center;
}

.modal-actions button {
    flex: 1;
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .form-grid, .review-data-area {
        grid-template-columns: 1fr;
    }
    .stepper {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
    .step-line {
        display: none;
    }
    .review-grid {
        flex-direction: column;
        align-items: center;
    }
}
</style>
