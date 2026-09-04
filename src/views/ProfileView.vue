<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../modules/auth";
import { useUserContextStore } from "../stores/userContextStore";
import { useGeoStore } from "../stores/geo";
import { userProfileApi, organizationApi } from "../api";
import type { UserProfileResponse } from "../api/services/user_profile/types";
import type { OrganizationDetailsDto, PublicProviderDto } from "../api/services/organization/types";
import BaseModal from "../components/common/BaseModal.vue";
import ProfileAvatar from "../components/profile/ProfileAvatar.vue";
import AvatarEditor from "../components/profile/AvatarEditor.vue";

const authStore = useAuthStore();
const contextStore = useUserContextStore();
const geoStore = useGeoStore();

const isProvider = computed(() => contextStore.isProvider);
const account = computed(() => authStore.account);

// Data State
const userProfile = ref<UserProfileResponse | null>(null);
const providerOrg = ref<OrganizationDetailsDto | null>(null);
const providerPublic = ref<PublicProviderDto | null>(null);
const isLoading = ref(true);

// UI State
const showEditProfileModal = ref(false);

// Edit Form State (For Buyer/Owner Profile)
const editForm = ref({
    firstName: "", lastName: "", phoneNumber: "", nationalId: "", municipalityId: "",
});
const editErrors = ref({ firstName: "", lastName: "", phoneNumber: "", nationalId: "" });
const isSavingProfile = ref(false);

// Ref to trigger AvatarEditor from the Edit Profile modal
const avatarEditorRef = ref<InstanceType<typeof AvatarEditor> | null>(null);

// --- Computed Properties ---
const displayName = computed(() => {
    if (isProvider.value && providerOrg.value) return providerOrg.value.company_name;
    if (userProfile.value) return `${userProfile.value.first_name || ""} ${userProfile.value.last_name || ""}`.trim() || "Usuario";
    return "Usuario";
});

const displayBadge = computed(() => (isProvider.value ? "Proveedor" : "Comprador"));
const displayBadgeIcon = computed(() => (isProvider.value ? "fa-solid fa-store" : "fa-solid fa-bag-shopping"));

const displayDescription = computed(() => {
    if (isProvider.value && providerOrg.value) return providerOrg.value.company_description || "Proveedor verificado en Mercanto.";
    return "Emprendedor en busca de los mejores productos para mi negocio.";
});

const displayEmail = computed(() => account.value?.email || "—");

const memberSinceDate = computed(() => {
    if (!account.value?.created_at) return "—";
    return new Date(account.value.created_at).toLocaleDateString("es-NI", { year: "numeric", month: "long", day: "numeric" });
});

const avatarBlobId = computed<string | null>(() => {
    if (isProvider.value && providerPublic.value) {
        return providerPublic.value.logo_blob_id ?? null;
    }
    return userProfile.value?.avatar_blob_id ?? null;
});

const municipalityName = computed(() => {
    if (!userProfile.value || !("municipality_id" in userProfile.value) || !userProfile.value.municipality_id) return "—";
    const mun = geoStore.getMunicipalityById(userProfile.value.municipality_id);
    return mun ? mun.name : "—";
});

// Resolves the provider's location text using the geoStore hierarchy
const providerLocationText = computed(() => {
    if (providerPublic.value?.municipality_id) {
        const hierarchy = geoStore.resolveLocationHierarchy(providerPublic.value.municipality_id);
        if (hierarchy?.municipality && hierarchy?.department) {
            return `${hierarchy.municipality.name}, ${hierarchy.department.name}`;
        }
        if (hierarchy?.municipality) {
            return hierarchy.municipality.name;
        }
    }
    if (providerOrg.value?.location) {
        return `${providerOrg.value.location.latitude.toFixed(4)}, ${providerOrg.value.location.longitude.toFixed(4)}`;
    }
    return "—";
});

const departments = computed(() => geoStore.departmentList);

// --- Data Loading ---
const loadProfileData = async () => {
    try {
        if (!authStore.isInitialized) await authStore.initialize();
        if (!contextStore.isInitialized) await contextStore.initialize();
        if (!geoStore.isInitialized) await geoStore.initialize();

        userProfile.value = await userProfileApi.getMyProfile();

        if (isProvider.value && contextStore.activeOrganizationId) {
            try {
                providerOrg.value = await organizationApi.getOrganizationDetails(contextStore.activeOrganizationId);
                providerPublic.value = await organizationApi.getPublicProvider(contextStore.activeOrganizationId);
            } catch (e) {
                console.warn("Failed to load provider details", e);
            }
        }
    } catch (err) {
        console.error("Profile initialization failed:", err);
    } finally {
        isLoading.value = false;
    }
};

