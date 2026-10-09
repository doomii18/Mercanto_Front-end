<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import AppLogo from "@/components/common/AppLogo.vue";
import AdminUserMenu from "@/components/admin/AdminUserMenu.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const contextStore = useUserContextStore();

const panelTitle = computed(() => (contextStore.isAuditor ? "Panel Auditoría" : "Panel Admin"));
const mobileRoleTitle = computed(() => (contextStore.isAuditor ? "Auditor" : "Admin"));

const isMobileMenuOpen = ref(false);

const navItems = [
  { name: "admin-home", label: "Inicio", icon: "fa-solid fa-house" },
  { name: "admin-payments", label: "Pagos/Recargas", icon: "fa-solid fa-wallet" },
  { name: "admin-providers", label: "Proveedores", icon: "fa-solid fa-store" },
  { name: "admin-users", label: "Usuarios", icon: "fa-solid fa-user-group" },
  { name: "admin-orders", label: "Pedidos", icon: "fa-solid fa-cart-shopping" },
  { name: "admin-reports", label: "Reportes", icon: "fa-solid fa-chart-simple" },
  { name: "admin-notifications", label: "Notificaciones", icon: "fa-solid fa-bell" },
  { name: "admin-settings", label: "Configuración", icon: "fa-solid fa-gear" },
];

function isNavItemActive(itemName: string): boolean {
  if (route.name === itemName) return true;
  if (itemName === "admin-providers" && route.name === "admin-provider-detail") return true;
  if (itemName === "admin-users" && route.name === "admin-user-detail") return true;
  if (itemName === "admin-payments" && (route.name === "admin-payment-detail" || route.name === "admin-transactions")) return true;
  return false;
}

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
          <AppLogo variant="imagotipo" class="h-9 shrink-0 brightness-110" />
          <span class="text-[11px] font-semibold text-slate-300 block pl-1 -mt-0.5">{{ panelTitle }}</span>
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
          :class="[
            'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-slate-300 transition-all duration-150 hover:bg-white/10 hover:text-white',
            isNavItemActive(item.name)
              ? '!bg-[#00a896] !text-white font-semibold shadow-md shadow-[#00a896]/20'
              : ''
          ]"
        >
          <i :class="[item.icon, 'w-5 text-center text-base shrink-0']"></i>
          <span class="text-sm font-medium tracking-wide">
            {{ item.label }}
          </span>
        </router-link>
      </nav>

      <!-- Bottom User Menu -->
      <div class="border-t border-white/10 p-4 m-2">
        <AdminUserMenu />
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
            <span class="text-xs font-semibold text-slate-500 block">{{ mobileRoleTitle }}</span>
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
