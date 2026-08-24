<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authManager } from "../modules/auth";

const router = useRouter();
const route = useRoute();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

onMounted(async () => {
    await authManager.initialize();
});

const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  if (!email.value || !password.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authManager.login({
      email: email.value,
      password: password.value,
    });

    const redirectPath = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
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
    <div class="login-page">
        <div class="login-container">
            <!-- Left Branding & Showcase Panel -->
            <section class="login-showcase">
                <div class="brand-logo">
                    <img
                        src="../assets/1.1 Imagotipo variacion.png"
                        alt="Mercanto"
                    />
                </div>

                <h2 class="showcase-title">
                    Encuentra a los mejores proveedores<br />para
                    <span>TÚ</span> negocio
                </h2>

                <div class="hero-image-wrapper">
                    <img
                        src="../assets/login_hero1.png"
                        alt="Comercio mayorista Mercanto"
                    />
                </div>

                <div class="features-list">
                    <div class="feature-item">
                        <i class="fa-solid fa-certificate"></i>
                        <span>Proveedores verificados</span>
                    </div>
                    <div class="feature-item">
                        <i class="fa-solid fa-box"></i>
                        <span>Compras al por mayor</span>
                    </div>
                </div>

                <img
                    src="../assets/city_outline.png"
                    alt=""
                    aria-hidden="true"
                    class="city-backdrop"
                />
            </section>

            <!-- Right Authentication Card -->
            <section class="login-card-wrapper">
                <div class="login-card">
                    <div class="card-header">
                        <div class="store-badge">
                            <i class="fa-solid fa-store"></i>
                        </div>
                        <h3>¡Bienvenido de nuevo!</h3>
                        <p>Inicia sesión en tu cuenta</p>
                    </div>

                    <div v-if="errorMessage" class="error-banner" role="alert">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <span>{{ errorMessage }}</span>
                    </div>

                    <form @submit.prevent="handleLogin" class="login-form">
                        <div class="form-group">
                            <label for="email">Correo electrónico</label>
                            <div class="input-control">
                                <i class="fa-regular fa-envelope input-icon"></i>
                                <input
                                    v-model="email"
                                    type="email"
                                    id="email"
                                    placeholder="ejemplo@correo.com"
                                    required
                                    autocomplete="email"
                                    :disabled="isLoading"
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <div class="input-control">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input
                                    v-model="password"
                                    :type="showPassword ? 'text' : 'password'"
                                    id="password"
                                    placeholder="••••••••"
                                    required
                                    autocomplete="current-password"
                                    :disabled="isLoading"
                                />
                                <button
                                    type="button"
                                    class="toggle-visibility-btn"
                                    @click="togglePassword"
                                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                                >
                                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                </button>
                            </div>
                        </div>

                        <div class="form-options">
                            <label class="custom-checkbox">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    :disabled="isLoading"
                                />
                                <span>Recordarme</span>
                            </label>
                            <a href="#" class="link-forgot">¿Olvidaste tu contraseña?</a>
                        </div>

                        <button
                            type="submit"
                            class="btn-submit"
                            :disabled="isLoading"
                        >
                            <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                            <span>{{ isLoading ? "Iniciando sesión..." : "Iniciar sesión" }}</span>
                            <i v-if="!isLoading" class="fa-solid fa-arrow-right"></i>
                        </button>

                        <div class="divider">
                            <span class="divider-line"></span>
                            <span class="divider-dot"></span>
                            <span class="divider-line"></span>
                        </div>

                        <div class="register-cta">
                            <span>¿No tienes cuenta?</span>
                            <router-link :to="{ name: 'register' }">
                                Regístrate aquí
                            </router-link>
                        </div>
                    </form>
                </div>

                <div class="shipping-badge">
                    <i class="fa-solid fa-truck-fast"></i>
                    <span>Envíos a todo el país</span>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    width: 100%;
    background-color: var(--primary-blue);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem 5rem 1rem;
}

.login-container {
    width: 100%;
    max-width: 1100px;
    display: flex;
    flex-wrap: wrap;
    gap: 3rem;
    align-items: center;
}

/* ── Showcase Column ── */
.login-showcase {
    flex: 1;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
}

.brand-logo img {
    height: 90px;
    object-fit: contain;
    margin-bottom: 1rem;
}

.showcase-title {
    font-size: 1.4rem;
    line-height: 1.35;
    color: #ffffff;
    font-weight: 500;
    margin-bottom: 1.5rem;
}

.showcase-title span {
    color: var(--primary-orange);
    font-weight: 700;
}

.hero-image-wrapper {
    position: relative;
    width: 100%;
    max-width: 340px;
    margin-bottom: 1.5rem;
}

.hero-image-wrapper img {
    width: 100%;
    border-radius: 30px 0 30px 0;
    display: block;
    object-fit: cover;
}

.hero-image-wrapper::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 15px;
    right: -10px;
    height: 100%;
    background: linear-gradient(
        135deg,
        transparent 60%,
        var(--primary-orange) 50%
    );
    border-radius: 0 0 50px 0;
    z-index: -1;
    opacity: 0.45;
}

.features-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
    max-width: 320px;
    margin-bottom: 1.5rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
}

.feature-item i {
    font-size: 1.4rem;
    color: var(--primary-orange);
    width: 24px;
}