// --- Edit Logic (Works for the User/Owner Account) ---
const openEditProfile = () => {
    if (!userProfile.value) return;
    const internal = userProfile.value as any;
    editForm.value = {
        firstName: userProfile.value.first_name || "",
        lastName: userProfile.value.last_name || "",
        phoneNumber: internal.phone_number || "",
        nationalId: internal.national_id || "",
        municipalityId: internal.municipality_id || "",
    };
    editErrors.value = { firstName: "", lastName: "", phoneNumber: "", nationalId: "" };
    showEditProfileModal.value = true;
};

const validateEditForm = (): boolean => {
    let isValid = true;
    const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const digitsRegex = /^[0-9]+$/;
    editErrors.value = { firstName: "", lastName: "", phoneNumber: "", nationalId: "" };

    if (!editForm.value.firstName.trim()) { editErrors.value.firstName = "El nombre es requerido."; isValid = false; }
    else if (!lettersRegex.test(editForm.value.firstName)) { editErrors.value.firstName = "Solo se permiten letras."; isValid = false; }

    if (!editForm.value.lastName.trim()) { editErrors.value.lastName = "El apellido es requerido."; isValid = false; }
    else if (!lettersRegex.test(editForm.value.lastName)) { editErrors.value.lastName = "Solo se permiten letras."; isValid = false; }

    if (editForm.value.phoneNumber && !digitsRegex.test(editForm.value.phoneNumber)) {
        editErrors.value.phoneNumber = "Solo se permiten números."; isValid = false;
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
        userProfile.value = updated;
        showEditProfileModal.value = false;
    } catch (err: any) {
        alert(err.message || "Error al actualizar el perfil.");
    } finally {
        isSavingProfile.value = false;
    }
};

// --- Avatar Editor Callbacks ---
const handleAvatarSave = async (file: File) => {
    try {
        if (isProvider.value) {
            // Mock for provider (Wire up organizationApi.uploadOrganizationLogo when ready)
            alert("Logo de proveedor actualizado (Mock).");
        } else {
            await userProfileApi.changeProfilePicture(file);
        }
        await loadProfileData();
    } catch (err: any) {
        alert(err.message || "Error al guardar la foto.");
    }
};

const handleAvatarDelete = async () => {
    if (!avatarBlobId.value) return;
    try {
        if (isProvider.value) {
            // Mock for provider
            if (providerPublic.value) providerPublic.value.logo_blob_id = null;
            alert("Logo de proveedor eliminado (Mock).");
        } else {
            await userProfileApi.deleteProfilePicture(avatarBlobId.value);
            if (userProfile.value) userProfile.value.avatar_blob_id = null;
        }
    } catch (err: any) {
        alert(err.message || "Error al eliminar la foto.");
    }
};

onMounted(async () => { await loadProfileData(); });
</script>

