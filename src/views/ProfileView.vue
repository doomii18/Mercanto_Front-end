<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../modules/auth";
import { useUserContextStore } from "../stores/userContextStore";
import { useGeoStore } from "../stores/geo";
import { userProfileApi, organizationApi } from "../api";
import type { OrganizationDetailsDto, PublicProviderDto } from "../api/services/organization/types";
import AvatarEditor from "../components/profile/AvatarEditor.vue";
import EditProfileModal from "../components/profile/EditProfileModal.vue";
import EditProviderModal from "../components/profile/EditProviderModal.vue";
import ProviderStatsCard from "../components/profile/ProviderStatsCard.vue";
import BuyerStatsCards from "@/components/profile/BuyerStatsCards.vue";

const authStore = useAuthStore();
const contextStore = useUserContextStore();
const geoStore = useGeoStore();

const isProvider = computed(() => contextStore.isProvider);
const account = computed(() => authStore.account);

// Alias the context store's profile to maintain template compatibility
const userProfile = computed(() => contextStore.userProfile);

const providerOrg = ref<OrganizationDetailsDto | null>(null);
const providerPublic = ref<PublicProviderDto | null>(null);
const isLoading = ref(true);

// UI State
const showEditProviderModal = ref(false);
const avatarEditorRef = ref<InstanceType<typeof AvatarEditor> | null>(null);
const editProfileModalRef = ref<InstanceType<typeof EditProfileModal> | null>(null);

// --- Computed Properties ---
const displayName = computed(() => {
  if (isProvider.value && providerOrg.value) return providerOrg.value.company_name;
  return contextStore.displayName;
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

// Reads the correct avatar blob depending on the user state
const avatarBlobId = computed<string | null>(() => {
  if (isProvider.value && providerPublic.value) {
    return providerPublic.value.logo_blob_id ?? null;
  }
  // Buyer state: reads directly from the global context store
  return contextStore.userProfile?.avatar_blob_id ?? null;
});

const municipalityName = computed(() => {
  const profile = contextStore.userProfile;
  if (!profile || !("municipality_id" in profile) || !profile.municipality_id) return "—";
  const mun = geoStore.getMunicipalityById(profile.municipality_id);
  return mun ? mun.name : "—";
});

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

// --- Data Loading ---
const loadProfileData = async () => {
  try {
    if (!authStore.isInitialized) await authStore.initialize();
    if (!contextStore.isInitialized) await contextStore.initialize();
    if (!geoStore.isInitialized) await geoStore.initialize();

    // Fetch provider-specific details if applicable
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

// --- Handlers for Provider Modal ---
const handleProviderSaved = (updatedData: any) => {
  if (providerOrg.value) {
    providerOrg.value = {
      ...providerOrg.value,
      company_name: updatedData.negocioName,
      phone_number: updatedData.telNegocio,
    };
  }
  if (providerPublic.value) {
    providerPublic.value = {
      ...providerPublic.value,
      company_name: updatedData.negocioName
    };
  }
};

const handleChangePhotoRequest = () => {
  showEditProviderModal.value = false;
  avatarEditorRef.value?.openEditor('choice');
};

// --- Avatar Editor Callbacks (For direct edits via the camera icon on the profile card) ---
const handleAvatarSave = async (file: File) => {
  try {
    if (isProvider.value) {
      // Mock for provider (Wire up organizationApi.uploadOrganizationLogo when ready)
      alert("Logo de proveedor actualizado (Mock).");
    } else {
      await userProfileApi.changeProfilePicture(file);
      // Refresh profile from API and sync to context store
      const updatedProfile = await userProfileApi.getMyProfile();
      contextStore.updateUserProfile(updatedProfile);
    }
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
      // Refresh profile from API and sync to context store
      const updatedProfile = await userProfileApi.getMyProfile();
      contextStore.updateUserProfile(updatedProfile);
    }
  } catch (err: any) {
    alert(err.message || "Error al eliminar la foto.");
  }
};

onMounted(async () => {
  await loadProfileData();
});
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

    <!-- Stats Cards (Delegated to dedicated components) -->
    <ProviderStatsCard v-if="isProvider" />
    <BuyerStatsCards v-else />

    <!-- Business Information Card (Provider Only) -->
    <div v-if="isProvider" class="card personal-info-card">
      <div class="card-header">
        <h3>Información del Negocio</h3>
        <button type="button" class="btn-edit" @click="showEditProviderModal = true">
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

    <!-- Personal/Owner Information Card -->
    <div class="card personal-info-card">
      <div class="card-header">
        <h3>{{ isProvider ? 'Información del Propietario' : 'Información Personal' }}</h3>
        <!-- Trigger the modal via ref instead of v-model -->
        <button type="button" class="btn-edit" @click="editProfileModalRef?.open()">
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

    <!-- Modals -->
    <EditProfileModal ref="editProfileModalRef" />
    <EditProviderModal
      v-model="showEditProviderModal"
      @saved="handleProviderSaved"
      @change-photo="handleChangePhotoRequest"
    />
  </div>
</template>

<style scoped>
/* Base Layout & Cards */
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

/* Profile Info */
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

/* Info Grids */
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
  transition: background-color 0.2s;
}

.btn-edit:hover {
  background-color: #c0e6e3;
}

.btn-edit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.info-item.full-width {
  grid-column: 1 / -1;
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

.capitalize {
  text-transform: capitalize;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    text-align: center;
  }

  .profile-header, .contact-meta p {
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
