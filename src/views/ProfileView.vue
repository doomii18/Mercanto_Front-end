<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useAuthStore } from "../modules/auth";
import { userProfileApi } from "../api";
import type { UserProfileResponse } from "../api/services/user_profile/types";
import BaseModal from "../components/common/BaseModal.vue";
import ConfirmModal from "../components/common/ConfirmModal.vue";
import ProfileAvatar from "../components/profile/ProfileAvatar.vue";
import { useGeoStore } from "../stores/geo";

const geoStore = useGeoStore();
const authStore = useAuthStore();
const account = computed(() => authStore.account);
const profile = ref<UserProfileResponse | null>(null);
const departments = computed(() => geoStore.departmentList);
const isLoading = ref(true);

const isAvatarDropdownOpen = ref(false);
const showEditProfileModal = ref(false);
const showViewPhotoModal = ref(false);
const showDeletePhotoModal = ref(false);
const showPhotoModal = ref(false);
type PhotoModalView = "choice" | "upload" | "camera" | "adjust";
const photoModalView = ref<PhotoModalView>("choice");

const editForm = ref({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    nationalId: "",
    municipalityId: "",
});
const editErrors = ref({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    nationalId: "",
});
const isSavingProfile = ref(false);

const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
let mediaStream: MediaStream | null = null;
let currentAdjustImage: HTMLImageElement | null = null;
const cameraActive = ref(false);
const zoomScale = ref(1);
const panOffset = ref({ x: 0, y: 0 });
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
let panStartPos = { x: 0, y: 0 };
const isSavingPhoto = ref(false);

const fullName = computed(() => {
    if (!profile.value) return "Usuario";
    return (
        `${profile.value.first_name || ""} ${profile.value.last_name || ""}`.trim() ||
        "Usuario"
    );
});

const memberSinceDate = computed(() => {
    if (!account.value?.created_at) return "—";
    return new Date(account.value.created_at).toLocaleDateString("es-NI", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
});

const municipalityName = computed(() => {
    if (
        !profile.value ||
        !("municipality_id" in profile.value) ||
        !profile.value.municipality_id
    ) {
        return "—";
    }

    const mun = geoStore.getMunicipalityById(
        profile.value.municipality_id || (profile.value as any).municipality_id,
    );
    return mun ? mun.name : "—";
});

const loadProfile = async () => {
    try {
        profile.value = await userProfileApi.getMyProfile();
    } catch (err) {
        console.error("Error loading user profile:", err);
    }
};

onMounted(async () => {
    try {
        if (!authStore.isInitialized) {
            await authStore.initialize();
        }
        if (!geoStore.isInitialized) {
            await geoStore.initialize();
        }

        geoStore

        await loadProfile();
    } catch (err) {
        console.error("Profile initialization failed:", err);
    } finally {
        isLoading.value = false;
    }
});

onBeforeUnmount(() => {
    stopCameraStream();
});

const openEditProfile = () => {
    if (!profile.value) return;
    const internal = profile.value as any;
    editForm.value = {
        firstName: profile.value.first_name || "",
        lastName: profile.value.last_name || "",
        phoneNumber: internal.phone_number || "",
        nationalId: internal.national_id || "",
        municipalityId: internal.municipality_id || "",
    };
    editErrors.value = {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        nationalId: "",
    };
    showEditProfileModal.value = true;
};

const validateEditForm = (): boolean => {
    let isValid = true;
    const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const digitsRegex = /^[0-9]+$/;

    editErrors.value = {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        nationalId: "",
    };

    if (!editForm.value.firstName.trim()) {
        editErrors.value.firstName = "El nombre es requerido.";
        isValid = false;
    } else if (!lettersRegex.test(editForm.value.firstName)) {
        editErrors.value.firstName = "Solo se permiten letras.";
        isValid = false;
    }

    if (!editForm.value.lastName.trim()) {
        editErrors.value.lastName = "El apellido es requerido.";
        isValid = false;
    } else if (!lettersRegex.test(editForm.value.lastName)) {
        editErrors.value.lastName = "Solo se permiten letras.";
        isValid = false;
    }

    if (
        editForm.value.phoneNumber &&
        !digitsRegex.test(editForm.value.phoneNumber)
    ) {
        editErrors.value.phoneNumber = "Solo se permiten números.";
        isValid = false;
    }

    return isValid;
};

const handleSaveProfile = async () => {
    if (!validateEditForm()) return;

    isSavingProfile.value = true;
    try {
        const updated = await userProfileApi.updateMyProfile({
            first_name: editForm.value.firstName.trim(),
            last_name: editForm.value.lastName.trim(),
            phone_number: editForm.value.phoneNumber.trim() || null,
            national_id: editForm.value.nationalId.trim() || null,
            municipality_id: editForm.value.municipalityId || null,
        });
        profile.value = updated;
        showEditProfileModal.value = false;
    } catch (err: any) {
        alert(err.message || "Error al actualizar el perfil.");
    } finally {
        isSavingProfile.value = false;
    }
};

const toggleAvatarDropdown = () => {
    isAvatarDropdownOpen.value = !isAvatarDropdownOpen.value;
};

const closeAvatarDropdown = () => {
    isAvatarDropdownOpen.value = false;
};

const openPhotoModal = (view: PhotoModalView) => {
    closeAvatarDropdown();
    photoModalView.value = view;
    showPhotoModal.value = true;
    if (view === "camera") {
        nextTick(() => startCameraStream());
    }
};

const closePhotoModal = () => {
    showPhotoModal.value = false;
    stopCameraStream();
    currentAdjustImage = null;
};

const handleDeleteAvatar = async () => {
    if (!profile.value?.avatar_blob_id) return;
    try {
        await userProfileApi.deleteProfilePicture(profile.value.avatar_blob_id);
        if (profile.value) profile.value.avatar_blob_id = null;
        showDeletePhotoModal.value = false;
    } catch (err: any) {
        alert(err.message || "Error al eliminar la foto.");
    }
};

const startCameraStream = async () => {
    stopCameraStream();
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
        });
        if (videoElement.value) {
            videoElement.value.srcObject = mediaStream;
            await videoElement.value.play();
            cameraActive.value = true;
        }
    } catch (err) {
        console.error("Camera access denied:", err);
        cameraActive.value = false;
    }
};

