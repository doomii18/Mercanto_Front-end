<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../modules/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  await authStore.initialize();
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  if (!email.value || !password.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });

    const redirectPath =
      typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
        ? route.query.redirect
        : { name: "profile" };

    router.push(redirectPath);
  } catch (error: any) {
    errorMessage.value = error.message || "Error al iniciar sesión";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
    <div class="flex min-h-screen w-full flex-col lg:flex-row">
        <!-- Left Panel -->
        <section class="relative hidden lg:flex flex-1 items-center justify-center overflow-hidden bg-(--primary-blue) p-8 text-white lg:flex-[1.2] lg:p-12">
            <div class="relative z-10 w-full max-w-162.5">
                <div class="mb-12">
                    <img src="../assets/1.1 Imagotipo variacion.png" alt="Mercanto" class="h-15 object-contain" />
                </div>

                <h1 class="mb-6 font-serif text-[2.2rem] font-bold leading-tight md:text-[2.8rem]">
                    Conectamos tu negocio<br />
                    <span class="text-(--primary-orange)">con los mejores<br />distribuidores</span>
                </h1>

                <p class="mb-6 text-[1.1rem] leading-relaxed text-neutral-300">
                    Compra al por mayor de forma fácil, segura<br />
                    y con proveedores verificados en todo Nicaragua.
                </p>

                <div class="mb-12 h-0.75 w-16.25 rounded-sm bg-(--light-teal)"></div>

                <div class="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
                    <div class="flex flex-col items-start lg:items-center lg:border-r lg:border-white/15 lg:px-6 lg:pl-0 lg:text-center">
                        <div class="mb-4 text-[1.8rem] text-(--light-teal)">
                            <i class="fa-solid fa-shield-halved"></i>
                        </div>
                        <h4 class="mb-1.5 text-[0.95rem] font-semibold leading-tight">Proveedores<br/>verificados</h4>
                        <p class="text-[0.8rem] text-neutral-300">Confianza y calidad</p>
                    </div>
                    <div class="flex flex-col items-start lg:items-center lg:border-r lg:border-white/15 lg:px-6 lg:text-center">
                        <div class="mb-4 text-[1.8rem] text-(--primary-orange)">
                            <i class="fa-solid fa-tag"></i>
                        </div>
                        <h4 class="mb-1.5 text-[0.95rem] font-semibold leading-tight">Precios<br/>competitivos</h4>
                        <p class="text-[0.8rem] text-neutral-300">Ahorra más</p>
                    </div>
                    <div class="flex flex-col items-start lg:items-center lg:border-r lg:border-white/15 lg:px-6 lg:text-center">
                        <div class="mb-4 text-[1.8rem] text-(--light-teal)">
                            <i class="fa-solid fa-truck"></i>
                        </div>
                        <h4 class="mb-1.5 text-[0.95rem] font-semibold leading-tight">Envíos a<br/>todo el país</h4>
                        <p class="text-[0.8rem] text-neutral-300">Rápido y seguro</p>
                    </div>
                    <div class="flex flex-col items-start lg:items-center lg:px-6 lg:pr-0 lg:text-center">
                        <div class="mb-4 text-[1.8rem] text-(--primary-orange)">
                            <i class="fa-solid fa-headset"></i>
                        </div>
                        <h4 class="mb-1.5 text-[0.95rem] font-semibold leading-tight">Soporte<br/>confiable</h4>
                        <p class="text-[0.8rem] text-neutral-300">Siempre contigo</p>
                    </div>
                </div>

                <div class="flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 md:px-8 lg:flex-row lg:gap-8">
                    <div class="flex w-full flex-col items-center gap-4 border-b border-white/15 pb-6 lg:w-auto lg:flex-row lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--light-teal)/15 text-[1.2rem] text-(--light-teal)">
                            <i class="fa-solid fa-users"></i>
                        </div>
                        <p class="text-center text-[0.9rem] leading-relaxed lg:text-left">
                            Únete a miles de negocios<br/>que ya crecen con <span class="font-bold text-(--primary-orange)">Mercanto</span>
                        </p>
                    </div>
                    <div class="flex w-full flex-col gap-6 sm:flex-row sm:gap-8 lg:flex-1">
                        <div class="flex flex-1 flex-col items-center text-center">
                            <i class="mb-2 text-[1.2rem] text-(--light-teal) fa-regular fa-user"></i>
                            <strong class="mb-1 text-[1.1rem] font-bold">1,200+</strong>
                            <span class="text-[0.75rem] leading-tight text-neutral-300">Proveedores<br/>verificados</span>
                        </div>
                        <div class="flex flex-1 flex-col items-center text-center">
                            <i class="mb-2 text-[1.2rem] text-(--primary-orange) fa-solid fa-box"></i>
                            <strong class="mb-1 text-[1.1rem] font-bold">15,000+</strong>
                            <span class="text-[0.75rem] leading-tight text-neutral-300">Productos<br/>disponibles</span>
                        </div>
                        <div class="flex flex-1 flex-col items-center text-center">
                            <i class="mb-2 text-[1.2rem] text-(--light-teal) fa-solid fa-cart-shopping"></i>
                            <strong class="mb-1 text-[1.1rem] font-bold">8,500+</strong>
                            <span class="text-[0.75rem] leading-tight text-neutral-300">Negocios<br/>conectados</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Right Panel -->
        <section class="flex flex-1 items-center justify-center bg-neutral-50 p-6 lg:p-8">
            <div class="w-full max-w-110 rounded-3xl bg-white p-8 shadow-[0_15px_40px_rgba(0,0,0,0.05)] md:px-10 md:py-12">
                <div class="mb-8 text-center">
                    <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[1.8rem] text-(--primary-orange)">
                        <i class="fa-solid fa-bag-shopping"></i>
                    </div>
                    <h3 class="mb-1 font-serif text-[1.6rem] font-bold text-(--primary-blue)">¡Bienvenido de nuevo!</h3>
                    <p class="text-[0.95rem] font-medium text-(--primary-orange)">Inicia sesión en tu cuenta</p>
                </div>

                <div v-if="errorMessage" class="mb-5 flex items-center gap-2.5 rounded-lg border border-[#f8b4b4] bg-[#fdf2f2] px-4 py-3 text-[0.88rem] text-[#9b1c1c]" role="alert">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>{{ errorMessage }}</span>
                </div>

                <form @submit.prevent="handleLogin" class="flex flex-col">
                    <div class="mb-5">
                        <label for="email" class="mb-2 block text-[0.88rem] font-bold text-(--light-teal)">Correo electrónico</label>
                        <div class="relative flex items-center">
                            <i class="fa-regular fa-envelope absolute left-4 text-base text-(--light-teal) pointer-events-none"></i>
                            <input
                                v-model="email"
                                type="email"
                                id="email"
                                placeholder="ejemplo@correo.com"
                                required
                                autocomplete="email"
                                :disabled="isLoading"
                                class="w-full rounded-lg border-[1.5px] border-(--border-gray) bg-white py-3 pl-11 pr-4 text-[0.95rem] text-(--text-dark) transition-all focus:border-(--light-teal) focus:outline-none focus:ring-[3px] focus:ring-(--light-teal)/15"
                            />
                        </div>
                    </div>

                    <div class="mb-5">
                        <label for="password" class="mb-2 block text-[0.88rem] font-bold text-(--light-teal)">Contraseña</label>
                        <div class="relative flex items-center">
                            <i class="fa-solid fa-lock absolute left-4 text-base text-(--light-teal) pointer-events-none"></i>
                            <input
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                id="password"
                                placeholder="••••••••"
                                required
                                autocomplete="current-password"
                                :disabled="isLoading"
                                class="w-full rounded-lg border-[1.5px] border-(--border-gray) bg-white py-3 pl-11 pr-11 text-[0.95rem] text-(--text-dark) transition-all focus:border-(--light-teal) focus:outline-none focus:ring-[3px] focus:ring-(--light-teal)/15"
                            />
                            <button
                                type="button"
                                @click="togglePassword"
                                class="absolute right-3 p-1 text-[1.1rem] text-(--primary-orange) hover:opacity-80"
                            >
                                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                        </div>
                    </div>

                    <div class="mb-6 flex flex-col items-start gap-3 text-[0.88rem] sm:flex-row sm:items-center sm:justify-between">
                        <label class="flex cursor-pointer select-none items-center gap-2 font-semibold text-(--light-teal)">
                            <input type="checkbox" name="remember" :disabled="isLoading" class="h-4 w-4 cursor-pointer rounded border-[1.5px] border-(--light-teal) accent-(--light-teal)" />
                            <span>Recordarme</span>
                        </label>
                        <a href="#" class="font-semibold text-(--primary-orange) transition-colors hover:underline">¿Olvidaste tu contraseña?</a>
                    </div>

                    <button type="submit" :disabled="isLoading" class="flex w-full items-center justify-center gap-3 rounded-xl bg-(--primary-orange) px-4 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-(--primary-orange-hover) disabled:cursor-not-allowed disabled:opacity-70">
                        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                        <span>{{ isLoading ? "Iniciando sesión..." : "Iniciar sesión" }}</span>
                        <i v-if="!isLoading" class="fa-solid fa-arrow-right"></i>
                    </button>

                    <div class="my-8 flex items-center">
                        <span class="h-px flex-1 bg-(--border-gray)"></span>
                        <span class="mx-3 h-1.5 w-1.5 rounded-full bg-(--border-gray)"></span>
                        <span class="h-px flex-1 bg-(--border-gray)"></span>
                    </div>

                    <div class="text-center text-[0.95rem] text-(--text-dark)">
                        <span>¿No tienes cuenta?</span>
                        <router-link :to="{ name: 'register' }" class="mt-1 block font-bold text-(--light-teal) hover:underline">Regístrate aquí</router-link>
                    </div>
                </form>
            </div>
        </section>
    </div>
</template>
