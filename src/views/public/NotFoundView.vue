<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const requestedPath = computed(() => {
  const param = route.params.pathMatch;
  if (!param) return "";
  if (Array.isArray(param)) {
    return "/" + param.join("/");
  }
  return String(param).startsWith("/") ? String(param) : `/${param}`;
});

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: "home" });
  }
};
</script>

<template>
  <main class="w-full flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-warm">
    <div class="w-full max-w-2xl text-center flex flex-col items-center">
      <!-- Illustration / Visual Accent -->
      <div class="relative mb-6 flex items-center justify-center">
        <!-- Decorative Ambient Glow -->
        <div class="absolute -inset-4 rounded-full bg-orange-500/10 blur-2xl pointer-events-none"></div>
        <div class="absolute -inset-8 -top-8 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        <!-- 404 Headline Display -->
        <div class="relative flex items-center justify-center">
          <span class="font-serif text-8xl sm:text-9xl font-extrabold tracking-tight text-[#083c5a] select-none">
            404
          </span>
          <div class="absolute -right-3 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6a00] text-white shadow-md ring-4 ring-[#fefcfb]">
            <i class="fa-solid fa-compass text-sm animate-pulse"></i>
          </div>
        </div>
      </div>

      <!-- Main Messages -->
      <h1 class="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 tracking-tight">
        Página no encontrada
      </h1>

      <p class="text-sm sm:text-base text-neutral-600 max-w-md mb-4 leading-relaxed">
        Lo sentimos, la ruta que intentas acceder no existe, fue movida o ya no se encuentra disponible en Mercanto.
      </p>

      <!-- Requested Missing Route Display -->
      <div
        v-if="requestedPath"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-500 font-mono mb-8 max-w-full overflow-hidden"
      >
        <i class="fa-solid fa-link text-neutral-400 shrink-0"></i>
        <span class="truncate">{{ requestedPath }}</span>
      </div>

      <!-- Action Guidance / Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
        <router-link
          :to="{ name: 'home' }"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65f00] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <i class="fa-solid fa-house text-xs"></i>
          <span>Volver al Inicio</span>
        </router-link>

        <button
          type="button"
          @click="goBack"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-sm border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all duration-200 cursor-pointer"
        >
          <i class="fa-solid fa-arrow-left text-xs text-neutral-500"></i>
          <span>Regresar a la página anterior</span>
        </button>
      </div>

      <!-- Additional Helpful Navigation Links -->
      <div class="mt-12 pt-8 border-t border-neutral-200 w-full max-w-md">
        <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
          ¿Buscabas alguna de estas secciones?
        </p>
        <div class="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-neutral-600">
          <router-link :to="{ name: 'products' }" class="hover:text-[#ff6a00] transition-colors">
            Explorar Productos
          </router-link>
          <span class="text-neutral-300">•</span>
          <router-link :to="{ name: 'home', hash: '#como-funciona' }" class="hover:text-[#ff6a00] transition-colors">
            Cómo Funciona
          </router-link>
          <span class="text-neutral-300">•</span>
          <router-link :to="{ name: 'privacy' }" class="hover:text-[#ff6a00] transition-colors">
            Privacidad y Seguridad
          </router-link>
        </div>
      </div>
    </div>
  </main>
</template>
