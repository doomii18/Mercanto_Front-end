<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import Map from "@/components/common/Map.vue";
import AppLogo from "@/components/common/AppLogo.vue";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";

const route = useRoute();
const router = useRouter();
const identityApi = useIdentityApi();

// Flow step: 1 = Request email, 2 = Enter token & new password, 3 = Success
const currentStep = ref<1 | 2 | 3>(1);

// Form fields
const email = ref("");
const token = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

// UI state
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

// Password validation rules matching backend predicate
const hasMinLength = computed(() => newPassword.value.length >= 8 && newPassword.value.length <= 128);
const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value));
const hasLowercase = computed(() => /[a-z]/.test(newPassword.value));
const hasNumber = computed(() => /\d/.test(newPassword.value));
const isPasswordValid = computed(() =>
  hasMinLength.value && hasUppercase.value && hasLowercase.value && hasNumber.value
);
const passwordsMatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value === confirmPassword.value
);

onMounted(() => {
  // If user opened a direct link like /reset-password?token=...
  const queryToken = route.query.token;
  if (typeof queryToken === "string" && queryToken.trim().length > 0) {
    token.value = queryToken.trim();
    currentStep.value = 2;
  }
});

// Step 1: Send reset email
const handleRequestReset = async () => {
  if (!email.value.trim()) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await identityApi.requestPasswordReset({ email: email.value.trim() });
    currentStep.value = 2;
  } catch (error: any) {
    errorMessage.value = error.message || "Error al solicitar el restablecimiento de contraseña";
  } finally {
    isLoading.value = false;
  }
};

// Step 2: Reset password with token
const handleResetPassword = async () => {
  if (!token.value.trim()) {
    errorMessage.value = "Por favor ingresa el token recibido en tu correo.";
    return;
  }

  if (!isPasswordValid.value) {
    errorMessage.value = "La nueva contraseña debe cumplir con todos los requisitos de seguridad.";
    return;
  }

  if (!passwordsMatch.value) {
    errorMessage.value = "Las contraseñas no coinciden.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await identityApi.resetPassword({
      token: token.value.trim(),
      new_password: newPassword.value,
    });
    currentStep.value = 3;
  } catch (error: any) {
    if (error?.status === 404 || error?.statusCode === 404 || (error?.message && error.message.includes("404"))) {
      errorMessage.value = "El token es inválido, ya fue utilizado o ha expirado. Por favor solicita uno nuevo.";
    } else {
      errorMessage.value = error.message || "No se pudo restablecer la contraseña. Verifica el código e intenta de nuevo.";
    }
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push({ name: "login" });
};
</script>

