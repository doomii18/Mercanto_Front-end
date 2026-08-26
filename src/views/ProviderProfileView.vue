<script setup lang="ts">
import { ref, onMounted } from "vue";
import echLogoImg from "../assets/ech-logo.png";
import logoImg from "../assets/logo.png";

const STORAGE_KEY_INFO = "mercanto_provider_info";
const STORAGE_KEY_LOGO = "mercanto_provider_logo";

const currentView = ref<"profile" | "edit">("profile");
const isAvatarDropdownOpen = ref(false);
const showViewPhotoModal = ref(false);

const providerData = ref({
  bio: "Ofrecemos a las familias productos de la más alta calidad y prestamos un servicio al cliente destacado por su eficiencia, amabilidad y cortesía.",
  ruc: "J0310000664348",
  negocioName: "E. Chamorro Industrial S.A",
  tipoNegocio: "Industria manufacturera",
  telNegocio: "8730 9208",
  direccion: "Calle La Inmaculada en la ciudad de Granada, Nicaragua.",
  cedulaProp: "401-230900-5001F",
  nombreProp: "Ernesto Chamorro",
  correoProp: "echamorro@gmail.com",
  telProp: "8790 - 6723",
});

const editForm = ref({ ...providerData.value });
const avatarSrc = ref(echLogoImg);

const loadData = () => {
  const savedInfo = localStorage.getItem(STORAGE_KEY_INFO);
  if (savedInfo) {
    try {
      providerData.value = { ...providerData.value, ...JSON.parse(savedInfo) };
    } catch (e) {
      console.error(e);
    }
  }
  const savedLogo = localStorage.getItem(STORAGE_KEY_LOGO);
  if (savedLogo) {
    avatarSrc.value = savedLogo;
  }
};

onMounted(() => {
  loadData();
});

const openEditView = () => {
  editForm.value = { ...providerData.value };
  currentView.value = "edit";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const saveEditView = () => {
  providerData.value = { ...editForm.value };
  localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(providerData.value));
  currentView.value = "profile";
};

const handleLogoFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;
  const file = target.files[0];

  const reader = new FileReader();
  reader.onload = (evt) => {
    if (typeof evt.target?.result === "string") {
      avatarSrc.value = evt.target.result;
      localStorage.setItem(STORAGE_KEY_LOGO, evt.target.result);
    }
  };
  reader.readAsDataURL(file);
};

const deleteLogo = () => {
  isAvatarDropdownOpen.value = false;
  localStorage.removeItem(STORAGE_KEY_LOGO);
  avatarSrc.value = echLogoImg;
};
</script>

