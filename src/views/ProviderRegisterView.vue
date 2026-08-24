<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import BaseModal from "../components/common/BaseModal.vue";
import ConfirmModal from "../components/common/ConfirmModal.vue";
import CreatePasswordModal from "../components/CreatePasswordModal.vue";
import { GeocodingService } from "../modules/geo";
import {
    identityApi,
    organizationApi,
    verificationRequestApi,
    verificationRequestDocumentApi,
    geographyApi,
} from "../api";
import type { ProviderKind } from "../api/services/organization/types";

const router = useRouter();

// Multi-Step Wizard State Machine
type WizardStep = 1 | 2 | 3;
const currentStep = ref<WizardStep>(1);

// Business Data Model
const businessForm = ref({
    ruc: "",
    companyName: "",
    businessType: "",
    phoneNumber: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    municipalityId: "",
});

// Owner Data Model
const ownerForm = ref({
    nationalId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
});

// Security & Confirmation Model
const termsConfirmed = ref(false);

// Asset Files & Previews
const logoFile = ref<File | null>(null);
const logoPreviewUrl = ref<string | null>(null);
const cedulaFile = ref<File | null>(null);
const cedulaFileName = ref("");

// Modal Visibility & Process State
const showMapModal = ref(false);
const showConfirmModal = ref(false);
const showPasswordModal = ref(false);
const showSuccessModal = ref(false);
const isSubmitting = ref(false);
const isLocating = ref(false);

// Map Controller State
const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: any = null;
let markerInstance: any = null;
const mapAddressText = ref("Ninguna ubicación seleccionada");
const tempLat = ref<number | null>(null);
const tempLng = ref<number | null>(null);
const tempAddress = ref("");
const tempMunicipalityId = ref<string | null>(null);

const DEFAULT_CENTER = [12.1328, -86.2504];

onMounted(() => {
    if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
    }
    if (!(window as any).L && !document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        document.head.appendChild(script);
    }
});

onBeforeUnmount(() => {
    if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
});

const openMap = async () => {
    showMapModal.value = true;
    await nextTick();

    const L = (window as any).L;
    if (!L || !mapContainer.value) return;

    if (!mapInstance) {
        const initialLat = businessForm.value.latitude || DEFAULT_CENTER[0];
        const initialLng = businessForm.value.longitude || DEFAULT_CENTER[1];

        mapInstance = L.map(mapContainer.value).setView([initialLat, initialLng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 19,
        }).addTo(mapInstance);

        mapInstance.on("click", (e: any) => updateMapMarker(e.latlng.lat, e.latlng.lng));

        if (businessForm.value.latitude && businessForm.value.longitude) {
            updateMapMarker(businessForm.value.latitude, businessForm.value.longitude);
        }
    } else {
        mapInstance.invalidateSize();
    }
};

const updateMapMarker = async (lat: number, lng: number) => {
    const L = (window as any).L;
    tempLat.value = lat;
    tempLng.value = lng;

    if (markerInstance) {
        markerInstance.setLatLng([lat, lng]);
    } else {
        markerInstance = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);
        markerInstance.on("dragend", (e: any) => {
            const pos = e.target.getLatLng();
            updateMapMarker(pos.lat, pos.lng);
        });
    }

    mapAddressText.value = "Obteniendo dirección y municipio...";
    try {
        tempAddress.value = await GeocodingService.reverseGeocode(lat, lng);
        mapAddressText.value = tempAddress.value;

        const geoRes = await geographyApi.getMunicipalityByCoordinates({ lat, lng });
        tempMunicipalityId.value = geoRes.id;
    } catch (error) {
        console.error("Geocoding / Municipality lookup failed:", error);
        tempMunicipalityId.value = null;
        mapAddressText.value = `${tempAddress.value} (Fuera de cobertura municipal)`;
    }
};

const useCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocalización no soportada por el navegador.");
        return;
    }

    isLocating.value = true;
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            if (mapInstance) {
                mapInstance.setView([latitude, longitude], 16);
                await updateMapMarker(latitude, longitude);
            }
            isLocating.value = false;
        },
        () => {
            alert("Permiso denegado o error de red.");
            isLocating.value = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

const confirmLocationSelection = () => {
    if (!tempLat.value || !tempLng.value || !tempMunicipalityId.value) return;
    businessForm.value.latitude = tempLat.value;
    businessForm.value.longitude = tempLng.value;
    businessForm.value.address = tempAddress.value;
    businessForm.value.municipalityId = tempMunicipalityId.value;
    showMapModal.value = false;
};

// Asset Handlers
const handleLogoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
        alert("Solo se permiten imágenes.");
        return;
    }
    if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);
    logoFile.value = file;
    logoPreviewUrl.value = URL.createObjectURL(file);
};

const clearLogo = () => {
    if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);
    logoFile.value = null;
    logoPreviewUrl.value = null;
};

const handleCedulaFile = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        cedulaFile.value = input.files[0];
        cedulaFileName.value = input.files[0].name;
    }
};

// Wizard Validation
const validateStep1 = (): boolean => {
    const { ruc, companyName, businessType, phoneNumber, address, municipalityId } = businessForm.value;
    if (!ruc || !companyName || !businessType || !phoneNumber || !address || !municipalityId) {
        alert("Por favor completa todos los campos obligatorios del negocio y selecciona la ubicación en el mapa.");
        return false;
    }
    return true;
};

const validateStep2 = (): boolean => {
    const { nationalId, firstName, lastName, email, phoneNumber } = ownerForm.value;
    if (!nationalId || !firstName || !lastName || !email || !phoneNumber) {
        alert("Por favor completa todos los campos del propietario.");
        return false;
    }
    return true;
};

const goToStep = (step: WizardStep) => {
    if (step === 2 && !validateStep1()) return;
    if (step === 3 && !validateStep2()) return;
    currentStep.value = step;
};

// Registration Pipeline
const openPasswordModal = () => {
    showConfirmModal.value = false;
    showPasswordModal.value = true;
};

