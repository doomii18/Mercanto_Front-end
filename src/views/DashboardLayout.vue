<script setup lang="ts">
import { ref } from "vue";
import { useUserContextStore } from "@/stores/userContextStore";
import AppLogo from "@/components/common/AppLogo.vue";
import UserMenu from "@/components/common/UserMenu.vue";

const contextStore = useUserContextStore();
const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-white text-[#083c5a]">
    <!-- Header: Logo aligned to the right -->
    <header class="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <button
        type="button"
        class="flex h-9 w-9 flex-col items-center justify-center gap-1.25 rounded-lg border-none bg-transparent p-1 transition-colors duration-200 hover:bg-[#fde8e4] focus:outline-none"
        :aria-expanded="sidebarOpen"
        aria-label="Alternar navegación"
        @click="toggleSidebar"
      >
        <span
          class="h-[2.5px] w-[22px] origin-center rounded-sm bg-[#083c5a] transition-all duration-300"
          :class="{ 'translate-y-[7.5px] rotate-45': sidebarOpen }"
        ></span>
        <span
          class="h-[2.5px] w-[22px] origin-center rounded-sm bg-[#083c5a] transition-all duration-300"
          :class="{ 'scale-x-0 opacity-0': sidebarOpen }"
        ></span>
        <span
          class="h-[2.5px] w-[22px] origin-center rounded-sm bg-[#083c5a] transition-all duration-300"
          :class="{ '-translate-y-[7.5px] -rotate-45': sidebarOpen }"
        ></span>
      </button>
      <AppLogo class="h-9" />
    </header>

    <!-- Wrapper: Strictly fits the remaining viewport height -->
    <div class="relative mt-16 flex h-[calc(100vh-64px-60px)] md:h-[calc(100vh-64px)] overflow-hidden">
      <!-- Mobile Backdrop -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/25 backdrop-blur-[1px] lg:hidden"
        @click="closeSidebar"
      ></div>

      <!-- Sidebar -->
      <aside
        :class="[
          'fixed z-40 bg-white transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-[60px] max-md:w-full max-md:border-t max-md:border-slate-200 max-md:shadow-sm',
          'md:top-16 md:bottom-0 md:left-0 md:flex md:flex-col md:justify-between md:border-r md:border-slate-200 md:py-5',
          sidebarOpen
            ? 'md:w-60 md:items-start md:shadow-xl'
            : 'md:w-[72px] md:items-center'
        ]"
      >
        <nav
          :class="[
            'flex',
            'max-md:h-full max-md:w-full max-md:flex-row max-md:items-center max-md:justify-around max-md:px-2',
            'md:w-full md:flex-col md:gap-1.5',
            sidebarOpen ? 'md:px-3' : 'md:px-0'
          ]"
        >
          <!-- Mi Perfil -->
          <router-link
            :to="{ name: 'profile' }"
            exact-active-class="!bg-[#fde8e4] !text-[#ff6a00] font-semibold"
            :class="[
              'group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] hover:text-[#ff6a00]',
              'max-md:h-11 max-md:w-11 max-md:justify-center',
              sidebarOpen
                ? 'md:h-11 md:w-full md:justify-start md:gap-3.5 md:px-3.5'
                : 'md:mx-auto md:h-11.5 md:w-11.5 md:justify-center'
            ]"
            @click="closeSidebar"
          >
            <i class="fa-regular fa-circle-user w-5 text-center text-lg shrink-0"></i>
            <span
              :class="[
                'max-md:hidden whitespace-nowrap text-sm font-semibold transition-all duration-200',
                sidebarOpen ? 'opacity-100 max-w-xs' : 'max-w-0 opacity-0 overflow-hidden'
              ]"
            >
              Mi Perfil
            </span>
            <span
              v-if="!sidebarOpen"
              class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
            >
              Mi Perfil
            </span>
          </router-link>

          <!-- Mis Productos (Provider Only) -->
          <router-link
            v-if="contextStore.isProvider"
            :to="{ name: 'provider-products' }"
            exact-active-class="!bg-[#fde8e4] !text-[#ff6a00] font-semibold"
            :class="[
              'group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] hover:text-[#ff6a00]',
              'max-md:h-11 max-md:w-11 max-md:justify-center',
              sidebarOpen
                ? 'md:h-11 md:w-full md:justify-start md:gap-3.5 md:px-3.5'
                : 'md:mx-auto md:h-11.5 md:w-11.5 md:justify-center'
            ]"
            @click="closeSidebar"
          >
            <i class="fa-solid fa-bag-shopping w-5 text-center text-lg shrink-0"></i>
            <span
              :class="[
                'max-md:hidden whitespace-nowrap text-sm font-semibold transition-all duration-200',
                sidebarOpen ? 'opacity-100 max-w-xs' : 'max-w-0 opacity-0 overflow-hidden'
              ]"
            >
              Mis Productos
            </span>
            <span
              v-if="!sidebarOpen"
              class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
            >
              Mis Productos
            </span>
          </router-link>

          <!-- Favoritos (Buyer Only) -->
          <router-link
            v-if="!contextStore.isProvider"
            :to="{ name: 'favorites' }"
            exact-active-class="!bg-[#fde8e4] !text-[#ff6a00] font-semibold"
            :class="[
              'group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] hover:text-[#ff6a00]',
              'max-md:h-11 max-md:w-11 max-md:justify-center',
              sidebarOpen
                ? 'md:h-11 md:w-full md:justify-start md:gap-3.5 md:px-3.5'
                : 'md:mx-auto md:h-11.5 md:w-11.5 md:justify-center'
            ]"
            @click="closeSidebar"
          >
            <i class="fa-regular fa-heart w-5 text-center text-lg shrink-0"></i>
            <span
              :class="[
                'max-md:hidden whitespace-nowrap text-sm font-semibold transition-all duration-200',
                sidebarOpen ? 'opacity-100 max-w-xs' : 'max-w-0 opacity-0 overflow-hidden'
              ]"
            >
              Favoritos
            </span>
            <span
              v-if="!sidebarOpen"
              class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
            >
              Favoritos
            </span>
          </router-link>

          <!-- Pedidos -->
          <router-link
            :to="{ name: 'orders' }"
            exact-active-class="!bg-[#fde8e4] !text-[#ff6a00] font-semibold"
            :class="[
              'group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] hover:text-[#ff6a00]',
              'max-md:h-11 max-md:w-11 max-md:justify-center',
              sidebarOpen
                ? 'md:h-11 md:w-full md:justify-start md:gap-3.5 md:px-3.5'
                : 'md:mx-auto md:h-11.5 md:w-11.5 md:justify-center'
            ]"
            @click="closeSidebar"
          >
            <i class="fa-solid fa-cart-shopping w-5 text-center text-lg shrink-0"></i>
            <span
              :class="[
                'max-md:hidden whitespace-nowrap text-sm font-semibold transition-all duration-200',
                sidebarOpen ? 'opacity-100 max-w-xs' : 'max-w-0 opacity-0 overflow-hidden'
              ]"
            >
              Pedidos
            </span>
            <span
              v-if="!sidebarOpen"
              class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
            >
              Pedidos
            </span>
          </router-link>

          <!-- Mensajes -->
          <router-link
            :to="{ name: 'messages' }"
            exact-active-class="!bg-[#fde8e4] !text-[#ff6a00] font-semibold"
            :class="[
              'group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] hover:text-[#ff6a00]',
              'max-md:h-11 max-md:w-11 max-md:justify-center',
              sidebarOpen
                ? 'md:h-11 md:w-full md:justify-start md:gap-3.5 md:px-3.5'
                : 'md:mx-auto md:h-11.5 md:w-11.5 md:justify-center'
            ]"
            @click="closeSidebar"
          >
            <i class="fa-regular fa-comment-dots w-5 text-center text-lg shrink-0"></i>
            <span
              :class="[
                'max-md:hidden whitespace-nowrap text-sm font-semibold transition-all duration-200',
                sidebarOpen ? 'opacity-100 max-w-xs' : 'max-w-0 opacity-0 overflow-hidden'
              ]"
            >
              Mensajes
            </span>
            <span
              v-if="!sidebarOpen"
              class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
            >
              Mensajes
            </span>
          </router-link>

          <!-- Búsqueda Inteligente (Buyer Only) -->
          <router-link
            v-if="!contextStore.isProvider"
            :to="{ name: 'smart-search' }"
            exact-active-class="!bg-[#fde8e4] !text-[#ff6a00] font-semibold"
            :class="[
              'group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] hover:text-[#ff6a00]',
              'max-md:h-11 max-md:w-11 max-md:justify-center',
              sidebarOpen
                ? 'md:h-11 md:w-full md:justify-start md:gap-3.5 md:px-3.5'
                : 'md:mx-auto md:h-11.5 md:w-11.5 md:justify-center'
            ]"
            @click="closeSidebar"
          >
            <i class="fa-solid fa-magnifying-glass w-5 text-center text-lg shrink-0"></i>
            <span
              :class="[
                'max-md:hidden whitespace-nowrap text-sm font-semibold transition-all duration-200',
                sidebarOpen ? 'opacity-100 max-w-xs' : 'max-w-0 opacity-0 overflow-hidden'
              ]"
            >
              Búsqueda Inteligente
            </span>
            <span
              v-if="!sidebarOpen"
              class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
            >
              Búsqueda Inteligente
            </span>
          </router-link>
        </nav>

        <div class="hidden md:flex w-full items-center justify-center px-3 mt-auto">
          <UserMenu :collapsed="!sidebarOpen" align="left" drop-direction="up" />
        </div>
      </aside>

      <!-- Main Content Area -->
      <main
        :class="[
          'relative flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#fdf3f0] p-4 sm:p-6 lg:p-10 transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'max-md:mb-15 max-md:ml-0',
          sidebarOpen ? 'lg:ml-60 md:ml-18' : 'md:ml-[72px]'
        ]"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>
