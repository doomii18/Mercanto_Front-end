<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "../modules/auth";
import { healthApi } from "../api";
import CategoriesSection from "../components/category/CategoriesSection.vue";
import TopProductsSection from "../components/product/TopProductsSection.vue";
import TopProvidersSection from "../components/organization/TopProvidersSection.vue";

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.initialize();
  await healthApi.getReadiness().catch(() => null);
});
</script>

<template>
  <div class="home-page">
    <main>
      <section id="inicio" class="hero container section-spaced">
        <div class="hero-text">
          <h1>
            Encuentra los<br />mejores<br />
            <span class="highlight">distribuidores<br />mayoristas</span><br />
            para tu negocio
          </h1>
          <p>
            Compra al por mayor de manera fácil, segura y confiable.<br />
            Conecta con proveedores verificados y haz crecer tu negocio hoy.
          </p>
          <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="¿Qué producto estás buscando?"
            />
            <button class="btn-primary">Buscar productos</button>
          </div>
        </div>

        <div class="hero-image-wrapper">
          <div class="hero-tag">
            <i class="fa-solid fa-bag-shopping"></i> Plataforma de comercio #1 en Nicaragua
          </div>
          <img
            src="../assets/hero.png"
            alt="Distribución mayorista"
            class="hero-img"
          />
        </div>
      </section>

      <section class="features container section-spaced">
        <div class="feature-item">
          <div class="icon-circle">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <span>Proveedores verificados</span>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-item">
          <div class="icon-circle">
            <i class="fa-solid fa-tag"></i>
          </div>
          <span>Precios competitivos</span>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-item">
          <div class="icon-circle">
            <i class="fa-solid fa-truck"></i>
          </div>
          <span>Envíos a todo el país</span>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-item">
          <div class="icon-circle">
            <i class="fa-solid fa-bus"></i>
          </div>
          <span>Ahórrate el viaje</span>
        </div>
      </section>

      <div class="section-spaced">
        <CategoriesSection />
      </div>

      <div class="section-spaced">
        <TopProductsSection />
      </div>

      <div class="section-spaced">
        <TopProvidersSection />
      </div>

      <section id="como-funciona" class="how-it-works container section-spaced">
        <h2>¿Cómo funciona la plataforma?</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-badge">1</div>
            <p>Explora miles de productos al por mayor de proveedores verificados.</p>
          </div>
          <div class="step-card">
            <div class="step-badge">2</div>
            <p>Revisa calificaciones, precios y plazos de entrega en cada proveedor.</p>
          </div>
          <div class="step-card">
            <div class="step-badge">3</div>
            <p>Haz pedidos al por mayor de forma rápida y transparente para tu negocio.</p>
          </div>
          <div class="step-card">
            <div class="step-badge">4</div>
            <p>Obtén un envío confiable directo al destino de tu preferencia.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-spaced {
  margin-bottom: 5rem;
}

.btn-primary {
  background-color: var(--primary-orange);
  color: #ffffff;
  padding: 0.65rem 1.4rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-orange-hover, #e66000);
  transform: translateY(-2px);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin: 4rem auto;
  gap: 2rem;
}

.hero-text {
  flex: 1.1;
  max-width: 600px;
  position: relative;
}

.hero-text h1 {
  font-size: 3.2rem;
  line-height: 1.15;
  color: var(--primary-blue);
  margin-bottom: 1.2rem;
}

.hero-text h1 .highlight {
  color: var(--primary-orange);
}

.hero-text p {
  font-size: 1.05rem;
  color: #4a5568;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 30px;
  padding: 0.4rem 0.4rem 0.4rem 1.2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-bar i {
  color: #a0aec0;
  margin-right: 0.75rem;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: var(--text-dark);
}

.hero-image-wrapper {
  flex: 0.9;
  position: relative;
  display: flex;
  justify-content: center;
}

.hero-tag {
  position: absolute;
  top: -15px;
  right: 10px;
  background-color: var(--light-teal);
  color: var(--primary-blue);
  padding: 0.45rem 1rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  z-index: 2;
}

.hero-img {
  max-width: 100%;
  height: auto;
  border-radius: 20px;
  object-fit: cover;
}

.features {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 1.8rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-gray);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.95rem;
}

.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid var(--primary-orange);
  color: var(--primary-orange);
}

.feature-divider {
  width: 1px;
  height: 36px;
  background-color: var(--border-gray);
}

.how-it-works {
  text-align: center;
}

.how-it-works h2 {
  font-size: 2.2rem;
  color: var(--primary-blue);
  margin-bottom: 2.5rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.step-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-badge {
  width: 80px;
  height: 80px;
  background-color: var(--light-teal);
  color: var(--primary-blue);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.step-card p {
  color: var(--primary-blue);
  font-weight: 500;
  max-width: 220px;
  font-size: 0.92rem;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .hero-text h1 {
    font-size: 2.6rem;
  }
  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column-reverse;
    text-align: center;
    padding: 2rem 1rem;
  }

  .search-bar {
    flex-direction: column;
    border-radius: 16px;
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .search-bar input {
    width: 100%;
  }

  .search-bar .btn-primary {
    width: 100%;
    border-radius: 10px;
  }

  .features {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }

  .feature-divider {
    width: 100%;
    height: 1px;
  }
}

@media (max-width: 480px) {
  .hero-text h1 {
    font-size: 1.8rem;
  }
  .steps-grid {
    grid-template-columns: 1fr;
  }
}
</style>