const stopCameraStream = () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
    }
    cameraActive.value = false;
};

const captureFromCamera = () => {
    if (!videoElement.value) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoElement.value.videoWidth || 640;
    tempCanvas.height = videoElement.value.videoHeight || 480;
    const ctx = tempCanvas.getContext("2d");
    ctx?.drawImage(videoElement.value, 0, 0);

    const dataUrl = tempCanvas.toDataURL("image/jpeg");
    prepareImageForAdjust(dataUrl);
};

const handleFileSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        processUploadedFile(input.files[0]);
    }
};

const handleFileDrop = (event: DragEvent) => {
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        processUploadedFile(event.dataTransfer.files[0]);
    }
};

const processUploadedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido.");
        return;
    }
    if (file.size > 3 * 1024 * 1024) {
        alert("La imagen excede el límite de 3MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        if (e.target?.result) {
            prepareImageForAdjust(e.target.result as string);
        }
    };
    reader.readAsDataURL(file);
};

const prepareImageForAdjust = (src: string) => {
    stopCameraStream();
    const img = new Image();
    img.onload = () => {
        currentAdjustImage = img;
        photoModalView.value = "adjust";
        zoomScale.value = 1;
        panOffset.value = { x: 0, y: 0 };
        nextTick(() => renderCanvas());
    };
    img.src = src;
};

const renderCanvas = () => {
    if (!canvasElement.value || !currentAdjustImage) return;
    const canvas = canvasElement.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseScale =
        Math.max(
            canvas.width / currentAdjustImage.width,
            canvas.height / currentAdjustImage.height,
        ) * zoomScale.value;
    const dw = currentAdjustImage.width * baseScale;
    const dh = currentAdjustImage.height * baseScale;
    const dx = (canvas.width - dw) / 2 + panOffset.value.x;
    const dy = (canvas.height - dh) / 2 + panOffset.value.y;

    ctx.drawImage(currentAdjustImage, dx, dy, dw, dh);
};

