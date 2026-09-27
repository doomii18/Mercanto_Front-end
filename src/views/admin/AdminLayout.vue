<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";
import AppLogo from "@/components/common/AppLogo.vue";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";

const router = useRouter();
const authStore = useAuthStore();
const userContext = useUserContextStore();

const isMobileMenuOpen = ref(false);

const navItems = [
  { name: "admin-inicio", label: "Inicio", icon: "fa-solid fa-house" },
  { name: "admin-pagos", label: "Pagos/Recargas", icon: "fa-solid fa-wallet" },
  { name: "admin-usuarios", label: "Usuarios", icon: "fa-solid fa-user-group" },
  { name: "admin-pedidos", label: "Pedidos", icon: "fa-solid fa-cart-shopping" },
  { name: "admin-reportes", label: "Reportes", icon: "fa-solid fa-chart-simple" },
  { name: "admin-notificaciones", label: "Notificaciones", icon: "fa-solid fa-bell" },
  { name: "admin-configuracion", label: "Configuración", icon: "fa-solid fa-gear" },
];

const avatarBlobId = computed(() => userContext.userProfile?.avatar_blob_id ?? null);
const displayName = computed(() => userContext.displayName);
const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    admin: "Administrador",
    auditor: "Auditor",
    member: "Miembro",
  };
  return labels[authStore.accountRole ?? ""] ?? "Usuario";
});

onMounted(async () => {
  if (!userContext.isInitialized && authStore.isAuthenticated) {
    try {
      await userContext.initialize();
    } catch {
      // Profile data is non-critical for the layout chrome
    }
  }
});

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: "login" });
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-[#f4f7f9] text-slate-800">
    <!-- Mobile Backdrop -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
      @click="closeMobileMenu"
    ></div>

    <!-- Sidebar (Desktop & Mobile Drawer) -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#023859] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      ]"
    >
      <!-- Logo Header -->
      <div class="flex h-20 items-center justify-between px-6 pt-3">
        <div class="flex flex-col items-start">
          <AppLogo variant="logo" class="h-9 shrink-0 brightness-110" />
          <span class="text-[11px] font-semibold text-slate-300 block pl-1 -mt-0.5">Panel Admin</span>
        </div>

        <!-- Close button on mobile -->
        <button
          @click="closeMobileMenu"
          class="lg:hidden text-slate-300 hover:text-white p-1"
          aria-label="Cerrar menú"
        >
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex flex-col gap-1.5 px-4 mt-6 flex-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          @click="closeMobileMenu"
          exact-active-class="!bg-[#00a896] !text-white font-semibold shadow-md shadow-[#00a896]/20"
          class="group flex items-center gap-3.5 rounded-xl px-4 py-3 text-slate-300 transition-all duration-150 hover:bg-white/10 hover:text-white"
        >
          <i :class="[item.icon, 'w-5 text-center text-base shrink-0']"></i>
          <span class="text-sm font-medium tracking-wide">
            {{ item.label }}
          </span>
        </router-link>
      </nav>

      <!-- Bottom Profile Card -->
      <div class="border-t border-white/10 p-4 m-2">
        <div class="flex items-center gap-3 rounded-xl p-2 bg-white/5 border border-white/10">
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#00a896]">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="displayName" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-xs font-bold truncate">{{ displayName }}</p>
            <p class="text-slate-300 text-[11px] truncate">{{ roleLabel }}</p>
          </div>
          <button
            @click="handleLogout"
            class="text-slate-300 hover:text-red-300 transition-colors p-1.5 shrink-0"
            title="Cerrar sesión"
          >
            <i class="fa-solid fa-right-from-bracket text-sm"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main View Area -->
    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <!-- Mobile Top Bar -->
      <header class="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden shrink-0">
        <div class="flex items-center gap-3">
          <button
            @click="isMobileMenuOpen = true"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#023859] hover:bg-slate-200 transition-colors"
            aria-label="Abrir menú"
          >
            <i class="fa-solid fa-bars text-lg"></i>
          </button>
          <div class="flex items-center gap-2">
            <AppLogo variant="logo" class="h-8 shrink-0" />
            <span class="text-xs font-semibold text-slate-500 block">Admin</span>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          <i class="fa-solid fa-right-from-bracket text-xs"></i>
          <span class="hidden sm:inline">Salir</span>
        </button>
      </header>

      <!-- View Container -->
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