const handleFinalSubmit = async (credentials: { password: string; passwordConfirm: string }) => {
    if (!businessForm.value.municipalityId) {
        alert("Falta el identificador municipal. Por favor confirma la ubicación en el mapa.");
        return;
    }

    isSubmitting.value = true;
    try {
        await identityApi.register({
            email: ownerForm.value.email.trim(),
            password: credentials.password,
            first_name: ownerForm.value.firstName.trim(),
            last_name: ownerForm.value.lastName.trim(),
            national_id: ownerForm.value.nationalId.trim(),
            phone_number: ownerForm.value.phoneNumber.trim(),
            municipality_id: businessForm.value.municipalityId,
            interests: [],
        });

        await identityApi.login({
            email: ownerForm.value.email.trim(),
            password: credentials.password,
        });

        const kindMap: Record<string, ProviderKind> = {
            "Industria Manufacturera": "manufacturer",
            "Comercio al por mayor": "wholesaler",
            "Agricultura y Ganadería": "manufacturer",
        };

        const org = await organizationApi.registerOrganization({
            company_name: businessForm.value.companyName.trim(),
            tax_id: businessForm.value.ruc.trim(),
            location: {
                latitude: businessForm.value.latitude || 0,
                longitude: businessForm.value.longitude || 0,
            },
            company_description: null,
            phone_number: businessForm.value.phoneNumber.trim(),
            municipality_id: businessForm.value.municipalityId,
            address: businessForm.value.address.trim(),
            kind: kindMap[businessForm.value.businessType] || "manufacturer",
        });

        const req = await verificationRequestApi.createVerificationRequest({
            organization_id: org.id,
        });

        if (cedulaFile.value) {
            await verificationRequestDocumentApi.uploadVerificationDocument(
                req.id,
                cedulaFile.value,
                "Documento de Identidad"
            );
        }

        await verificationRequestApi.submitVerificationRequest(req.id, {
            request_id: req.id,
        });

        showPasswordModal.value = false;
        showSuccessModal.value = true;
    } catch (err: any) {
        console.error("Provider registration pipeline failure:", err);
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
    <div class="provider-register-page">
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
                <h1>Registro de Proveedor</h1>
                <p>Completa la información requerida para crear una cuenta de proveedor en la plataforma.</p>
            </div>

            <!-- Stepper Indicator -->
            <div class="stepper">
                <div :class="['step', { active: currentStep === 1, completed: currentStep > 1 }]">
                    <div class="step-circle">1</div>
                    <span class="step-label">Información del Negocio</span>
                </div>
                <div :class="['step-line', { active: currentStep >= 2 }]"></div>
                <div :class="['step', { active: currentStep === 2, completed: currentStep > 2 }]">
                    <div class="step-circle">2</div>
                    <span class="step-label">Información del Propietario</span>
                </div>
                <div :class="['step-line', { active: currentStep >= 3 }]"></div>
                <div :class="['step', { active: currentStep === 3, completed: currentStep === 3 }]">
                    <div class="step-circle">3</div>
                    <span class="step-label">Revisión y Envío</span>
                </div>
            </div>

            <div class="wizard-wrapper">
                <!-- STEP 1: Business Information -->
                <div v-if="currentStep === 1" class="wizard-box">
                    <h3 class="step-title">Información del Negocio</h3>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>Número RUC <span class="required">*</span></label>
                            <input
                                v-model="businessForm.ruc"
                                type="text"
                                placeholder="J0310000664348"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label>Nombre del Negocio <span class="required">*</span></label>
                            <input
                                v-model="businessForm.companyName"
                                type="text"
                                placeholder="E. Chamorro Industrial S.A"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label>Tipo de Negocio <span class="required">*</span></label>
                            <div class="select-wrapper">
                                <select v-model="businessForm.businessType" required>
                                    <option value="" disabled selected>Seleccione...</option>
                                    <option value="Industria Manufacturera">Industria Manufacturera</option>
                                    <option value="Comercio al por mayor">Comercio al por mayor</option>
                                    <option value="Agricultura y Ganadería">Agricultura y Ganadería</option>
                                </select>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Teléfono del Negocio <span class="required">*</span></label>
                            <input
                                v-model="businessForm.phoneNumber"
                                type="tel"
                                placeholder="2222 7854"
                                required
                            />
                        </div>

                        <div class="form-group full-width">
                            <label>Dirección <span class="required">*</span></label>
                            <div class="input-with-button">
                                <input
                                    :value="businessForm.address"
                                    type="text"
                                    placeholder="Selecciona la ubicación en el mapa..."
                                    readonly
                                />
                                <button
                                    type="button"
                                    :class="['btn-mapa', { used: !!businessForm.municipalityId }]"
                                    @click="openMap"
                                >
                                    <i class="fa-solid fa-location-dot"></i> Mapa
                                </button>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label>Logo del Negocio</label>
                            <div
                                v-if="!logoPreviewUrl"
                                class="drag-drop-zone"
                                @dragover.prevent
                                @drop.prevent="(e) => handleLogoFiles(e.dataTransfer?.files || null)"
                            >
                                <i class="fa-solid fa-cloud-arrow-up cloud-icon"></i>
                                <p>Arrastra una imagen aquí</p>
                                <span>o</span>
                                <label class="btn-outline">
                                    Seleccionar archivo
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        style="display: none;"
                                        @change="(e) => handleLogoFiles((e.target as HTMLInputElement).files)"
                                    />
                                </label>
                            </div>
                            <div v-else class="preview-container">
                                <img :src="logoPreviewUrl" alt="Logo de empresa" />
                                <button type="button" class="btn-remove-logo" @click="clearLogo">
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

                <!-- STEP 2: Owner Information -->
                <div v-if="currentStep === 2" class="wizard-box">
                    <h3 class="step-title">Información del Propietario</h3>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>Cédula de Identidad <span class="required">*</span></label>
                            <input
                                v-model="ownerForm.nationalId"
                                type="text"
                                placeholder="401-230900-5001F"
                                required
                            />
                            <div class="doc-upload-row">
                                <label class="btn-subir-doc">
                                    <i class="fa-regular fa-file-image"></i>
                                    <span>{{ cedulaFileName ? "Documento seleccionado" : "Subir documento" }}</span>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, application/pdf"
                                        style="display: none;"
                                        @change="handleCedulaFile"
                                    />
                                </label>
                                <span v-if="cedulaFileName" class="upload-filename">{{ cedulaFileName }}</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Nombres del Propietario <span class="required">*</span></label>
                            <input
                                v-model="ownerForm.firstName"
                                type="text"
                                placeholder="Ernesto"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label>Apellidos del Propietario <span class="required">*</span></label>
                            <input
                                v-model="ownerForm.lastName"
                                type="text"
                                placeholder="Chamorro"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label>Correo electrónico <span class="required">*</span></label>
                            <input
                                v-model="ownerForm.email"
                                type="email"
                                placeholder="echamorro@gmail.com"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label>Teléfono <span class="required">*</span></label>
                            <input
                                v-model="ownerForm.phoneNumber"
                                type="tel"
                                placeholder="8790 - 6723"
                                required
                            />
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

                <!-- STEP 3: Review & Submission -->
                <div v-if="currentStep === 3" class="split-view">
                    <!-- Form Data Review -->
                    <div class="review-left">
                        <h3 class="step-title section-border-bottom">Información del Negocio</h3>
                        <div class="review-grid-new">
                            <div class="review-logo-area">
                                <div class="review-logo-circle">
                                    <img v-if="logoPreviewUrl" :src="logoPreviewUrl" alt="Logo de empresa" />
                                    <i v-else class="fa-solid fa-image"></i>
                                </div>
                            </div>
                            <div class="review-data-list">
                                <div class="review-row">
                                    <span class="label">Número RUC</span>
                                    <span class="value">{{ businessForm.ruc || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Nombre del Negocio</span>
                                    <span class="value">{{ businessForm.companyName || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Tipo de Negocio</span>
                                    <span class="value">{{ businessForm.businessType || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Teléfono del Negocio</span>
                                    <span class="value">{{ businessForm.phoneNumber || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Dirección</span>
                                    <span class="value">{{ businessForm.address || "-" }}</span>
                                </div>
                            </div>
                        </div>

                        <h3 class="step-title section-border-bottom" style="margin-top: 2.5rem;">Información del Propietario</h3>
                        <div class="review-grid-new">
                            <div class="review-logo-area" style="visibility: hidden;">
                                <div class="review-logo-circle"></div>
                            </div>
                            <div class="review-data-list">
                                <div class="review-row">
                                    <span class="label">Cédula de Identidad</span>
                                    <span class="value">{{ ownerForm.nationalId || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Nombre del Propietario</span>
                                    <span class="value">{{ `${ownerForm.firstName} ${ownerForm.lastName}`.trim() || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Correo electrónico</span>
                                    <span class="value">{{ ownerForm.email || "-" }}</span>
                                </div>
                                <div class="review-row">
                                    <span class="label">Teléfono</span>
                                    <span class="value">{{ ownerForm.phoneNumber || "-" }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="checkbox-container-new">
                            <input v-model="termsConfirmed" type="checkbox" id="confirm-check" />
                            <label for="confirm-check">
                                Confirmo que la información enviada es correcta y autorizo a Mercanto a verificar los datos enviados.
                            </label>
                        </div>
                    </div>

                    <!-- SLA Timeline Panel -->
                    <div class="review-right">
                        <div class="approval-panel">
                            <div class="shield-icon">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <h4>¿Qué sucederá después?</h4>
                            <p class="approval-desc">Nuestro equipo revisará la información y verificará que los datos enviados sean correctos.</p>
                            <hr />
                            <h4 style="text-align: left; margin-bottom: 1.25rem;">Proceso de Aprobación</h4>
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

                <div v-if="currentStep === 3" class="global-actions">
                    <button type="button" class="btn-orange" @click="goToStep(2)">
                        <i class="fa-solid fa-arrow-left"></i> Atrás
                    </button>
                    <button
                        type="button"
                        class="btn-teal"
                        :disabled="!termsConfirmed"
                        @click="showConfirmModal = true"
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </main>

        <!-- Standardized Confirmation Modal -->
        <ConfirmModal
            v-model="showConfirmModal"
            title="¿Deseas enviar tu información?"
            description="Una vez enviada, nuestro equipo revisará la información proporcionada."
            confirm-text="Enviar Información"
            cancel-text="Cancelar"
            :loading="isSubmitting"
            @confirm="openPasswordModal"
        />

        <!-- Password Modal Component -->
        <CreatePasswordModal
            v-model="showPasswordModal"
            :email="ownerForm.email"
            :loading="isSubmitting"
            @submit="handleFinalSubmit"
            @cancel="showPasswordModal = false"
        />

        <!-- Standardized Success Modal -->
        <ConfirmModal
            v-model="showSuccessModal"
            title="¡Información Enviada!"
            description="Tu solicitud de registro de proveedor ha sido enviada con éxito."
            confirm-text="Continuar"
            :show-close-button="false"
            @confirm="finishRegistration"
        >
            <template #footer>
                <button type="button" class="btn-teal full-width" @click="finishRegistration">
                    Continuar <i class="fa-solid fa-arrow-right"></i>
                </button>
            </template>
        </ConfirmModal>

        <!-- BaseModal Leaflet Map Picker -->
        <BaseModal
            v-model="showMapModal"
            max-width="680px"
            @close="showMapModal = false"
        >
            <h2 class="map-modal-header">
                <i class="fa-solid fa-location-dot"></i> Seleccionar Ubicación
            </h2>
            <button
                type="button"
                class="btn-teal map-btn-current"
                :disabled="isLocating"
                @click="useCurrentLocation"
            >
                <i :class="isLocating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-location-crosshairs'"></i>
                {{ isLocating ? "Obteniendo..." : "Usar mi ubicación actual" }}
            </button>

            <div ref="mapContainer" class="map-container-wrapper"></div>

            <label class="map-address-label">Dirección detectada:</label>
            <div class="map-address-box">
                {{ mapAddressText }}
            </div>

            <template #footer>
                <div class="map-modal-actions">
                    <button
                        type="button"
                        class="btn-secondary"
                        @click="showMapModal = false"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        class="btn-teal"
                        :disabled="!tempMunicipalityId"
                        @click="confirmLocationSelection"
                    >
                        Confirmar Ubicación
                    </button>
                </div>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.provider-register-page {
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
    max-width: 1050px;
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
    margin-bottom: 0.4rem;
}

.wizard-header p {
    color: #64748b;
    font-size: 1rem;
}

/* Stepper */
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
    max-width: 90px;
    height: 2px;
    background-color: var(--border-gray);
    margin: 0 1rem;
}

.step-line.active {
    background-color: var(--light-teal);
}

/* Wizard Box */
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

/* File Uploader */
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

.btn-remove-logo {
    background: #ef4444;
    color: #ffffff;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
}

.doc-upload-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.5rem;
}

.btn-subir-doc {
    border: 1px solid var(--light-teal);
    background: transparent;
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

.upload-filename {
    font-size: 0.85rem;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Split View / Review */
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

/* Approval Panel */
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

/* Actions */
.step-actions {
    display: flex;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;
}

.step-actions.right-align {
    justify-content: flex-end;
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

.btn-secondary {
    background: #ffffff;
    border: 1px solid var(--border-gray);
    color: var(--primary-blue);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

/* Map Picker Modal Specifics */
.map-modal-header {
    text-align: left;
    font-size: 1.3rem;
    color: var(--primary-blue);
    margin-bottom: 1rem;
}

.map-btn-current {
    width: 100%;
    margin-bottom: 1rem;
    border-radius: 8px;
    padding: 0.6rem;
}

.map-container-wrapper {
    height: 320px;
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border-gray);
    z-index: 1;
}

.map-address-label {
    display: block;
    text-align: left;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--primary-blue);
    margin-top: 1rem;
}

.map-address-box {
    padding: 0.75rem;
    background: var(--bg-gray);
    border-radius: 8px;
    font-size: 0.9rem;
    color: #475569;
    text-align: left;
    margin-top: 0.4rem;
}

.map-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    width: 100%;
}

/* Responsive */
@media (max-width: 900px) {
    .split-view {
        flex-direction: column;
    }
    .review-left, .review-right {
        width: 100%;
    }
    .stepper {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
    .step-line {
        display: none;
    }
}

@media (max-width: 600px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    .review-grid-new {
        flex-direction: column;
    }
    .review-row {
        grid-template-columns: 1fr;
        gap: 0.2rem;
    }
    .step-actions, .global-actions {
        flex-direction: column;
    }
    .step-actions button, .global-actions button {
        width: 100%;
    }
}
</style>