<template>
  <div class="provider-dashboard-shell">
    <header class="header">
      <div class="header-left">
        <router-link :to="{ name: 'home' }" class="logo">
          <img :src="logoImg" alt="Mercanto" style="height: 45px" />
        </router-link>
      </div>
      <router-link :to="{ name: 'home' }" class="header-home-btn" aria-label="Inicio">
        <i class="fa-solid fa-house"></i>
      </router-link>
    </header>

    <div class="dashboard-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <nav class="sidebar-menu">
          <a href="#" class="menu-item active">
            <i class="fa-regular fa-circle-user"></i> Mi Perfil
          </a>
          <a href="#" class="menu-item">
            <i class="fa-solid fa-bag-shopping"></i> Mis Productos
          </a>
          <router-link :to="{ name: 'orders' }" class="menu-item">
            <i class="fa-solid fa-cart-shopping"></i> Pedidos
          </router-link>
          <a href="#" class="menu-item">
            <i class="fa-regular fa-comment-dots"></i> Mensajes
          </a>
          <a href="#" class="menu-item">
            <i class="fa-solid fa-gear"></i> Configuración
          </a>
          <a href="#" class="menu-item">
            <i class="fa-regular fa-circle-question"></i> Ayuda
          </a>
        </nav>
        <router-link :to="{ name: 'home' }" class="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
        </router-link>
      </aside>

      <!-- Main Layout -->
      <main class="content provider-content-layout">
        <!-- VISTA 1: Perfil General -->
        <div v-if="currentView === 'profile'" class="view-profile-wrapper">
          <!-- CARD 1: Hero Profile -->
          <div class="card provider-hero-card">
            <div class="provider-avatar-wrapper">
              <div class="provider-avatar-circle">
                <img :src="avatarSrc" :alt="providerData.negocioName" />
              </div>
              <button
                type="button"
                class="btn-avatar-camera"
                aria-label="Cambiar logo"
                @click="isAvatarDropdownOpen = !isAvatarDropdownOpen"
              >
                <i class="fa-solid fa-camera"></i>
              </button>

              <div v-if="isAvatarDropdownOpen" class="avatar-dropdown">
                <button
                  type="button"
                  class="dropdown-item"
                  @click="() => { isAvatarDropdownOpen = false; showViewPhotoModal = true; }"
                >
                  <i class="fa-regular fa-image"></i> Ver logo
                </button>
                <label class="dropdown-item">
                  <i class="fa-solid fa-upload"></i> Subir nuevo logo
                  <input type="file" accept="image/png, image/jpeg" style="display: none;" @change="handleLogoFileChange" />
                </label>
                <button type="button" class="dropdown-item delete-item" @click="deleteLogo">
                  <i class="fa-regular fa-trash-can"></i> Eliminar logo
                </button>
              </div>
            </div>

            <div class="provider-hero-info">
              <div class="provider-name-badge-row">
                <h2 class="provider-business-name">{{ providerData.negocioName }}</h2>
                <span class="provider-role-badge">
                  <i class="fa-solid fa-store"></i> Proveedor
                </span>
              </div>
              <p class="provider-bio-text">{{ providerData.bio }}</p>
              <div class="provider-meta-row">
                <div class="meta-item">
                  <i class="fa-regular fa-envelope"></i>
                  <span>{{ providerData.correoProp }}</span>
                </div>
                <div class="meta-item">
                  <i class="fa-regular fa-calendar-days"></i>
                  <span>Miembro desde junio 2026</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 2: Stats -->
          <div class="card provider-stats-card">
            <div class="stat-col">
              <div class="stat-icon-circle teal-bg">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
              <div class="stat-info">
                <span class="stat-title">Productos Publicados</span>
                <strong class="stat-number">23</strong>
                <a href="#" class="stat-link">Ver mis productos</a>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-col">
              <div class="stat-icon-circle teal-bg">
                <i class="fa-solid fa-cart-shopping"></i>
              </div>
              <div class="stat-info">
                <span class="stat-title">Pedidos Recibidos</span>
                <strong class="stat-number">57</strong>
                <router-link :to="{ name: 'orders' }" class="stat-link">Ver mis pedidos</router-link>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-col">
              <div class="stat-icon-circle orange-bg">
                <i class="fa-regular fa-star"></i>
              </div>
              <div class="stat-info">
                <span class="stat-title">Calificación Promedio</span>
                <div class="stat-rating-row">
                  <strong class="stat-number">4.8</strong>
                  <div class="stars-list">
                    <i class="fa-solid fa-star star-filled"></i>
                    <i class="fa-solid fa-star star-filled"></i>
                    <i class="fa-solid fa-star star-filled"></i>
                    <i class="fa-solid fa-star star-filled"></i>
                    <i class="fa-regular fa-star star-empty"></i>
                  </div>
                </div>
                <a href="#" class="stat-link">Ver opiniones</a>
              </div>
            </div>
          </div>

          <!-- CARD 3: Details -->
          <div class="card provider-details-card">
            <div class="info-section-header">
              <h3 class="section-heading-title">Información del Negocio</h3>
              <button type="button" class="btn-edit-pill" @click="openEditView">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
            </div>

            <div class="info-data-grid">
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-regular fa-id-card info-icon"></i>
                  <span class="info-label">Número RUC</span>
                </div>
                <span class="info-value">{{ providerData.ruc }}</span>
              </div>
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-regular fa-building info-icon"></i>
                  <span class="info-label">Negocio</span>
                </div>
                <span class="info-value">{{ providerData.negocioName }}</span>
              </div>
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-solid fa-user info-icon"></i>
                  <span class="info-label">Tipo de Negocio</span>
                </div>
                <span class="info-value">{{ providerData.tipoNegocio }}</span>
              </div>
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-solid fa-phone info-icon"></i>
                  <span class="info-label">Teléfono</span>
                </div>
                <span class="info-value">{{ providerData.telNegocio }}</span>
              </div>
              <div class="info-data-item full-width-row">
                <div class="icon-label-group">
                  <i class="fa-solid fa-location-dot info-icon"></i>
                  <span class="info-label">Dirección</span>
                </div>
                <span class="info-value">{{ providerData.direccion }}</span>
              </div>
            </div>

            <div class="card-inner-divider"></div>

            <div class="info-section-header">
              <h3 class="section-heading-title">Información del Propietario</h3>
            </div>

            <div class="info-data-grid">
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-regular fa-id-card info-icon"></i>
                  <span class="info-label">Cédula de Identidad</span>
                </div>
                <span class="info-value">{{ providerData.cedulaProp }}</span>
              </div>
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-solid fa-user info-icon"></i>
                  <span class="info-label">Propietario</span>
                </div>
                <span class="info-value">{{ providerData.nombreProp }}</span>
              </div>
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-regular fa-envelope info-icon"></i>
                  <span class="info-label">Correo electrónico</span>
                </div>
                <span class="info-value">{{ providerData.correoProp }}</span>
              </div>
              <div class="info-data-item">
                <div class="icon-label-group">
                  <i class="fa-solid fa-phone info-icon"></i>
                  <span class="info-label">Teléfono</span>
                </div>
                <span class="info-value">{{ providerData.telProp }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- VISTA 2: Edición Inline -->
        <div v-else class="edit-inline-view">
          <div class="card edit-inline-card">
            <div class="edit-inline-header">
              <button type="button" class="btn-edit-back" @click="currentView = 'profile'">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <h2 class="edit-inline-title">Editar Información General</h2>
            </div>

            <div class="edit-inline-divider"></div>

            <!-- Logo Section -->
            <div class="edit-photo-section">
              <div class="edit-photo-preview">
                <img :src="avatarSrc" alt="Logo" />
              </div>
              <div class="edit-photo-meta">
                <span class="edit-photo-label">Foto de Perfil</span>
                <span class="edit-photo-formats">JPG, PNG. Máx. 3MB.</span>
                <label class="btn-change-photo-inline">
                  <i class="fa-solid fa-rotate"></i> Cambiar Foto
                  <input type="file" accept="image/png, image/jpeg" style="display: none;" @change="handleLogoFileChange" />
                </label>
              </div>
            </div>

            <div class="edit-inline-divider"></div>

            <!-- Business Form -->
            <h3 class="edit-section-title">Información del Negocio</h3>
            <div class="edit-inline-divider thin"></div>

            <div class="edit-fields-grid">
              <div class="edit-field-group">
                <label class="edit-field-label">Número RUC</label>
                <div class="edit-input-wrap locked">
                  <i class="fa-regular fa-id-card edit-input-icon"></i>
                  <input v-model="editForm.ruc" type="text" class="edit-input locked-input" disabled />
                </div>
              </div>

              <div class="edit-field-group">
                <label class="edit-field-label">Negocio</label>
                <div class="edit-input-wrap">
                  <i class="fa-solid fa-user edit-input-icon"></i>
                  <input v-model="editForm.negocioName" type="text" class="edit-input" />
                </div>
              </div>

              <div class="edit-field-group">
                <label class="edit-field-label">Tipo de Negocio</label>
                <div class="edit-input-wrap">
                  <i class="fa-solid fa-user edit-input-icon"></i>
                  <input v-model="editForm.tipoNegocio" type="text" class="edit-input" />
                </div>
              </div>

              <div class="edit-field-group">
                <label class="edit-field-label">Teléfono</label>
                <div class="edit-input-wrap">
                  <i class="fa-solid fa-phone edit-input-icon"></i>
                  <input v-model="editForm.telNegocio" type="tel" class="edit-input" />
                </div>
              </div>

              <div class="edit-field-group full-col">
                <label class="edit-field-label">Dirección</label>
                <div class="edit-input-wrap">
                  <i class="fa-solid fa-location-dot edit-input-icon"></i>
                  <input v-model="editForm.direccion" type="text" class="edit-input" />
                </div>
              </div>
            </div>

            <!-- Owner Form -->
            <h3 class="edit-section-title" style="margin-top: 2rem;">Información del Propietario</h3>
            <div class="edit-inline-divider thin"></div>

            <div class="edit-fields-grid">
              <div class="edit-field-group">
                <label class="edit-field-label">Cédula de Identidad</label>
                <div class="edit-input-wrap locked">
                  <i class="fa-regular fa-id-card edit-input-icon"></i>
                  <input v-model="editForm.cedulaProp" type="text" class="edit-input locked-input" disabled />
                </div>
              </div>

              <div class="edit-field-group">
                <label class="edit-field-label">Nombre del Propietario</label>
                <div class="edit-input-wrap">
                  <i class="fa-solid fa-user edit-input-icon"></i>
                  <input v-model="editForm.nombreProp" type="text" class="edit-input" />
                </div>
              </div>

              <div class="edit-field-group">
                <label class="edit-field-label">Correo electrónico</label>
                <div class="edit-input-wrap">
                  <i class="fa-regular fa-envelope edit-input-icon"></i>
                  <input v-model="editForm.correoProp" type="email" class="edit-input" />
                </div>
              </div>

              <div class="edit-field-group">
                <label class="edit-field-label">Teléfono</label>
                <div class="edit-input-wrap">
                  <i class="fa-solid fa-phone edit-input-icon"></i>
                  <input v-model="editForm.telProp" type="tel" class="edit-input" />
                </div>
              </div>
            </div>

            <div class="edit-inline-actions">
              <button type="button" class="btn-inline-cancel" @click="currentView = 'profile'">Cancelar</button>
              <button type="button" class="btn-inline-save" @click="saveEditView">
                <i class="fa-solid fa-check"></i> Actualizar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- View Logo Modal -->
    <div v-if="showViewPhotoModal" class="modal-overlay" @click.self="showViewPhotoModal = false">
      <div class="modal-content view-photo-modal-content">
        <button type="button" class="btn-close-modal" @click="showViewPhotoModal = false">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="view-photo-container">
          <img :src="avatarSrc" alt="Logo de Proveedor" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.provider-dashboard-shell {
  min-height: 100vh;
  background-color: #f5f7f9;
}

.header {
  background-color: #ffffff;
  padding: 1rem 2.5rem;
  border-bottom: 1px solid #dcdcdc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  z-index: 100;
}

.header-home-btn {
  font-size: 1.4rem;
  color: #083c5a;
  text-decoration: none;
}

.dashboard-container {
  display: flex;
  margin-top: 70px;
  min-height: calc(100vh - 70px);
}

.sidebar {
  width: 280px;
  background-color: #f5f7f9;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #dcdcdc;
  position: fixed;
  top: 70px;
  bottom: 0;
  left: 0;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.25rem;
  text-decoration: none;
  color: #083c5a;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 12px;
}

.menu-item.active {
  background-color: #e2e8f0;
  color: #00a896;
}

.logout {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.5rem 2rem;
  color: #083c5a;
  text-decoration: none;
  font-weight: 600;
}

.provider-content-layout {
  flex: 1;
  margin-left: 280px;
  padding: 2.5rem 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.view-profile-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background: #ffffff;
  border: 1.5px solid #dcdcdc;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.provider-hero-card {
  padding: 2.5rem 3rem;
  display: flex;
  align-items: center;
  gap: 3.5rem;
}

.provider-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.provider-avatar-circle {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  border: 3px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 10px;
  background: #ffffff;
}

.provider-avatar-circle img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.btn-avatar-camera {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: #083c5a;
  color: #ffffff;
  border: 2.5px solid #ffffff;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
}

.avatar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  min-width: 180px;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #083c5a;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
}

