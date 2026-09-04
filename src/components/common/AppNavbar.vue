<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth";
import { userProfileApi } from "@/api";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import AppLogo from "./AppLogo.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isMenuOpen = ref(false);
const avatarBlobId = ref<string | null>(null);
const userFullName = ref<string>("");
const isProfileLoading = ref(true);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleLogout = async () => {
  closeMenu();
  await authStore.logout();
  router.push({ name: "login" });
};

const fetchUserProfile = async () => {
  if (!authStore.isAuthenticated) {
    avatarBlobId.value = null;
    userFullName.value = "";
    isProfileLoading.value = false;
    return;
  }

  isProfileLoading.value = true;
  try {
    const profile = await userProfileApi.getMyProfile();
    avatarBlobId.value = profile.avatar_blob_id ?? null;
    userFullName.value = `${profile.first_name} ${profile.last_name}`;
  } catch (err) {
    console.warn("Failed to load navbar user profile:", err);
  } finally {
    isProfileLoading.value = false;
  }
};

onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }
  await fetchUserProfile();
});

watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      await fetchUserProfile();
    } else {
      avatarBlobId.value = null;
      userFullName.value = "";
      isProfileLoading.value = false;
    }
  }
);

const isHomeActive = computed(() => route.name === "home" && !route.hash);
const isCategoryActive = computed(() => route.name === "category");
const isOrdersActive = computed(() => route.name === "orders");

const roleLabel = computed(() => {
  const role = authStore.accountRole;
  if (!role) return "Usuario";
  const map: Record<string, string> = {
    member: "Miembro",
    admin: "Admin",
    auditor: "Auditor",
  };
  return map[role] ?? role;
});

const profileRoute = computed(() => {
  return authStore.accountRole === "member" ? "profile" : "provider-profile";
});
</script>

<template>
  <header class="navbar-header">
    <div class="navbar-container">
        <AppLogo class="h-10 md:h-12" @click="closeMenu" />

      <button
        type="button"
        class="mobile-menu-btn"
        aria-label="Alternar navegación"
        @click="toggleMenu"
      >
        <i :class="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
      </button>

      <nav :class="['nav-links', { open: isMenuOpen }]">
        <router-link
          :to="{ name: 'home' }"
          :class="['nav-btn', { 'nav-btn-active': isHomeActive }]"
          exact-active-class=""
          active-class=""
          @click="closeMenu"
        >
          Inicio
        </router-link>

        <router-link
          :to="{ name: 'category' }"
          :class="['nav-btn', { 'nav-btn-active': isCategoryActive }]"
          exact-active-class=""
          active-class=""
          @click="closeMenu"
        >
          Categorías
        </router-link>

        <router-link
          :to="{ name: 'home', hash: '#proveedores' }"
          class="nav-btn"
          exact-active-class=""
          active-class=""
          @click="closeMenu"
        >
          Proveedores
        </router-link>

        <router-link
          :to="{ name: 'home', hash: '#como-funciona' }"
          class="nav-btn"
          exact-active-class=""
          active-class=""
          @click="closeMenu"
        >
          Cómo funciona
        </router-link>

        <!-- Only visible when user is authenticated -->
        <router-link
          v-if="authStore.isAuthenticated"
          :to="{ name: 'orders' }"
          :class="['nav-btn', { 'nav-btn-active': isOrdersActive }]"
          exact-active-class=""
          active-class=""
          @click="closeMenu"
        >
          Pedidos
        </router-link>
      </nav>

      <div :class="['auth-buttons', { open: isMenuOpen }]">
        <!-- Authenticated State -->
        <template v-if="authStore.isAuthenticated">
          <router-link :to="{ name: profileRoute }" class="user-profile-badge" @click="closeMenu">
            <span class="provider-tag" v-if="authStore.accountRole != 'member'">{{ roleLabel }}</span>

            <!-- Skeleton for Name / Avatar while profile is loading -->
            <template v-if="isProfileLoading">
              <div class="h-4 w-20 animate-pulse rounded bg-slate-200"></div>
              <div class="h-7 w-7 animate-pulse rounded-full bg-slate-200"></div>
            </template>

            <template v-else>
              <span class="user-name" :title="userFullName">{{ userFullName }}</span>
              <div class="h-7 w-7 overflow-hidden rounded-full">
                <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
              </div>
            </template>
          </router-link>

          <button type="button" class="btn-logout" title="Cerrar sesión" @click="handleLogout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </template>

        <!-- Unauthenticated State -->
        <template v-else>
          <router-link :to="{ name: 'login' }" class="login-link" @click="closeMenu">
            Iniciar sesión
          </router-link>
          <router-link :to="{ name: 'register' }" class="btn-primary" @click="closeMenu">
            Registrarse
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  background-color: #fff4ec;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-img {
  height: 42px;
  display: block;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--primary-blue);
  cursor: pointer;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-links a,
.nav-links .nav-btn {
  text-decoration: none;
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1.1rem;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-links a:hover,
.nav-links .nav-btn:hover {
  background-color: #ffebd9;
  color: var(--primary-orange);
  box-shadow: 0 3px 10px rgba(255, 106, 0, 0.15);
  transform: translateY(-1px);
}

.nav-btn-active {
  background-color: #ffd8bd !important;
  color: var(--primary-orange) !important;
  font-weight: 700 !important;
  box-shadow: 0 3px 12px rgba(255, 106, 0, 0.2);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.user-profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.85rem;
  background-color: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 24px;
  text-decoration: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.user-profile-badge:hover {
  border-color: var(--light-teal);
  box-shadow: 0 2px 8px rgba(0, 168, 150, 0.15);
}

.provider-tag {
  background-color: #d8f1ef;
  color: var(--light-teal);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.user-name {
  color: var(--primary-blue);
  font-size: 0.88rem;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-logout {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  transition: color 0.2s ease;
}

.btn-logout:hover {
  color: #ef4444;
}

.login-link {
  text-decoration: none;
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-primary {
  background-color: var(--primary-orange);
  color: #ffffff;
  padding: 0.65rem 1.4rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-orange-hover, #e66000);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .navbar-container {
    flex-wrap: wrap;
  }

  .nav-links {
    display: none;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    margin-top: 0.75rem;
    order: 3;
  }

  .nav-links.open {
    display: flex;
  }

  .auth-buttons {
    display: none;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
    order: 4;
    padding-bottom: 0.5rem;
  }

  .auth-buttons.open {
    display: flex;
  }

  .mobile-menu-btn {
    display: block;
  }
}
</style>
