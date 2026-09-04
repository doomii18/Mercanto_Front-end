<script setup lang="ts">
import AppLogo from '@/components/common/AppLogo.vue';


</script>

<template>
    <div class="registro-wrapper">
        <div class="registro-container">
            <!-- Left Branding & Summary Panel -->
            <section class="registro-left">
                <AppLogo class="h-14 md:h-16" />

                <h2 class="registro-left-title">
                    Únete a Mercanto<br />y haz crecer tu negocio
                </h2>

                <div class="registro-hero-image">
                    <img
                        src="../assets/login_hero.png"
                        alt="Comercio digital mayorista"
                    />
                </div>

                <p class="registro-tagline">
                    Conectando negocios,<br />acercando oportunidades.
                </p>

                <div class="registro-login-cta">
                    <p>¿Ya tienes cuenta?</p>
                    <router-link :to="{ name: 'login' }" class="btn-login-redirect">
                        Iniciar sesión <i class="fa-solid fa-arrow-right"></i>
                    </router-link>
                </div>
            </section>

            <!-- Right Account Selection Panel -->
            <section class="registro-right">
                <div class="registro-bag-icon" aria-hidden="true">
                    <svg class="bag-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 35 30 C 35 15, 65 15, 65 30" stroke="white" stroke-width="4" fill="none" />
                        <polygon points="25,30 75,30 70,80 30,80" stroke="white" stroke-width="4" fill="none" stroke-linejoin="round" />
                        <circle cx="42" cy="50" r="4" fill="white" stroke="none" />
                        <circle cx="58" cy="50" r="4" fill="white" stroke="none" />
                        <path d="M 42 62 Q 50 70 58 62" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" />
                    </svg>
                </div>

                <h2 class="registro-right-title">
                    ¿Cómo te quieres<br />registrar?
                </h2>

                <p class="registro-right-subtitle">
                    Selecciona el tipo de cuenta que mejor se adapte a tu actividad
                </p>

                <div class="role-cards">
                    <!-- Buyer Card -->
                    <router-link :to="{ name: 'buyer-register' }" class="role-card comprador">
                        <div class="role-icon">
                            <i class="fa-solid fa-people-arrows"></i>
                        </div>
                        <h4>Comprador</h4>
                        <p>
                            Encuentra los mejores proveedores para impulsar tu negocio y accede a
                            <span>precios mayoristas</span>.
                        </p>
                        <span class="btn-registrarme">Registrarme</span>
                    </router-link>

                    <!-- Supplier Card -->
                    <router-link :to="{ name: 'provider-register' }" class="role-card proveedor">
                        <div class="role-icon">
                            <i class="fa-solid fa-store"></i>
                        </div>
                        <h4>Proveedor</h4>
                        <p>
                            Vende tus productos por volumen y expande tu cobertura en
                            <span>todo el país</span>.
                        </p>
                        <span class="btn-registrarme">Registrarme</span>
                    </router-link>
                </div>

                <p class="registro-footer-text">¡Todo en un solo lugar!</p>
            </section>
        </div>
    </div>
</template>

<style scoped>
.registro-wrapper {
    min-height: 100vh;
    width: 100%;
    display: flex;
    background-color: var(--bg-light);
}

.registro-container {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    min-height: 100vh;
}

/* ── Panel Izquierdo ── */
.registro-left {
    flex: 1;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 2.5rem;
    background-color: var(--bg-light);
}

.registro-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
}

.brand-logo {
    height: 60px;
    object-fit: contain;
}

.registro-left-title {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.25;
    margin-bottom: 1.5rem;
    color: var(--primary-blue);
}

.registro-hero-image {
    width: 100%;
    max-width: 280px;
    margin: 0 auto 1.5rem auto;
}

.registro-hero-image img {
    width: 100%;
    display: block;
    object-fit: contain;
}

.registro-tagline {
    font-size: 1.05rem;
    color: var(--light-teal);
    margin-bottom: 1.75rem;
    line-height: 1.4;
    font-weight: 600;
}

.registro-login-cta {
    text-align: center;
}

.registro-login-cta p {
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
    color: var(--primary-blue);
    font-weight: 500;
}

.btn-login-redirect {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2rem;
    background-color: var(--primary-orange);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.2s ease, background-color 0.2s ease;
}

.btn-login-redirect:hover {
    background-color: var(--primary-orange-hover, #e66000);
    transform: translateY(-2px);
}

/* ── Panel Derecho ── */
.registro-right {
    flex: 1.2;
    min-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-blue);
    border-radius: 50px 0 0 50px;
    padding: 3.5rem 2rem;
    color: #ffffff;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
}

.registro-bag-icon {
    margin-bottom: 0.5rem;
}

.bag-icon-svg {
    width: 85px;
    height: 85px;
    stroke: #ffffff;
    stroke-width: 2;
    fill: none;
}

.registro-right-title {
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
    color: var(--primary-orange);
    line-height: 1.2;
    margin-bottom: 0.75rem;
}

.registro-right-subtitle {
    text-align: center;
    font-size: 1rem;
    color: #ffffff;
    margin-bottom: 2.5rem;
    max-width: 360px;
    line-height: 1.4;
    opacity: 0.9;
}

/* ── Role Selection Cards ── */
.role-cards {
    display: flex;
    gap: 1.5rem;
    width: 100%;
    max-width: 580px;
    margin-bottom: 2rem;
}

.role-card {
    flex: 1;
    background: var(--bg-light);
    border-radius: 20px;
    padding: 2.2rem 1.4rem 1.8rem 1.4rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.role-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.role-card.comprador {
    border: 3.5px solid var(--primary-orange);
}

.role-card.proveedor {
    border: 3.5px solid var(--light-teal);
}

.role-icon {
    font-size: 2.3rem;
    margin-bottom: 1rem;
}

.role-card.comprador .role-icon {
    color: var(--primary-orange);
}

.role-card.proveedor .role-icon {
    color: var(--light-teal);
}

.role-card h4 {
    font-size: 1.35rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
}

.role-card.comprador h4 {
    color: var(--primary-orange);
}

.role-card.proveedor h4 {
    color: var(--light-teal);
}

.role-card p {
    font-size: 0.9rem;
    color: var(--text-dark);
    line-height: 1.45;
    margin-bottom: 1.75rem;
}

.role-card.comprador p span {
    color: var(--primary-orange);
    font-weight: 600;
}

.role-card.proveedor p span {
    color: var(--light-teal);
    font-weight: 600;
}

.btn-registrarme {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
    width: 100%;
    margin-top: auto;
    display: inline-block;
    transition: opacity 0.2s ease;
}

.role-card:hover .btn-registrarme {
    opacity: 0.92;
}

.role-card.comprador .btn-registrarme {
    background-color: var(--primary-orange);
}

.role-card.proveedor .btn-registrarme {
    background-color: var(--light-teal);
}

.registro-footer-text {
    font-size: 0.95rem;
    color: #ffffff;
    text-align: center;
    opacity: 0.85;
}

/* ── Responsive Queries ── */
@media (max-width: 900px) {
    .registro-container {
        flex-direction: column;
    }

    .registro-right {
        border-radius: 40px 40px 0 0;
        width: 100%;
        padding: 3rem 1.5rem;
    }

    .registro-left {
        padding: 2.5rem 1.5rem;
    }
}

@media (max-width: 580px) {
    .role-cards {
        flex-direction: column;
    }

    .registro-left-title,
    .registro-right-title {
        font-size: 1.65rem;
    }
}
</style>