<template>
  <div class="flex min-h-screen w-full flex-col lg:flex-row">
    <!-- Left Promotional Panel -->
    <section class="relative hidden lg:flex flex-1 items-center justify-center overflow-hidden bg-(--primary-blue) p-8 text-white lg:flex-[1.2] lg:p-10">
      <!-- Background Decorative Figures & Map -->
      <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div class="absolute top-12 left-1/3 h-32 w-48 opacity-15" style="background-image: radial-gradient(circle, #ffffff 2px, transparent 2px); background-size: 24px 24px;"></div>
        <div class="absolute top-8 -right-48 h-96 w-96 rounded-full bg-(--primary-orange)"></div>
        <div class="absolute -top-20 -right-24 h-80 w-80 rounded-full border-40 border-(--light-teal)"></div>
        <div class="pointer-events-none absolute top-1/2 -right-4 -translate-y-1/2 w-[70%] max-w-lg opacity-35 mix-blend-screen flex items-center justify-center">
          <Map class="w-full h-auto scale-90 origin-right" />
        </div>
        <img src="../assets/city_outline.png" alt="Cityscape backdrop" aria-hidden="true" class="absolute bottom-0 left-0 w-auto max-w-none h-40 object-contain object-bottom opacity-60 mix-blend-screen" />
      </div>

      <div class="relative z-10 w-full max-w-140">
        <AppLogo variant="imagotipo" class="h-24 md:h-30" />

        <h1 class="mb-5 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-[2.4rem]">
          Seguridad y confianza<br />
          <span class="text-(--primary-orange)">para tu cuenta comercial</span>
        </h1>

        <p class="mb-6 text-[0.95rem] leading-relaxed text-neutral-300">
          Recupera el acceso a tu cuenta de Mercanto de forma rápida y protegida mediante verificación por token.
        </p>

        <div class="mb-10 h-0.5 w-14 rounded-sm bg-(--light-teal)"></div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div class="flex flex-col items-center text-center">
            <div class="mb-3 text-[1.5rem] text-(--light-teal)">
              <i class="fa-solid fa-envelope-circle-check"></i>
            </div>
            <h4 class="mb-1 text-[0.85rem] font-semibold leading-tight">1. Solicita código</h4>
            <p class="text-[0.7rem] text-neutral-300">Enviado a tu correo</p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div class="mb-3 text-[1.5rem] text-(--primary-orange)">
              <i class="fa-solid fa-key"></i>
            </div>
            <h4 class="mb-1 text-[0.85rem] font-semibold leading-tight">2. Ingresa token</h4>
            <p class="text-[0.7rem] text-neutral-300">Válido por 15 minutos</p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div class="mb-3 text-[1.5rem] text-(--light-teal)">
              <i class="fa-solid fa-lock-open"></i>
            </div>
            <h4 class="mb-1 text-[0.85rem] font-semibold leading-tight">3. Nueva contraseña</h4>
            <p class="text-[0.7rem] text-neutral-300">Acceso renovado</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Panel / Card Section -->
    <section class="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-50 p-6 lg:p-8">
      <!-- Background Decorative Figures -->
      <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div class="absolute -top-10 -right-10 h-64 w-64 opacity-15" style="background-image: radial-gradient(circle, var(--primary-orange) 2.5px, transparent 2.5px); background-size: 24px 24px;"></div>
        <div class="absolute -bottom-48 -right-48 h-137.5 w-137.5 rounded-full bg-teal-50"></div>
        <div class="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-100/40"></div>
      </div>

      <!-- Action Card -->
      <div class="relative z-10 w-full max-w-105 rounded-3xl border-3 border-(--primary-orange) bg-white p-6 shadow-2xl shadow-(--primary-orange)/20 md:px-8 md:py-10">

        <!-- ======================= STEP 1: REQUEST EMAIL ======================= -->
        <template v-if="currentStep === 1">
          <div class="mb-6 text-center">
            <div class="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[1.5rem] text-(--primary-orange)">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h3 class="mb-1 font-serif text-2xl font-bold text-(--primary-blue)">¿Olvidaste tu contraseña?</h3>
            <p class="text-[0.85rem] font-medium text-(--primary-orange)">Recupera el acceso a tu cuenta</p>
            <p class="mt-2 text-[0.8rem] text-neutral-600">
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un código de seguridad para restablecer tu contraseña.
            </p>
          </div>

          <div v-if="errorMessage" class="mb-4 flex items-center gap-2.5 rounded-lg border border-[#f8b4b4] bg-[#fdf2f2] px-4 py-3 text-[0.8rem] text-[#9b1c1c]" role="alert">
            <i class="fa-solid fa-circle-exclamation shrink-0"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleRequestReset" class="flex flex-col">
            <div class="mb-5">
              <label for="reset-email" class="mb-1.5 block text-[0.8rem] font-bold text-(--light-teal)">
                Correo electrónico registrado
              </label>
              <div class="relative flex items-center">
                <i class="fa-regular fa-envelope absolute left-3.5 text-[0.95rem] text-(--light-teal) pointer-events-none"></i>
                <input
                  v-model="email"
                  type="email"
                  id="reset-email"
                  placeholder="ejemplo@correo.com"
                  required
                  autocomplete="email"
                  :disabled="isLoading"
                  class="w-full rounded-lg border-[1.5px] border-(--border-gray) bg-white py-2.5 pl-10 pr-4 text-[0.9rem] text-(--text-dark) transition-all focus:border-(--light-teal) focus:outline-none focus:ring-[3px] focus:ring-(--light-teal)/15"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="isLoading || !email.trim()"
              class="flex w-full items-center justify-center gap-2.5 rounded-xl bg-(--primary-orange) px-4 py-2.5 text-[0.95rem] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-(--primary-orange-hover) disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ isLoading ? "Enviando correo..." : "Enviar código de recuperación" }}</span>
              <i v-if="!isLoading" class="fa-solid fa-arrow-right"></i>
            </button>

            <div class="mt-6 text-center text-[0.85rem]">
              <RouterLink
                to="/login"
                class="inline-flex items-center gap-1.5 font-semibold text-(--light-teal) hover:underline"
              >
                <i class="fa-solid fa-arrow-left text-[0.8rem]"></i>
                <span>Volver a iniciar sesión</span>
              </RouterLink>
            </div>
          </form>
        </template>

        <!-- ======================= STEP 2: TOKEN & NEW PASSWORD ======================= -->
        <template v-else-if="currentStep === 2">
          <div class="mb-5 text-center">
            <div class="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[1.5rem] text-(--light-teal)">
              <i class="fa-solid fa-key"></i>
            </div>
            <h3 class="mb-1 font-serif text-2xl font-bold text-(--primary-blue)">Nueva Contraseña</h3>
            <p class="text-[0.85rem] font-medium text-(--light-teal)">Ingresa tu token y nueva clave</p>
            <div v-if="email" class="mt-2 rounded-lg bg-orange-50/80 p-2.5 text-xs text-(--primary-orange) border border-(--primary-orange)/20">
              <i class="fa-solid fa-envelope mr-1.5"></i>
              Hemos enviado las instrucciones a: <strong class="break-all">{{ email }}</strong>
            </div>
          </div>

          <div v-if="errorMessage" class="mb-4 flex items-center gap-2.5 rounded-lg border border-[#f8b4b4] bg-[#fdf2f2] px-4 py-3 text-[0.8rem] text-[#9b1c1c]" role="alert">
            <i class="fa-solid fa-circle-exclamation shrink-0"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleResetPassword" class="flex flex-col gap-4">
            <!-- Token input -->
            <div>
              <label for="reset-token" class="mb-1 block text-[0.8rem] font-bold text-(--light-teal)">
                Código / Token de seguridad
              </label>
              <div class="relative flex items-center">
                <i class="fa-solid fa-ticket absolute left-3.5 text-[0.95rem] text-(--light-teal) pointer-events-none"></i>
                <input
                  v-model="token"
                  type="text"
                  id="reset-token"
                  placeholder="Pega el código recibido por correo"
                  required
                  :disabled="isLoading"
                  class="w-full rounded-lg border-[1.5px] border-(--border-gray) bg-white py-2.5 pl-10 pr-4 font-mono text-[0.85rem] text-(--text-dark) transition-all focus:border-(--light-teal) focus:outline-none focus:ring-[3px] focus:ring-(--light-teal)/15"
                />
              </div>
              <p class="mt-1 text-[0.7rem] text-neutral-500">
                El código de restablecimiento expira en 15 minutos.
              </p>
            </div>

            <!-- New Password -->
            <div>
              <label for="new-password" class="mb-1 block text-[0.8rem] font-bold text-(--light-teal)">
                Nueva contraseña
              </label>
              <div class="relative flex items-center">
                <i class="fa-solid fa-lock absolute left-3.5 text-[0.95rem] text-(--light-teal) pointer-events-none"></i>
                <input
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  id="new-password"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                  :disabled="isLoading"
                  class="w-full rounded-lg border-[1.5px] border-(--border-gray) bg-white py-2.5 pl-10 pr-10 text-[0.9rem] text-(--text-dark) transition-all focus:border-(--light-teal) focus:outline-none focus:ring-[3px] focus:ring-(--light-teal)/15"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 p-1 text-[1.05rem] text-(--primary-orange) hover:opacity-80"
                >
                  <i :class="showNewPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>

              <!-- Password rules indicators -->
              <div class="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100/70 p-2 text-[0.72rem]">
                <div :class="hasMinLength ? 'text-emerald-600 font-medium' : 'text-neutral-500'" class="flex items-center gap-1.5">
                  <i :class="hasMinLength ? 'fa-solid fa-check' : 'fa-solid fa-circle text-[0.4rem]'"></i>
                  <span>8 a 128 caracteres</span>
                </div>
                <div :class="hasUppercase ? 'text-emerald-600 font-medium' : 'text-neutral-500'" class="flex items-center gap-1.5">
                  <i :class="hasUppercase ? 'fa-solid fa-check' : 'fa-solid fa-circle text-[0.4rem]'"></i>
                  <span>Una mayúscula</span>
                </div>
                <div :class="hasLowercase ? 'text-emerald-600 font-medium' : 'text-neutral-500'" class="flex items-center gap-1.5">
                  <i :class="hasLowercase ? 'fa-solid fa-check' : 'fa-solid fa-circle text-[0.4rem]'"></i>
                  <span>Una minúscula</span>
                </div>
                <div :class="hasNumber ? 'text-emerald-600 font-medium' : 'text-neutral-500'" class="flex items-center gap-1.5">
                  <i :class="hasNumber ? 'fa-solid fa-check' : 'fa-solid fa-circle text-[0.4rem]'"></i>
                  <span>Un número</span>
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirm-password" class="mb-1 block text-[0.8rem] font-bold text-(--light-teal)">
                Confirmar nueva contraseña
              </label>
              <div class="relative flex items-center">
                <i class="fa-solid fa-lock absolute left-3.5 text-[0.95rem] text-(--light-teal) pointer-events-none"></i>
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirm-password"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                  :disabled="isLoading"
                  class="w-full rounded-lg border-[1.5px] border-(--border-gray) bg-white py-2.5 pl-10 pr-10 text-[0.9rem] text-(--text-dark) transition-all focus:border-(--light-teal) focus:outline-none focus:ring-[3px] focus:ring-(--light-teal)/15"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 p-1 text-[1.05rem] text-(--primary-orange) hover:opacity-80"
                >
                  <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
              <p v-if="confirmPassword && !passwordsMatch" class="mt-1 text-[0.72rem] font-medium text-rose-600">
                <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                Las contraseñas no coinciden.
              </p>
              <p v-else-if="confirmPassword && passwordsMatch" class="mt-1 text-[0.72rem] font-medium text-emerald-600">
                <i class="fa-solid fa-check mr-1"></i>
                Las contraseñas coinciden.
              </p>
            </div>

            <button
              type="submit"
              :disabled="isLoading || !token.trim() || !isPasswordValid || !passwordsMatch"
              class="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl bg-(--primary-orange) px-4 py-2.5 text-[0.95rem] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-(--primary-orange-hover) disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ isLoading ? "Actualizando contraseña..." : "Restablecer contraseña" }}</span>
              <i v-if="!isLoading" class="fa-solid fa-check"></i>
            </button>

            <div class="mt-4 flex flex-col items-center gap-2 text-center text-[0.8rem]">
              <button
                type="button"
                @click="currentStep = 1; errorMessage = null;"
                class="text-(--primary-orange) hover:underline font-medium"
              >
                ¿No recibiste el correo o deseas ingresar otro?
              </button>
              <RouterLink to="/login" class="text-neutral-500 hover:text-(--light-teal)">
                Cancelar y volver a login
              </RouterLink>
            </div>
          </form>
        </template>

        <!-- ======================= STEP 3: SUCCESS ======================= -->
        <template v-else-if="currentStep === 3">
          <div class="py-4 text-center">
            <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[2.2rem] text-emerald-500">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <h3 class="mb-2 font-serif text-2xl font-bold text-(--primary-blue)">¡Contraseña Actualizada!</h3>
            <p class="mb-6 text-[0.88rem] leading-relaxed text-neutral-600">
              Tu contraseña ha sido restablecida con éxito. Tus sesiones anteriores han sido cerradas automáticamente por seguridad.
            </p>

            <button
              type="button"
              @click="goToLogin"
              class="flex w-full items-center justify-center gap-2.5 rounded-xl bg-(--primary-orange) px-4 py-3 text-[0.95rem] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-(--primary-orange-hover)"
            >
              <span>Iniciar sesión ahora</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </template>

      </div>
    </section>
  </div>
</template>