.feature-item i.fa-box {
    color: transparent;
    -webkit-text-stroke: 2px var(--primary-orange);
}

.city-backdrop {
    width: 85%;
    max-width: 480px;
    mix-blend-mode: screen;
    opacity: 0.8;
    margin-top: -2.5rem;
    pointer-events: none;
}

/* ── Card Column ── */
.login-card-wrapper {
    flex: 1;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
}

.login-card {
    background-color: var(--bg-light);
    border: 3px solid var(--primary-orange);
    border-radius: 28px;
    padding: 2.2rem 2rem;
    width: 100%;
    max-width: 420px;
    color: var(--text-dark);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
}

.card-header {
    text-align: center;
    margin-bottom: 1.5rem;
}

.store-badge {
    width: 58px;
    height: 58px;
    background-color: var(--primary-orange);
    border-radius: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.75rem;
    color: #ffffff;
    font-size: 1.5rem;
}

.card-header h3 {
    color: var(--primary-blue);
    font-size: 1.45rem;
    margin-bottom: 0.25rem;
}

.card-header p {
    color: var(--primary-orange);
    font-size: 0.95rem;
    font-weight: 500;
}

.error-banner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    background-color: #fdf2f2;
    border: 1px solid #f8b4b4;
    border-radius: 8px;
    color: #9b1c1c;
    font-size: 0.88rem;
    margin-bottom: 1.25rem;
}

/* ── Form Controls ── */
.login-form .form-group {
    margin-bottom: 1.1rem;
}

.login-form .form-group > label {
    display: block;
    color: var(--light-teal);
    font-size: 0.88rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
}

.input-control {
    position: relative;
    display: flex;
    align-items: center;
}

.input-control .input-icon {
    position: absolute;
    left: 0.9rem;
    color: var(--light-teal);
    font-size: 1rem;
    pointer-events: none;
}

.input-control input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.6rem;
    border: 1.5px solid rgba(24, 156, 148, 0.35);
    border-radius: 8px;
    font-size: 0.95rem;
    color: var(--text-dark);
    background-color: #ffffff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-control input:focus {
    outline: none;
    border-color: var(--light-teal);
    box-shadow: 0 0 0 3px rgba(24, 156, 148, 0.15);
}

.input-control input::placeholder {
    color: #a0aec0;
}

.toggle-visibility-btn {
    position: absolute;
    right: 0.8rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--primary-orange);
    font-size: 1rem;
    padding: 0.2rem;
}

/* ── Checkbox & Forgot Password Row ── */
.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1.2rem 0 1.5rem 0;
    font-size: 0.88rem;
    gap: 1rem;
}

.custom-checkbox {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.5rem;
    color: var(--light-teal);
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    margin-bottom: 0 !important;
}

.custom-checkbox input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 1.15rem;
    height: 1.15rem;
    margin: 0;
    border: 2px solid var(--light-teal);
    border-radius: 4px;
    display: grid;
    place-content: center;
    cursor: pointer;
    flex-shrink: 0;
    background-color: #ffffff;
}

.custom-checkbox input[type="checkbox"]::before {
    content: "";
    width: 0.65rem;
    height: 0.65rem;
    transform: scale(0);
    transition: 120ms transform ease-in-out;
    background-color: var(--light-teal);
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}

.custom-checkbox input[type="checkbox"]:checked::before {
    transform: scale(1);
}

.link-forgot {
    color: var(--primary-orange);
    text-decoration: none;
    font-weight: 500;
    white-space: nowrap;
    transition: text-decoration 0.2s ease;
}

.link-forgot:hover {
    text-decoration: underline;
}

/* ── Actions ── */
.btn-submit {
    width: 100%;
    padding: 0.85rem 1rem;
    background-color: var(--primary-orange);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    transition: transform 0.2s ease, background-color 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
    background-color: var(--primary-orange-hover, #e66000);
    transform: translateY(-2px);
}

.btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
}

.divider-line {
    flex: 1;
    height: 1px;
    background-color: var(--border-gray);
}

.divider-dot {
    width: 6px;
    height: 6px;
    background-color: var(--border-gray);
    border-radius: 50%;
    margin: 0 0.75rem;
}

.register-cta {
    text-align: center;
    font-size: 0.92rem;
    color: var(--text-dark);
}

.register-cta a {
    color: var(--light-teal);
    font-weight: 700;
    text-decoration: underline;
    display: block;
    margin-top: 0.25rem;
}

.register-cta a:hover {
    color: #12827b;
}

/* ── Footer Shipping Badge ── */
.shipping-badge {
    position: absolute;
    bottom: -3.5rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
}

.shipping-badge i {
    color: var(--primary-orange);
    font-size: 1.8rem;
}

/* ── Responsive Queries ── */
@media (max-width: 900px) {
    .login-container {
        flex-direction: column;
        gap: 2rem;
    }

    .features-list {
        align-items: center;
    }

    .shipping-badge {
        position: static;
        margin-top: 2rem;
    }
}

@media (max-width: 480px) {
    .login-card {
        padding: 1.5rem 1.2rem;
        border-radius: 20px;
    }

    .form-options {
        flex-direction: column;
        gap: 0.8rem;
        align-items: flex-start;
    }

    .showcase-title {
        font-size: 1.2rem;
    }
}
</style>