const handleZoom = (delta: number) => {
    zoomScale.value = Math.max(0.5, Math.min(3, zoomScale.value + delta));
    renderCanvas();
};

const startCanvasDrag = (clientX: number, clientY: number) => {
    isDragging = true;
    dragStartPos = { x: clientX, y: clientY };
    panStartPos = { ...panOffset.value };
};

const moveCanvasDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    panOffset.value = {
        x: panStartPos.x + (clientX - dragStartPos.x),
        y: panStartPos.y + (clientY - dragStartPos.y),
    };
    renderCanvas();
};

const endCanvasDrag = () => {
    isDragging = false;
};

const saveCroppedAvatar = async () => {
    if (!canvasElement.value) return;
    isSavingPhoto.value = true;

    canvasElement.value.toBlob(
        async (blob) => {
            if (!blob) {
                isSavingPhoto.value = false;
                return;
            }

            try {
                const file = new File([blob], "avatar.jpg", {
                    type: "image/jpeg",
                });
                await userProfileApi.changeProfilePicture(file);
                await loadProfile();
                closePhotoModal();
            } catch (err: any) {
                alert(err.message || "Error al guardar la foto de perfil.");
            } finally {
                isSavingPhoto.value = false;
            }
        },
        "image/jpeg",
        0.9,
    );
};
</script>

