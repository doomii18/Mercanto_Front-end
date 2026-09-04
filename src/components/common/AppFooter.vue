<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "@/modules/auth";
import AppLogo from "./AppLogo.vue";

const authStore = useAuthStore();

onMounted(() => {
  if (!authStore.isInitialized) {
    authStore.initialize();
  }
});
</script>

<template>
  <footer class="w-full bg-[#083c5a] text-white pt-10 pb-6 px-4">
    <div class="max-w-7xl mx-auto flex flex-col">
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 items-center">
        <!-- Column 1: Info & Contacts -->
        <div class="flex flex-col gap-4 md:pr-10">
        <AppLogo variant="imagotipo" class="h-12 self-start" />
          <div class="flex flex-col gap-2.5 text-sm text-slate-200">
            <a href="mailto:mercanto@gmail.com" class="flex items-center gap-3 hover:underline">
              <i class="fa-regular fa-envelope text-lg"></i>
              <span>mercanto@gmail.com</span>
            </a>
            <a href="https://wa.me/50588662233" class="flex items-center gap-3 hover:underline">
              <i class="fa-brands fa-whatsapp text-lg"></i>
              <span>+505 88662233</span>
            </a>
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-location-dot text-lg"></i>
              <span>Managua, Nicaragua</span>
            </div>
          </div>
        </div>

        <!-- Column 2: Navigation Links -->
        <div class="flex flex-col gap-2.5 md:px-10 border-t md:border-t-0 md:border-x-2 border-orange-500 pt-6 md:pt-0">
          <router-link :to="{ name: 'privacy' }" class="text-sm text-slate-200 hover:text-orange-400 transition-colors">
            Política de privacidad
          </router-link>
          <router-link :to="{ name: 'home', hash: '#categorias' }" class="text-sm text-slate-200 hover:text-orange-400 transition-colors">
            Categorías
          </router-link>
          <router-link :to="{ name: 'home', hash: '#proveedores' }" class="text-sm text-slate-200 hover:text-orange-400 transition-colors">
            Proveedores
          </router-link>
          <router-link :to="{ name: 'home', hash: '#inicio' }" class="text-sm text-slate-200 hover:text-orange-400 transition-colors">
            Productos
          </router-link>
          <router-link :to="{ name: 'home', hash: '#como-funciona' }" class="text-sm text-slate-200 hover:text-orange-400 transition-colors">
            Cómo funciona la plataforma
          </router-link>
        </div>

        <!-- Column 3: CTA / User Section -->
        <div class="flex flex-col items-center text-center gap-3 md:pl-10 border-t md:border-t-0 border-orange-500 pt-6 md:pt-0">
          <template v-if="authStore.isAuthenticated">
            <h4 class="text-teal-400 font-bold text-base tracking-wide uppercase">
              SESIÓN ACTIVA
            </h4>
            <p class="text-sm text-slate-200">
              Explora tu panel y gestiona tus actividades con facilidad.
            </p>
            <router-link
              :to="{ name: 'profile' }"
              class="mt-2 inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-8 rounded-full shadow-lg transition-colors duration-200"
            >
              Ir al inicio
            </router-link>
          </template>
          <template v-else>
            <h4 class="text-orange-500 font-bold text-base tracking-wide uppercase">
              CONVIÉRTETE EN PROVEEDOR
            </h4>
            <p class="text-sm text-slate-200">
              ¿Eres exportador o distribuidor mayorista?
            </p>
            <router-link
              :to="{ name: 'register' }"
              class="mt-2 inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-8 rounded-full shadow-lg transition-colors duration-200"
            >
              Regístrate hoy
            </router-link>
          </template>
        </div>
      </div>

      <!-- Copyright Bottom Bar -->
      <div class="mt-12 text-center text-xs sm:text-sm text-slate-300">
        <p>Mercanto S.A 2026. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>
