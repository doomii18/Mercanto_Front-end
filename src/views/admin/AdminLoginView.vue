<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAdminStore } from "@/stores/adminStore";

const router = useRouter();
const adminStore = useAdminStore();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);

const handleLogin = () => {
  if (!username.value || !password.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  setTimeout(() => {
    const success = adminStore.login(username.value, password.value);
    if (success) {
      router.push({ name: "admin-inicio" });
    } else {
      errorMessage.value = "Usuario o contraseña incorrectos.";
    }
    isLoading.value = false;
  }, 400);
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#023859] relative overflow-hidden p-4">
    <!-- Background decorative circles -->
    <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div class="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#00a896]/10"></div>
      <div class="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-[#00a896]/5"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full border border-white/5"></div>
    </div>

    <div class="relative z-10 w-full max-w-md">
      <!-- Logo & Title -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#00a896]/20 border border-[#00a896]/30 mb-4 shadow-lg">
          <i class="fa-solid fa-shield-halved text-[#00a896] text-2xl"></i>
        </div>
        <h1 class="text-white text-2xl font-bold font-serif mb-1">Mercanto Panel Admin</h1>
        <p class="text-slate-300 text-xs font-medium">Ingresa tus credenciales de administrador</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <!-- Credentials hint -->
        <div class="mb-5 rounded-xl bg-[#00a896]/15 border border-[#00a896]/30 p-3 text-xs text-teal-100 flex items-start gap-2.5">
          <i class="fa-solid fa-circle-info text-[#00a896] text-sm mt-0.5 shrink-0"></i>
          <div>
            <p class="font-bold text-white mb-0.5">Acceso Administrador:</p>
            <p class="font-mono text-[11px]">Usuario: <span class="text-amber-300 font-bold">Admin</span> | Clave: <span class="text-amber-300 font-bold">administrador123</span></p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="errorMessage"
          class="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-xs text-red-200"
          role="alert"
        >
          <i class="fa-solid fa-circle-exclamation text-red-300"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <!-- Username -->
          <div>
            <label for="admin-user" class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">
              Usuario
            </label>
            <div class="relative flex items-center">
              <i class="fa-solid fa-user absolute left-3.5 text-sm text-[#00a896] pointer-events-none"></i>
              <input
                v-model="username"
                type="text"
                id="admin-user"
                placeholder="Admin"
                required
                autocomplete="username"
                :disabled="isLoading"
                class="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-400 transition-all focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/30 disabled:opacity-60 font-medium"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="admin-pass" class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">
              Contraseña
            </label>
            <div class="relative flex items-center">
              <i class="fa-solid fa-lock absolute left-3.5 text-sm text-[#00a896] pointer-events-none"></i>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                id="admin-pass"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                :disabled="isLoading"
                class="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-400 transition-all focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/30 disabled:opacity-60 font-medium"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 p-1 text-slate-300 hover:text-[#00a896] transition-colors"
              >
                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#00a896] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#009688] hover:shadow-lg hover:shadow-[#00a896]/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-right-to-bracket"></i>
            <span>{{ isLoading ? "Verificando..." : "Ingresar al Panel Admin" }}</span>
          </button>
        </form>
      </div>

      <p class="mt-6 text-center text-xs text-slate-400">
        Plataforma Mercanto — Panel Administrativo
      </p>
    </div>
  </div>
</template>