<template>
    <div class="profile-container">
        <!-- Header Card -->
        <div class="card profile-card">
            <AvatarEditor
                ref="avatarEditorRef"
                :blob-id="avatarBlobId"
                :alt="displayName"
                :is-provider="isProvider"
                @save="handleAvatarSave"
                @delete="handleAvatarDelete"
            />
            <div class="profile-info">
                <div class="profile-header">
                    <h2>{{ displayName }}</h2>
                    <span class="badge">
                        <i :class="displayBadgeIcon"></i> {{ displayBadge }}
                    </span>
                </div>
                <p class="description">{{ displayDescription }}</p>
                <div class="contact-meta">
                    <p><i class="fa-regular fa-envelope"></i> <span>{{ displayEmail }}</span></p>
                    <p><i class="fa-regular fa-calendar"></i> <span>Miembro desde {{ memberSinceDate }}</span></p>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-cards">
            <template v-if="isProvider">
                <div class="stat-card">
                    <div class="stat-icon-circle"><i class="fa-solid fa-bag-shopping"></i></div>
                    <div class="stat-text">
                        <p class="stat-title">Productos Publicados</p>
                        <h3>23</h3>
                        <router-link :to="{ name: 'provider-products' }" class="stat-link">ver mis productos</router-link>
                    </div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-card">
                    <div class="stat-icon-circle"><i class="fa-solid fa-cart-shopping"></i></div>
                    <div class="stat-text">
                        <p class="stat-title">Pedidos Recibidos</p>
                        <h3>57</h3>
                        <router-link :to="{ name: 'orders' }" class="stat-link">ver mis pedidos</router-link>
                    </div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-card">
                    <div class="stat-icon-circle orange-bg"><i class="fa-regular fa-star"></i></div>
                    <div class="stat-text">
                        <p class="stat-title">Calificación Promedio</p>
                        <div class="stat-rating-row">
                            <h3>4.8</h3>
                            <div class="stars-list">
                                <i class="fa-solid fa-star star-filled"></i>
                                <i class="fa-solid fa-star star-filled"></i>
                                <i class="fa-solid fa-star star-filled"></i>
                                <i class="fa-solid fa-star star-filled"></i>
                                <i class="fa-regular fa-star star-empty"></i>
                            </div>
                        </div>
                        <a href="#" class="stat-link">ver opiniones</a>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="stat-card">
                    <div class="stat-icon-circle"><i class="fa-solid fa-bag-shopping"></i></div>
                    <div class="stat-text">
                        <p class="stat-title">Pedidos Realizados</p>
                        <h3>3</h3>
                        <router-link :to="{ name: 'orders' }" class="stat-link">ver mis pedidos</router-link>
                    </div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-card">
                    <div class="stat-icon-circle"><i class="fa-solid fa-cart-shopping"></i></div>
                    <div class="stat-text">
                        <p class="stat-title">Productos Favoritos</p>
                        <h3>7</h3>
                        <a href="#" class="stat-link">ver mis favoritos</a>
                    </div>
                </div>
            </template>
        </div>

        <!--  Business Information Card -->
        <div v-if="isProvider" class="card personal-info-card">
            <div class="card-header">
                <h3>Información del Negocio</h3>
                <button type="button" class="btn-edit" disabled title="Edición de proveedor próximamente">
                    <i class="fa-solid fa-pencil"></i> Editar
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <i class="fa-solid fa-building"></i>
                    <span class="label">Nombre del Negocio</span>
                    <span class="value">{{ providerOrg?.company_name || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-phone"></i>
                    <span class="label">Teléfono del Negocio</span>
                    <span class="value">{{ providerOrg?.phone_number || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-regular fa-id-card"></i>
                    <span class="label">Número RUC</span>
                    <span class="value">{{ providerOrg?.tax_id || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-briefcase"></i>
                    <span class="label">Tipo de Negocio</span>
                    <span class="value capitalize">{{ providerOrg?.kind || "—" }}</span>
                </div>
                <div class="info-item full-width">
                    <i class="fa-solid fa-location-dot"></i>
                    <span class="label">Ubicación</span>
                    <span class="value">{{ providerLocationText }}</span>
                </div>
            </div>
        </div>



        <!-- Personal / Owner Information Card (UNCONDITIONAL) -->
        <div class="card personal-info-card">
            <div class="card-header">
                <h3>{{ isProvider ? 'Información del Propietario' : 'Información Personal' }}</h3>
                <button type="button" class="btn-edit" @click="openEditProfile">
                    <i class="fa-solid fa-pencil"></i> Editar
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <i class="fa-solid fa-user"></i>
                    <span class="label">Nombres</span>
                    <span class="value">{{ userProfile?.first_name || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-phone"></i>
                    <span class="label">Teléfono</span>
                    <span class="value">{{ (userProfile as any)?.phone_number || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-user"></i>
                    <span class="label">Apellidos</span>
                    <span class="value">{{ userProfile?.last_name || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-regular fa-id-card"></i>
                    <span class="label">Cédula</span>
                    <span class="value">{{ (userProfile as any)?.national_id || "—" }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-regular fa-envelope"></i>
                    <span class="label">Correo electrónico</span>
                    <span class="value link">{{ displayEmail }}</span>
                </div>
                <div class="info-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span class="label">Municipio</span>
                    <span class="value">{{ municipalityName }}</span>
                </div>
            </div>
        </div>

                <!-- Edit Profile Modal (Edits the User/Owner Account) -->
        <BaseModal v-model="showEditProfileModal" max-width="620px" :show-close-button="false" @close="showEditProfileModal = false">
            <template #header>
                <div class="modal-nav-header">
                    <button class="btn-back-nav" @click="showEditProfileModal = false"><i class="fa-solid fa-arrow-left"></i></button>
                    <h3 class="modal-heading">Editar {{ isProvider ? 'Información del Propietario' : 'Información Personal' }}</h3>
                    <div style="width: 30px"></div>
                </div>
            </template>
            <div class="edit-photo-section">
                <div class="edit-photo-preview">
                    <ProfileAvatar :blob-id="avatarBlobId" :alt="displayName" />
                </div>
                <div class="edit-photo-info">
                    <p class="edit-photo-label">Foto de Perfil</p>
                    <p class="edit-photo-formats">JPG, PNG. Máx. 3MB.</p>
                    <button type="button" class="btn-change-photo" @click="() => { showEditProfileModal = false; avatarEditorRef?.openEditor('choice'); }">
                        <i class="fa-solid fa-rotate"></i> Cambiar Foto
                    </button>
                </div>
            </div>
            <form @submit.prevent="handleSaveProfile" class="edit-form-grid">
                <div class="edit-form-group">
                    <label>Nombres</label>
                    <div :class="['input-with-icon', { error: !!editErrors.firstName }]">
                        <i class="fa-solid fa-user"></i>
                        <input v-model="editForm.firstName" type="text" placeholder="Nombres" maxlength="50" required />
                    </div>
                    <span v-if="editErrors.firstName" class="field-error">{{ editErrors.firstName }}</span>
                </div>
                <div class="edit-form-group">
                    <label>Apellidos</label>
                    <div :class="['input-with-icon', { error: !!editErrors.lastName }]">
                        <i class="fa-solid fa-user"></i>
                        <input v-model="editForm.lastName" type="text" placeholder="Apellidos" maxlength="50" required />
                    </div>
                    <span v-if="editErrors.lastName" class="field-error">{{ editErrors.lastName }}</span>
                </div>
                <div class="edit-form-group">
                    <label>Teléfono</label>
                    <div :class="['input-with-icon', { error: !!editErrors.phoneNumber }]">
                        <i class="fa-solid fa-phone"></i>
                        <input v-model="editForm.phoneNumber" type="tel" placeholder="Teléfono" maxlength="15" />
                    </div>
                    <span v-if="editErrors.phoneNumber" class="field-error">{{ editErrors.phoneNumber }}</span>
                </div>
                <div class="edit-form-group">
                    <label>Cédula</label>
                    <div class="input-with-icon">
                        <i class="fa-regular fa-id-card"></i>
                        <input v-model="editForm.nationalId" type="text" placeholder="Cédula" maxlength="20" />
                    </div>
                </div>
                <div class="edit-form-group full-width">
                    <label>Municipio</label>
                    <div class="input-with-icon select-wrapper">
                        <i class="fa-solid fa-location-dot"></i>
                        <select v-model="editForm.municipalityId">
                            <option value="">Seleccione su municipio</option>
                            <optgroup v-for="dept in departments" :key="dept.id" :label="dept.name">
                                <option v-for="mun in dept.municipalities" :key="mun.id" :value="mun.id">{{ mun.name }}</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="edit-form-actions full-width">
                    <button type="button" class="btn-cancel-edit" :disabled="isSavingProfile" @click="showEditProfileModal = false">Cancelar</button>
                    <button type="submit" class="btn-save-edit" :disabled="isSavingProfile">
                        <i :class="isSavingProfile ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
                        {{ isSavingProfile ? "Guardando..." : "Actualizar" }}
                    </button>
                </div>
            </form>
        </BaseModal>
    </div>
</template>

<style scoped>
/* Base Layout & Cards */
.profile-container { display: flex; flex-direction: column; gap: 2rem; }
.card { background: #ffffff; border: 1px solid var(--border-gray); border-radius: 16px; padding: 2.2rem; box-shadow: var(--shadow-sm); }
.profile-card { display: flex; flex-direction: row; align-items: center; justify-content: center; text-align: left; gap: 2.5rem; }

/* Profile Info */
.profile-info { flex: 0 1 auto; min-width: 0; }
.profile-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
.profile-header h2 { font-size: 1.75rem; color: var(--primary-blue); }
.badge { background-color: #d8f1ef; color: var(--primary-blue); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; }
.description { color: #64748b; margin-bottom: 1rem; font-size: 0.95rem; }
.contact-meta p { color: #64748b; display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; margin-bottom: 0.4rem; }

/* Stats */
.stats-cards { display: flex; background: #ffffff; border: 1px solid var(--border-gray); border-radius: 16px; box-shadow: var(--shadow-sm); padding: 2rem; align-items: center; }
.stat-card { flex: 1; display: flex; align-items: center; gap: 1.5rem; justify-content: center; }
.stat-divider { width: 1px; height: 70px; background-color: var(--border-gray); }
.stat-icon-circle { width: 65px; height: 65px; background-color: #d8f1ef; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: var(--primary-blue); font-size: 1.6rem; }
.stat-icon-circle.orange-bg { background-color: #fde8db; color: #ff6a00; }
.stat-text .stat-title { font-weight: 600; font-size: 0.95rem; color: var(--primary-blue); }
.stat-text h3 { font-size: 1.8rem; color: var(--primary-blue); font-family: "Inter", sans-serif; }
.stat-link { color: var(--light-teal); text-decoration: none; font-size: 0.88rem; font-weight: 600; }
.stat-rating-row { display: flex; align-items: center; gap: 0.6rem; }
.stars-list { display: flex; gap: 0.2rem; font-size: 0.9rem; }
.star-filled { color: #ffb400; }
.star-empty { color: #e0e0e0; }

/* Info Grids */
.personal-info-card .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; }
.personal-info-card h3 { font-size: 1.4rem; color: var(--primary-blue); }
.btn-edit { background-color: #d8f1ef; color: var(--primary-blue); border: none; padding: 0.5rem 1.25rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
.btn-edit:disabled { opacity: 0.6; cursor: not-allowed; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.info-item { display: flex; align-items: center; gap: 0.8rem; }
.info-item.full-width { grid-column: 1 / -1; }
.info-item i { color: var(--primary-blue); font-size: 1.1rem; width: 20px; text-align: center; }
.info-item .label { width: 140px; font-weight: 600; color: var(--primary-blue); font-size: 0.92rem; }
.info-item .value { color: var(--text-dark); font-weight: 500; font-size: 0.95rem; }
.info-item .value.link { color: var(--light-teal); }
.capitalize { text-transform: capitalize; }

/* Edit Profile Modal */
.modal-nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-heading { font-size: 1.3rem; color: var(--primary-blue); }
.btn-back-nav { background: none; border: none; font-size: 1.2rem; color: var(--primary-blue); cursor: pointer; }
.edit-photo-section { display: flex; align-items: center; gap: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-gray); margin-bottom: 1.5rem; }
.edit-photo-preview { width: 75px; height: 75px; border-radius: 50%; overflow: hidden; font-size: 2.2rem; flex-shrink: 0; }
.edit-photo-label { font-weight: 700; font-size: 0.95rem; }
.edit-photo-formats { font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; }
.btn-change-photo { background: #ffffff; border: 1px solid var(--border-gray); padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.85rem; cursor: pointer; font-weight: 600; color: var(--text-dark); }
.edit-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.edit-form-group.full-width { grid-column: 1 / -1; }
.edit-form-group label { display: block; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.4rem; }
.input-with-icon { display: flex; align-items: center; gap: 0.6rem; border: 1px solid var(--border-gray); border-radius: 8px; padding: 0.65rem 0.9rem; background: #ffffff; }
.input-with-icon.error { border-color: #ef4444; }
.input-with-icon input, .input-with-icon select { border: none; outline: none; width: 100%; font-size: 0.92rem; background: transparent; }
.field-error { color: #ef4444; font-size: 0.78rem; margin-top: 0.2rem; }
.edit-form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn-cancel-edit { background: var(--primary-orange); color: #ffffff; border: none; padding: 0.65rem 1.8rem; border-radius: 25px; font-weight: 600; cursor: pointer; }
.btn-save-edit { background: var(--light-teal); color: #ffffff; border: none; padding: 0.65rem 1.8rem; border-radius: 25px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }

/* Responsive */
@media (max-width: 768px) {
    .profile-card { flex-direction: column; text-align: center; }
    .profile-header, .contact-meta p { justify-content: center; }
    .stats-cards { flex-direction: column; gap: 1.5rem; }
    .stat-divider { display: none; }
    .info-grid { grid-template-columns: 1fr; }
    .edit-form-grid { grid-template-columns: 1fr; }
}
</style>