<template>
    <div class="profile-container">
        <!-- Profile Header Card -->
        <div class="card profile-card">
            <div class="avatar-container">
                <div class="avatar">
                    <ProfileAvatar
                        :blob-id="profile?.avatar_blob_id"
                        :alt="fullName"
                    />
                </div>

                <button
                    type="button"
                    class="edit-avatar-btn"
                    aria-label="Cambiar foto de perfil"
                    @click="toggleAvatarDropdown"
                >
                    <i class="fa-solid fa-camera"></i>
                </button>

                <!-- Avatar Actions Dropdown -->
                <div v-if="isAvatarDropdownOpen" class="avatar-dropdown">
                    <button
                        class="dropdown-item"
                        @click="openPhotoModal('choice')"
                    >
                        <i class="fa-solid fa-rotate"></i> Cambiar Foto
                    </button>
                    <button
                        v-if="profile?.avatar_blob_id"
                        class="dropdown-item"
                        @click="
                            () => {
                                closeAvatarDropdown();
                                showViewPhotoModal = true;
                            }
                        "
                    >
                        <i class="fa-regular fa-image"></i> Ver foto
                    </button>
                    <div
                        v-if="profile?.avatar_blob_id"
                        class="dropdown-divider"
                    ></div>
                    <button
                        v-if="profile?.avatar_blob_id"
                        class="dropdown-item danger"
                        @click="
                            () => {
                                closeAvatarDropdown();
                                showDeletePhotoModal = true;
                            }
                        "
                    >
                        <i class="fa-regular fa-trash-can"></i> Eliminar Foto
                    </button>
                </div>
            </div>

            <div class="profile-info">
                <div class="profile-header">
                    <h2>{{ fullName }}</h2>
                    <span class="badge">
                        <i class="fa-solid fa-bag-shopping"></i> Comprador
                    </span>
                </div>
                <p class="description">
                    Emprendedor en busca de los mejores productos para mi
                    negocio.
                </p>
                <div class="contact-meta">
                    <p>
                        <i class="fa-regular fa-envelope"></i>
                        <span>{{ account?.email || "—" }}</span>
                    </p>
                    <p>
                        <i class="fa-regular fa-calendar"></i>
                        <span>Miembro desde {{ memberSinceDate }}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="stats-cards">
            <div class="stat-card">
                <div class="stat-icon-circle">
                    <i class="fa-solid fa-bag-shopping"></i>
                </div>
                <div class="stat-text">
                    <p class="stat-title">Pedidos Realizados</p>
                    <h3>3</h3>
                    <router-link :to="{ name: 'orders' }" class="stat-link"
                        >ver mis pedidos</router-link
                    >
                </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-card">
                <div class="stat-icon-circle">
                    <i class="fa-solid fa-cart-shopping"></i>
                </div>
                <div class="stat-text">
                    <p class="stat-title">Productos Favoritos</p>
                    <h3>7</h3>
                    <a href="#" class="stat-link">ver mis favoritos</a>
                </div>
            </div>
        </div>

        <!-- Personal Information Card -->
        <div class="card personal-info-card">
            <div class="card-header">
                <h3>Información Personal</h3>
                <button type="button" class="btn-edit" @click="openEditProfile">
                    <i class="fa-solid fa-pencil"></i> Editar
                </button>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <i class="fa-solid fa-user"></i>
                    <span class="label">Nombres</span>
                    <span class="value">{{ profile?.first_name || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-phone"></i>
                    <span class="label">Teléfono</span>
                    <span class="value">{{
                        (profile as any)?.phone_number || "—"
                    }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-user"></i>
                    <span class="label">Apellidos</span>
                    <span class="value">{{ profile?.last_name || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-regular fa-id-card"></i>
                    <span class="label">Cédula</span>
                    <span class="value">{{
                        (profile as any)?.national_id || "—"
                    }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-regular fa-envelope"></i>
                    <span class="label">Correo electrónico</span>
                    <span class="value link">{{ account?.email || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span class="label">Municipio</span>
                    <span class="value">{{ municipalityName }}</span>
                </div>
            </div>
        </div>

        <!-- Modal: Edit Profile -->
        <BaseModal
            v-model="showEditProfileModal"
            max-width="620px"
            :show-close-button="false"
            @close="showEditProfileModal = false"
        >
            <template #header>
                <div class="modal-nav-header">
                    <button
                        class="btn-back-nav"
                        @click="showEditProfileModal = false"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <h3 class="modal-heading">Editar Información Personal</h3>
                    <div style="width: 30px"></div>
                </div>
            </template>

            <div class="edit-photo-section">
                <div class="edit-photo-preview">
                    <ProfileAvatar
                        :blob-id="profile?.avatar_blob_id"
                        :alt="fullName"
                    />
                </div>
                <div class="edit-photo-info">
                    <p class="edit-photo-label">Foto de Perfil</p>
                    <p class="edit-photo-formats">JPG, PNG. Máx. 3MB.</p>
                    <button
                        type="button"
                        class="btn-change-photo"
                        @click="
                            () => {
                                showEditProfileModal = false;
                                openPhotoModal('choice');
                            }
                        "
                    >
                        <i class="fa-solid fa-rotate"></i> Cambiar Foto
                    </button>
                </div>
            </div>

            <form @submit.prevent="handleSaveProfile" class="edit-form-grid">
                <div class="edit-form-group">
                    <label>Nombres</label>
                    <div
                        :class="[
                            'input-with-icon',
                            { error: !!editErrors.firstName },
                        ]"
                    >
                        <i class="fa-solid fa-user"></i>
                        <input
                            v-model="editForm.firstName"
                            type="text"
                            placeholder="Nombres"
                            maxlength="50"
                            required
                        />
                    </div>
                    <span v-if="editErrors.firstName" class="field-error">{{
                        editErrors.firstName
                    }}</span>
                </div>

                <div class="edit-form-group">
                    <label>Apellidos</label>
                    <div
                        :class="[
                            'input-with-icon',
                            { error: !!editErrors.lastName },
                        ]"
                    >
                        <i class="fa-solid fa-user"></i>
                        <input
                            v-model="editForm.lastName"
                            type="text"
                            placeholder="Apellidos"
                            maxlength="50"
                            required
                        />
                    </div>
                    <span v-if="editErrors.lastName" class="field-error">{{
                        editErrors.lastName
                    }}</span>
                </div>

                <div class="edit-form-group">
                    <label>Teléfono</label>
                    <div
                        :class="[
                            'input-with-icon',
                            { error: !!editErrors.phoneNumber },
                        ]"
                    >
                        <i class="fa-solid fa-phone"></i>
                        <input
                            v-model="editForm.phoneNumber"
                            type="tel"
                            placeholder="Teléfono"
                            maxlength="15"
                        />
                    </div>
                    <span v-if="editErrors.phoneNumber" class="field-error">{{
                        editErrors.phoneNumber
                    }}</span>
                </div>

                <div class="edit-form-group">
                    <label>Cédula</label>
                    <div class="input-with-icon">
                        <i class="fa-regular fa-id-card"></i>
                        <input
                            v-model="editForm.nationalId"
                            type="text"
                            placeholder="Cédula"
                            maxlength="20"
                        />
                    </div>
                </div>

                <div class="edit-form-group full-width">
                    <label>Municipio</label>
                    <div class="input-with-icon select-wrapper">
                        <i class="fa-solid fa-location-dot"></i>
                        <select v-model="editForm.municipalityId">
                            <option value="">Seleccione su municipio</option>
                            <optgroup
                                v-for="dept in departments"
                                :key="dept.id"
                                :label="dept.name"
                            >
                                <option
                                    v-for="mun in dept.municipalities"
                                    :key="mun.id"
                                    :value="mun.id"
                                >
                                    {{ mun.name }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div class="edit-form-actions full-width">
                    <button
                        type="button"
                        class="btn-cancel-edit"
                        :disabled="isSavingProfile"
                        @click="showEditProfileModal = false"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        class="btn-save-edit"
                        :disabled="isSavingProfile"
                    >
                        <i
                            :class="
                                isSavingProfile
                                    ? 'fa-solid fa-spinner fa-spin'
                                    : 'fa-solid fa-check'
                            "
                        ></i>
                        {{ isSavingProfile ? "Guardando..." : "Actualizar" }}
                    </button>
                </div>
            </form>
        </BaseModal>

        <!-- Modal: View Avatar -->
        <BaseModal
            v-model="showViewPhotoModal"
            max-width="400px"
            @close="showViewPhotoModal = false"
        >
            <div class="view-photo-container">
                <ProfileAvatar
                    :blob-id="profile?.avatar_blob_id"
                    alt="Foto de perfil ampliada"
                />
            </div>
        </BaseModal>

        <!-- Modal: Delete Avatar -->
        <ConfirmModal
            v-model="showDeletePhotoModal"
            title="¿Deseas eliminar tu foto de perfil?"
            confirm-text="Eliminar"
            cancel-text="Cancelar"
            icon="fa-regular fa-trash-can"
            icon-variant="orange"
            @confirm="handleDeleteAvatar"
            @cancel="showDeletePhotoModal = false"
        />

        <!-- Modal: Photo Wizard -->
        <BaseModal
            v-model="showPhotoModal"
            max-width="480px"
            :show-close-button="false"
            @close="closePhotoModal"
        >
            <template #header>
                <div class="modal-nav-header">
                    <button class="btn-back-nav" @click="closePhotoModal">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <h3 class="modal-heading">
                        {{
                            photoModalView === "camera"
                                ? "Tomar Foto"
                                : photoModalView === "adjust"
                                  ? "Ajustar Foto"
                                  : "Cambiar Foto de Perfil"
                        }}
                    </h3>
                    <button class="btn-close-circle" @click="closePhotoModal">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </template>

            <div v-if="photoModalView === 'choice'" class="choice-container">
                <div class="choice-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>
                <p class="choice-subtitle">
                    Elige cómo cambiar tu foto de perfil
                </p>
                <button class="btn-choice" @click="photoModalView = 'upload'">
                    <div class="choice-icon">
                        <i class="fa-regular fa-image"></i>
                    </div>
                    <div class="choice-text">
                        <h4>Seleccionar una imagen</h4>
                        <p>Desde tu equipo o dispositivo</p>
                    </div>
                    <i class="fa-solid fa-chevron-right choice-arrow"></i>
                </button>
                <button
                    class="btn-choice secondary"
                    @click="
                        () => {
                            photoModalView = 'camera';
                            startCameraStream();
                        }
                    "
                >
                    <div class="choice-icon">
                        <i class="fa-solid fa-camera"></i>
                    </div>
                    <div class="choice-text">
                        <h4>Tomar una foto</h4>
                        <p>Usa la cámara de tu dispositivo</p>
                    </div>
                    <i class="fa-solid fa-chevron-right choice-arrow"></i>
                </button>
            </div>

            <div v-if="photoModalView === 'upload'" class="upload-view">
                <div
                    class="drag-drop-zone"
                    @dragover.prevent
                    @drop.prevent="handleFileDrop"
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
                            @change="handleFileSelected"
                        />
                    </label>
                </div>
                <div class="upload-info">
                    <p>Formatos permitidos: JPG, PNG</p>
                    <p>Tamaño máximo: 3MB</p>
                </div>
                <div class="upload-controls">
                    <button
                        class="btn-secondary"
                        @click="photoModalView = 'choice'"
                    >
                        Atrás
                    </button>
                </div>
            </div>

            <div v-if="photoModalView === 'camera'" class="camera-view">
                <div class="camera-container">
                    <video
                        ref="videoElement"
                        autoplay
                        playsinline
                        class="camera-stream"
                    ></video>
                    <div v-if="!cameraActive" class="camera-overlay-message">
                        <i class="fa-solid fa-camera"></i>
                        <p>
                            Se necesita acceso a la cámara para capturar la
                            foto.
                        </p>
                    </div>
                </div>
                <div class="camera-controls">
                    <button
                        class="btn-secondary"
                        @click="
                            () => {
                                stopCameraStream();
                                photoModalView = 'choice';
                            }
                        "
                    >
                        Cancelar
                    </button>
                    <button
                        class="btn-shutter"
                        :disabled="!cameraActive"
                        @click="captureFromCamera"
                    ></button>
                    <button
                        class="btn-icon"
                        @click="
                            () => {
                                stopCameraStream();
                                photoModalView = 'upload';
                            }
                        "
                    >
                        <i class="fa-solid fa-image"></i>
                    </button>
                </div>
            </div>

            <div v-if="photoModalView === 'adjust'" class="adjust-view">
                <p class="adjust-instruction">
                    Arrastra la imagen para centrarla.
                </p>
                <div class="adjust-container">
                    <canvas
                        ref="canvasElement"
                        class="photo-canvas"
                        @mousedown="
                            (e) => startCanvasDrag(e.clientX, e.clientY)
                        "
                        @mousemove="(e) => moveCanvasDrag(e.clientX, e.clientY)"
                        @mouseup="endCanvasDrag"
                        @mouseleave="endCanvasDrag"
                        @touchstart="
                            (e) =>
                                startCanvasDrag(
                                    e.touches[0].clientX,
                                    e.touches[0].clientY,
                                )
                        "
                        @touchmove="
                            (e) =>
                                moveCanvasDrag(
                                    e.touches[0].clientX,
                                    e.touches[0].clientY,
                                )
                        "
                        @touchend="endCanvasDrag"
                    ></canvas>
                    <div class="adjust-overlay">
                        <div class="crop-circle"></div>
                    </div>
                </div>
                <div class="adjust-controls-top">
                    <button
                        type="button"
                        class="btn-icon circle"
                        @click="handleZoom(-0.1)"
                    >
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <button
                        type="button"
                        class="btn-icon circle"
                        @click="handleZoom(0.1)"
                    >
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <div class="adjust-controls-bottom">
                    <button
                        type="button"
                        class="btn-secondary"
                        @click="closePhotoModal"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        class="btn-primary"
                        :disabled="isSavingPhoto"
                        @click="saveCroppedAvatar"
                    >
                        <i
                            :class="
                                isSavingPhoto
                                    ? 'fa-solid fa-spinner fa-spin'
                                    : 'fa-solid fa-check'
                            "
                        ></i>
                        {{ isSavingPhoto ? "Guardando..." : "Usar foto" }}
                    </button>
                </div>
            </div>
        </BaseModal>
    </div>
</template>
<style scoped>
.profile-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.card {
    background: #ffffff;
    border: 1px solid var(--border-gray);
    border-radius: 16px;
    padding: 2.2rem;
    box-shadow: var(--shadow-sm);
}

.profile-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    text-align: left;
    gap: 2.5rem;
}

.avatar-container {
    position: relative;
    width: 150px;
    height: 150px;
    flex-shrink: 0;
}

.avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    font-size: 4.5rem;
}

.edit-avatar-btn {
    position: absolute;
    bottom: 4px;
    right: 8px;
    background-color: var(--primary-blue);
    color: #ffffff;
    border: 3px solid #ffffff;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 2;
}

.avatar-dropdown {
    position: absolute;
    top: 0;
    left: 105%;
    background: #ffffff;
    border: 1px solid var(--border-gray);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 0.4rem 0;
    min-width: 160px;
    z-index: 200;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.6rem 1rem;
    border: none;
    background: none;
    font-size: 0.9rem;
    color: var(--text-dark);
    cursor: pointer;
    text-align: left;
}

.dropdown-item:hover {
    background-color: var(--bg-gray);
}

.dropdown-item.danger {
    color: #ef4444;
}

.dropdown-divider {
    height: 1px;
    background-color: var(--border-gray);
    margin: 0.3rem 0;
}

.profile-info {
    flex: 0 1 auto;
    min-width: 0;
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.profile-header h2 {
    font-size: 1.75rem;
    color: var(--primary-blue);
}

.badge {
    background-color: #d8f1ef;
    color: var(--primary-blue);
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

.description {
    color: #64748b;
    margin-bottom: 1rem;
    font-size: 0.95rem;
}

.contact-meta p {
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
}

.stats-cards {
    display: flex;
    background: #ffffff;
    border: 1px solid var(--border-gray);
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    padding: 2rem;
    align-items: center;
}

.stat-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    justify-content: center;
}

.stat-divider {
    width: 1px;
    height: 70px;
    background-color: var(--border-gray);
}

.stat-icon-circle {
    width: 65px;
    height: 65px;
    background-color: #d8f1ef;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--primary-blue);
    font-size: 1.6rem;
}

.stat-text .stat-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--primary-blue);
}

.stat-text h3 {
    font-size: 1.8rem;
    color: var(--primary-blue);
    font-family: "Inter", sans-serif;
}

.stat-link {
    color: var(--light-teal);
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 600;
}

.personal-info-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.75rem;
}

.personal-info-card h3 {
    font-size: 1.4rem;
    color: var(--primary-blue);
}

.btn-edit {
    background-color: #d8f1ef;
    color: var(--primary-blue);
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.info-item i {
    color: var(--primary-blue);
    font-size: 1.1rem;
    width: 20px;
    text-align: center;
}

.info-item .label {
    width: 140px;
    font-weight: 600;
    color: var(--primary-blue);
    font-size: 0.92rem;
}

.info-item .value {
    color: var(--text-dark);
    font-weight: 500;
    font-size: 0.95rem;
}

.info-item .value.link {
    color: var(--light-teal);
}

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

.btn-close-circle {
    background: var(--primary-orange);
    color: #ffffff;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.edit-photo-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-gray);
    margin-bottom: 1.5rem;
}

.edit-photo-preview {
    width: 75px;
    height: 75px;
    border-radius: 50%;
    overflow: hidden;
    font-size: 2.2rem;
    flex-shrink: 0;
}

.edit-photo-label {
    font-weight: 700;
    font-size: 0.95rem;
}

.edit-photo-formats {
    font-size: 0.8rem;
    color: #64748b;
    margin-bottom: 0.5rem;
}

.btn-change-photo {
    background: #ffffff;
    border: 1px solid var(--border-gray);
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: 600;
    color: var(--text-dark);
}

.edit-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
}

.edit-form-group.full-width {
    grid-column: 1 / -1;
}

.edit-form-group label {
    display: block;
    font-weight: 600;
    font-size: 0.88rem;
    margin-bottom: 0.4rem;
}

.input-with-icon {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid var(--border-gray);
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    background: #ffffff;
}

.input-with-icon.error {
    border-color: #ef4444;
}

.input-with-icon input,
.input-with-icon select {
    border: none;
    outline: none;
    width: 100%;
    font-size: 0.92rem;
    background: transparent;
}

.field-error {
    color: #ef4444;
    font-size: 0.78rem;
    margin-top: 0.2rem;
}

.edit-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.btn-cancel-edit {
    background: var(--primary-orange);
    color: #ffffff;
    border: none;
    padding: 0.65rem 1.8rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
}

.btn-save-edit {
    background: var(--light-teal);
    color: #ffffff;
    border: none;
    padding: 0.65rem 1.8rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.choice-container {
    text-align: center;
}

.choice-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #64748b;
    color: #ffffff;
    font-size: 2.6rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 0.75rem auto;
}

.choice-subtitle {
    color: #64748b;
    font-size: 0.92rem;
    margin-bottom: 1.5rem;
}

.btn-choice {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 1rem;
    border: 1.5px solid var(--light-teal);
    border-radius: 12px;
    background: #ffffff;
    margin-bottom: 0.85rem;
    cursor: pointer;
    text-align: left;
}

.btn-choice.secondary {
    border-color: var(--border-gray);
}

.choice-icon {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background-color: #d8f1ef;
    color: var(--light-teal);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.3rem;
    margin-right: 1rem;
}

.btn-choice.secondary .choice-icon {
    background-color: var(--bg-gray);
    color: #64748b;
}

.choice-text h4 {
    color: var(--primary-blue);
    font-size: 0.95rem;
    margin-bottom: 0.15rem;
}

.choice-text p {
    font-size: 0.82rem;
    color: #64748b;
}

.choice-arrow {
    margin-left: auto;
    color: var(--light-teal);
}

.drag-drop-zone {
    border: 2px dashed var(--border-gray);
    border-radius: 12px;
    padding: 2.5rem 1rem;
    text-align: center;
    color: #64748b;
    background-color: var(--bg-gray);
    margin-bottom: 1rem;
}

.cloud-icon {
    font-size: 3rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
}

.btn-outline {
    border: 1px solid var(--light-teal);
    background: #ffffff;
    color: var(--light-teal);
    padding: 0.45rem 1.4rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-block;
    margin-top: 0.5rem;
}

.upload-info {
    text-align: center;
    font-size: 0.82rem;
    color: #94a3b8;
    margin-bottom: 1.5rem;
}

.camera-container {
    width: 100%;
    height: 280px;
    background-color: #000000;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1.5rem;
}

.camera-stream {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.camera-overlay-message {
    position: absolute;
    color: #ffffff;
    text-align: center;
}

.camera-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.btn-shutter {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background-color: var(--light-teal);
    border: 3px solid #ffffff;
    box-shadow: 0 0 0 2px var(--border-gray);
    cursor: pointer;
}

.btn-icon {
    width: 42px;
    height: 42px;
    border: 1px solid var(--border-gray);
    background: #ffffff;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.btn-icon.circle {
    border-radius: 50%;
}

.adjust-instruction {
    text-align: center;
    color: #64748b;
    font-size: 0.88rem;
    margin-bottom: 0.75rem;
}

.adjust-container {
    width: 100%;
    max-width: 300px;
    aspect-ratio: 1 / 1;
    margin: 0 auto 1rem auto;
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background-color: #f1f5f9;
}

.photo-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
}

.photo-canvas:active {
    cursor: grabbing;
}

.adjust-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.crop-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.4);
}

.adjust-controls-top {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.adjust-controls-bottom,
.upload-controls {
    display: flex;
    justify-content: space-between;
}

.btn-secondary {
    background: #ffffff;
    border: 1px solid var(--border-gray);
    color: var(--primary-blue);
    padding: 0.6rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.btn-primary {
    background-color: var(--light-teal);
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.view-photo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem 0;
    width: 240px;
    height: 240px;
    margin: 0 auto;
    font-size: 6rem;
}

@media (max-width: 768px) {
    .profile-card {
        flex-direction: column;
        text-align: center;
    }
    .avatar-dropdown {
        left: 50%;
        transform: translateX(-50%);
        top: 105%;
    }
    .profile-header,
    .contact-meta p {
        justify-content: center;
    }
    .stats-cards {
        flex-direction: column;
        gap: 1.5rem;
    }
    .stat-divider {
        display: none;
    }
    .info-grid {
        grid-template-columns: 1fr;
    }
    .edit-form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