.dropdown-item:hover {
  background: #f0f2f5;
}

.dropdown-item.delete-item {
  color: #ef4444;
}

.provider-hero-info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.provider-name-badge-row {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}

.provider-business-name {
  font-size: 1.85rem;
  color: #083c5a;
  font-weight: 700;
}

.provider-role-badge {
  background-color: #c9e8e5;
  color: #00a896;
  padding: 0.35rem 1.1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.provider-bio-text {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 650px;
}

.provider-meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #666;
  font-size: 0.95rem;
}

.provider-stats-card {
  padding: 1.8rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.4rem;
}

.stat-divider {
  width: 1px;
  height: 60px;
  background-color: #e0e0e0;
  margin: 0 1.5rem;
}

.stat-icon-circle {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.stat-icon-circle.teal-bg {
  background-color: #d6f2ef;
  color: #00a896;
}

.stat-icon-circle.orange-bg {
  background-color: #fde8db;
  color: #ff6a00;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-title {
  font-size: 0.95rem;
  color: #083c5a;
  font-weight: 700;
}

.stat-number {
  font-size: 1.6rem;
  color: #083c5a;
  font-weight: 700;
}

.stat-rating-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.stars-list {
  display: flex;
  gap: 0.2rem;
  font-size: 0.9rem;
}

.star-filled {
  color: #ffb400;
}

.star-empty {
  color: #e0e0e0;
}

.stat-link {
  color: #00a896;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
}

.provider-details-card {
  padding: 2.5rem 3rem;
}

.info-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-heading-title {
  font-size: 1.4rem;
  color: #083c5a;
  font-weight: 700;
}

.btn-edit-pill {
  background-color: #c9e8e5;
  color: #00a896;
  border: none;
  padding: 0.4rem 1.2rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.info-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 1.8rem;
  column-gap: 3.5rem;
}

.info-data-item {
  display: grid;
  grid-template-columns: 190px 1fr;
  align-items: center;
  gap: 1rem;
}

.info-data-item.full-width-row {
  grid-column: 1 / -1;
}

.icon-label-group {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.info-icon {
  color: #083c5a;
  font-size: 1.25rem;
  width: 22px;
}

.info-label {
  color: #083c5a;
  font-weight: 700;
  font-size: 0.95rem;
}

.info-value {
  color: #083c5a;
  font-size: 0.95rem;
  font-weight: 500;
}

.card-inner-divider {
  height: 1px;
  background-color: #e6e6e6;
  margin: 2.5rem 0 2rem 0;
}

/* Edit View */
.edit-inline-card {
  padding: 2.5rem 3rem 2rem 3rem;
}

.edit-inline-header {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 0.5rem;
}

.btn-edit-back {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  color: #083c5a;
}

.edit-inline-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #083c5a;
}

.edit-inline-divider {
  height: 1.5px;
  background-color: #e6e6e6;
  margin: 1.5rem 0;
}

.edit-inline-divider.thin {
  height: 1px;
  margin: 0.8rem 0 1.5rem 0;
}

.edit-photo-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 0.5rem 0;
}

.edit-photo-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 6px;
}

.edit-photo-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.btn-change-photo-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #c9e8e5;
  color: #00a896;
  border-radius: 20px;
  padding: 0.45rem 1.1rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.3rem;
  width: fit-content;
}

.edit-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 2.5rem;
}

.edit-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-field-group.full-col {
  grid-column: 1 / -1;
}

.edit-field-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #083c5a;
}

.edit-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border: 1.5px solid #d0d0d0;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  background: #ffffff;
}

.edit-input-wrap.locked {
  background: #eff0f2;
}

.edit-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #083c5a;
  width: 100%;
}

.edit-inline-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1.2rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1.5px solid #e6e6e6;
}

.btn-inline-cancel {
  background: #ff6a00;
  color: #ffffff;
  border: none;
  padding: 0.75rem 2.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-inline-save {
  background: #00a896;
  color: #ffffff;
  border: none;
  padding: 0.75rem 2.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal View Logo */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  max-width: 440px;
  width: 90%;
}

.btn-close-modal {
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #083c5a;
  cursor: pointer;
}

.view-photo-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.view-photo-container img {
  max-width: 240px;
  max-height: 240px;
  object-fit: contain;
}

@media (max-width: 1024px) {
  .provider-content-layout {
    margin-left: 0;
    padding: 2rem;
  }
  .sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .provider-hero-card {
    flex-direction: column;
    text-align: center;
  }
  .provider-name-badge-row,
  .provider-meta-row {
    justify-content: center;
  }
  .provider-stats-card {
    flex-direction: column;
    gap: 1.5rem;
  }
  .stat-divider {
    display: none;
  }
  .info-data-grid,
  .edit-fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
