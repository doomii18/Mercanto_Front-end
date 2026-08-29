<script setup lang="ts">
import { onMounted, ref } from "vue";
import { authManager } from "../modules/auth";
import { healthApi, categoryApi } from "../api";
import type { ProductCategoryResponse } from "../api/services/category/types";
import CategoryImage from "../components/category/CategoryImage.vue";
import AppFooter from "../components/common/AppFooter.vue";

interface CategoryViewItem extends ProductCategoryResponse {
  productCount: number;
}

const isMenuOpen = ref(false);
const carousel = ref<HTMLElement | null>(null);
const categories = ref<CategoryViewItem[]>([]);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const scrollCarousel = (direction: "left" | "right") => {
  if (!carousel.value) return;
  const scrollAmount = 280;
  carousel.value.scrollBy({
    left: direction === "left" ? -scrollAmount : scrollAmount,
    behavior: "smooth",
  });
};

onMounted(async () => {
  await authManager.initialize();
  await healthApi.getReadiness().catch(() => null);

  try {
    const response = await categoryApi.getCategories({ limit: 50 });
    categories.value = response.data.map((cat) => ({
      ...cat,
      productCount: Math.floor(Math.random() * 600) + 50,
    }));
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
});
</script>

<template>
  <div class="home-page">
    <header class="header">
      <div class="container header-content">
        <div class="logo">
          <img
            src="../assets/logo.png"
            alt="Mercanto"
            class="logo-img"
          />
        </div>

        <button
          class="mobile-menu-btn"
          aria-label="Alternar navegación"
          @click="toggleMenu"
        >
          <i
            :class="
              isMenuOpen
                ? 'fa-solid fa-xmark'
                : 'fa-solid fa-bars'
            "
          ></i>
        </button>

        <nav :class="['nav-links', { open: isMenuOpen }]">
          <router-link :to="{ name: 'home' }" class="nav-btn" @click="closeMenu">Inicio</router-link>
          <router-link :to="{ name: 'category' }" class="nav-btn" @click="closeMenu">Categorías</router-link>
          <a href="#proveedores" class="nav-btn" @click="closeMenu">Proveedores</a>
          <a href="#como-funciona" class="nav-btn" @click="closeMenu">Como funciona</a>
          <router-link :to="{ name: 'orders' }" class="nav-btn" @click="closeMenu">Pedidos</router-link>
        </nav>

        <div :class="['auth-buttons', { open: isMenuOpen }]">
          <router-link
            :to="{ name: 'login' }"
            class="login-link"
            @click="closeMenu"
          >
            Iniciar sesión
          </router-link>
          <router-link
            :to="{ name: 'register' }"
            class="btn-primary"
            @click="closeMenu"
          >
            Registrarse
          </router-link>
        </div>
      </div>
    </header>

    <main>
      <section id="inicio" class="hero container">
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

      <section class="features container">
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

      <section id="categorias" class="categories container">
        <div class="categories-header">
          <h2>Categorías</h2>
          <p>Explora todas nuestras categorías de productos para ti</p>
        </div>

        <div class="carousel-wrapper">
          <button
            class="carousel-nav-btn prev"
            @click="scrollCarousel('left')"
            aria-label="Anterior"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>

          <div ref="carousel" class="categories-box">
            <router-link
              v-for="cat in categories"
              :key="cat.id"
              :to="{ name: 'category' }"
              class="category-card"
              style="text-decoration: none;"
            >
              <CategoryImage
                :blob-id="cat.image_blob_id"
                :alt="cat.name"
              />
              <p class="category-name">{{ cat.name }}</p>
              <span class="product-count">{{ cat.productCount }} Productos</span>
            </router-link>
          </div>

          <button
            class="carousel-nav-btn next"
            @click="scrollCarousel('right')"
            aria-label="Siguiente"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <section class="top-sellers container">
        <div class="top-sellers-header">
          <div class="top-sellers-title">
            <span class="badge-orange">
              <i class="fa-solid fa-fire"></i> Los más vendidos
            </span>
            <h2>
              Los productos<br />
              <span class="highlight-orange">más exitosos</span><br />
              del momento
            </h2>
            <p>Invierte en los productos más solicitados</p>
            <div class="benefits-badges">
              <div class="benefit-badge teal">
                <i class="fa-solid fa-store"></i>
                <span>Productos con excelente rotación y aceptación</span>
              </div>
              <div class="benefit-badge orange">
                <i class="fa-solid fa-chart-simple"></i>
                <span>Productos con mayor volumen de ventas</span>
              </div>
            </div>
          </div>
          <div class="top-sellers-image">
            <img
              src="../assets/top-sellers-hero.png"
              alt="Productos destacados"
            />
          </div>
        </div>

        <div class="products-grid">
          <router-link
            :to="{ name: 'product-detail', params: { id: 'mochila-adventure' } }"
            class="product-card"
          >
            <span class="badge-orange small"><i class="fa-solid fa-fire"></i> Los más vendidos</span>
            <img src="../assets/mochila.png" alt="Mochila Adventure" />
            <p class="product-category">Bolsos & Maletas</p>
            <div class="product-info">
              <h4>Mochila Adventure</h4>
              <span class="price">C$ 350</span>
            </div>
            <p class="min-order">Pedido mín. 1 und</p>
            <div class="provider-info">
              <i class="fa-solid fa-certificate badge-verified"></i>
              <span>Megaboutique S.A</span>
              <span class="rating">4.5 <i class="fa-solid fa-star"></i></span>
            </div>
            <div class="ranking-bubble orange">1</div>
          </router-link>

          <router-link
            :to="{ name: 'product-detail', params: { id: 'set-de-ollas' } }"
            class="product-card"
          >
            <span class="badge-orange small"><i class="fa-solid fa-fire"></i> Los más vendidos</span>
            <img src="../assets/utensilios.png" alt="Set de ollas 9 piezas" />
            <p class="product-category">Cocina</p>
            <div class="product-info">
              <h4>Set de ollas 9 piezas</h4>
              <span class="price">C$ 350</span>
            </div>
            <p class="min-order">Pedido mín. 1 und</p>
            <div class="provider-info">
              <i class="fa-solid fa-certificate badge-verified"></i>
              <span>Megaboutique S.A</span>
              <span class="rating">4.5 <i class="fa-solid fa-star"></i></span>
            </div>
            <div class="ranking-bubble teal">2</div>
          </router-link>

          <router-link
            :to="{ name: 'product-detail', params: { id: 'tablet-para-ninos' } }"
            class="product-card"
          >
            <span class="badge-orange small"><i class="fa-solid fa-fire"></i> Los más vendidos</span>
            <img src="../assets/tableta.png" alt="Tablet para niños" />
            <p class="product-category">Artículos tecnológicos</p>
            <div class="product-info">
              <h4>Tablet para niños</h4>
              <span class="price">C$ 950</span>
            </div>
            <p class="min-order">Pedido mín. 1 und</p>
            <div class="provider-info">
              <i class="fa-solid fa-certificate badge-verified"></i>
              <span>Megaboutique S.A</span>
              <span class="rating">4.5 <i class="fa-solid fa-star"></i></span>
            </div>
            <div class="ranking-bubble blue">3</div>
          </router-link>

          <router-link
            :to="{ name: 'product-detail', params: { id: 'paleta-de-sombras' } }"
            class="product-card"
          >
            <span class="badge-orange small"><i class="fa-solid fa-fire"></i> Los más vendidos</span>
            <img src="../assets/paleta.png" alt="Paleta de sombras" />
            <p class="product-category">Makeup & Cuidado personal</p>
            <div class="product-info">
              <h4>Paleta de sombras</h4>
              <span class="price">C$ 350</span>
            </div>
            <p class="min-order">Pedido mín. 1 und</p>
            <div class="provider-info">
              <i class="fa-solid fa-certificate badge-verified"></i>
              <span>Megaboutique S.A</span>
              <span class="rating">4.5 <i class="fa-solid fa-star"></i></span>
            </div>
            <div class="ranking-bubble grey">4</div>
          </router-link>
        </div>
      </section>

      <section id="proveedores" class="top-providers container">
        <h2>Nuestros proveedores más <span class="highlight-orange">TOP</span></h2>
        <div class="providers-grid">
          <div class="provider-card">
            <div class="provider-avatar"><i class="fa-solid fa-user"></i></div>
            <h4>Megaboutique S.A.R</h4>
            <div class="verified-icon"><i class="fa-solid fa-certificate"></i></div>
            <p class="provider-status">Proveedor verificado</p>
            <div class="provider-rating">
              <span class="score">4.5</span>
              <i class="fa-solid fa-star"></i>
            </div>
            <p class="provider-location">San Ramón, Matagalpa</p>
            <button class="btn-orange">Ver catálogo</button>
          </div>

          <div class="provider-card">
            <div class="provider-avatar"><i class="fa-solid fa-user"></i></div>
            <h4>Global Textiles Ltd</h4>
            <div class="verified-icon"><i class="fa-solid fa-certificate"></i></div>
            <p class="provider-status">Proveedor verificado</p>
            <div class="provider-rating">
              <span class="score">4.2</span>
              <i class="fa-solid fa-star"></i>
            </div>
            <p class="provider-location">San Ramón, Matagalpa</p>
            <button class="btn-orange">Ver catálogo</button>
          </div>

          <div class="provider-card">
            <div class="provider-avatar"><i class="fa-solid fa-user"></i></div>
            <h4>Nacional Textiles Ltd</h4>
            <div class="verified-icon"><i class="fa-solid fa-certificate"></i></div>
            <p class="provider-status">Proveedor verificado</p>
            <div class="provider-rating">
              <span class="score">4.0</span>
              <i class="fa-solid fa-star"></i>
            </div>
            <p class="provider-location">San Ramón, Matagalpa</p>
            <button class="btn-orange">Ver catálogo</button>
          </div>
        </div>

        <div class="view-all-wrapper">
          <a href="#" class="btn-outline">
            Ver todos <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </section>

      <section id="como-funciona" class="how-it-works container">
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

    <AppFooter />
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

.header {
  background-color: #fff4ec;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-img {
  height: 42px;
  display: block;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--primary-blue);
  cursor: pointer;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-links a,
.nav-links .nav-btn {
  text-decoration: none;
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1.1rem;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.nav-links a:hover,
.nav-links .nav-btn:hover {
  background-color: #ffebd9;
  color: var(--primary-orange);
  box-shadow: 0 3px 10px rgba(255, 106, 0, 0.15);
  transform: translateY(-1px);
}

.nav-links a.active-nav-highlight,
.nav-links a.router-link-exact-active {
  background-color: #ffd8bd;
  color: var(--primary-orange);
  font-weight: 700;
  box-shadow: 0 3px 12px rgba(255, 106, 0, 0.2);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.login-link {
  text-decoration: none;
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.95rem;
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
  padding: 3.5rem 1.5rem;
  position: relative;
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
  margin: 2rem auto 4rem auto;
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

.categories {
  margin-bottom: 5rem;
}

.categories-header {
  text-align: center;
  margin-bottom: 2rem;
}

.categories-header h2 {
  font-size: 2.2rem;
  color: var(--primary-blue);
  margin-bottom: 0.4rem;
}

.categories-header p {
  color: #718096;
}

.carousel-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.categories-box {
  background-color: var(--light-teal);
  padding: 1.8rem;
  border-radius: 24px;
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  width: 100%;
  scrollbar-width: none;
}

.categories-box::-webkit-scrollbar {
  display: none;
}

.category-card {
  flex: 0 0 220px;
  background-color: #ffffff;
  border-radius: 18px;
  padding: 1.5rem 1rem;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 3 / 4;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.category-name {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.product-count {
  color: #a0aec0;
  font-size: 0.8rem;
}

.carousel-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid var(--border-gray);
  color: var(--primary-blue);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;
}

.carousel-nav-btn:hover {
  transform: translateY(-50%) scale(1.08);
}

.carousel-nav-btn.prev {
  left: -20px;
}

.carousel-nav-btn.next {
  right: -20px;
}

.top-sellers {
  margin-bottom: 5rem;
}

.top-sellers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  gap: 2rem;
}

.top-sellers-title {
  flex: 1.2;
}

.badge-orange {
  background-color: #ffe8d6;
  color: var(--primary-orange);
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.badge-orange.small {
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  margin-bottom: 0.5rem;
}

.top-sellers-title h2 {
  font-size: 2.5rem;
  color: var(--primary-blue);
  line-height: 1.15;
  margin-bottom: 0.75rem;
}

.highlight-orange {
  color: var(--primary-orange);
}

.top-sellers-title p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.benefits-badges {
  display: flex;
  gap: 1rem;
}

.benefit-badge {
  padding: 0.85rem 1.1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  max-width: 220px;
  line-height: 1.35;
}

.benefit-badge i {
  font-size: 1.4rem;
}

.benefit-badge.teal {
  background-color: #d8f1ef;
  color: var(--primary-blue);
  border: 1.5px solid var(--light-teal);
}

.benefit-badge.orange {
  background-color: #ffe8d6;
  color: var(--primary-orange);
  border: 1.5px solid #ffcca3;
}

.top-sellers-image {
  flex: 0.8;
  display: flex;
  justify-content: flex-end;
}

.top-sellers-image img {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.product-card {
  background: #ffffff;
  border: 2px solid var(--primary-orange);
  border-radius: 18px;
  padding: 1.25rem;
  position: relative;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(255, 106, 0, 0.15);
}

.product-card img {
  width: 100%;
  height: 160px;
  object-fit: contain;
  margin-bottom: 0.75rem;
}

.product-category {
  font-size: 0.72rem;
  color: #718096;
  text-align: center;
  margin-bottom: 0.4rem;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.product-info h4 {
  font-size: 0.9rem;
  color: var(--primary-blue);
  font-weight: 600;
}

.product-info .price {
  color: var(--primary-orange);
  font-weight: 700;
}

.min-order {
  font-size: 0.72rem;
  color: #718096;
  text-align: right;
  margin-bottom: 0.75rem;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #4a5568;
  border-top: 1px solid var(--border-gray);
  padding-top: 0.75rem;
  margin-top: auto;
}

.badge-verified {
  color: #0284c7;
}

.provider-info .rating {
  margin-left: auto;
  font-weight: 700;
  color: var(--text-dark);
}

.provider-info .rating i {
  color: var(--primary-orange);
}

.ranking-bubble {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
}

.ranking-bubble.orange {
  background-color: var(--primary-orange);
}
.ranking-bubble.teal {
  background-color: #0d9488;
}
.ranking-bubble.blue {
  background-color: var(--primary-blue);
}
.ranking-bubble.grey {
  background-color: #64748b;
}

.top-providers {
  text-align: center;
  margin-bottom: 5rem;
}

.top-providers h2 {
  font-size: 2.2rem;
  color: var(--primary-blue);
  margin-bottom: 2.5rem;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.provider-card {
  background: #ffffff;
  border: 2px solid var(--primary-orange);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: transform 0.2s ease;
}

.provider-card:hover {
  transform: translateY(-4px);
}

.provider-avatar {
  width: 72px;
  height: 72px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.4rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.provider-card h4 {
  font-size: 1.15rem;
  color: var(--primary-blue);
  margin-bottom: 0.4rem;
}

.verified-icon {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-size: 1.5rem;
  color: #0284c7;
}

.provider-status {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.6rem;
}

.provider-rating {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-blue);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.provider-rating i {
  color: var(--primary-orange);
  font-size: 1.2rem;
}

.provider-location {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.2rem;
}

.btn-orange {
  background-color: var(--primary-orange);
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.view-all-wrapper {
  text-align: right;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--light-teal);
  border: 2px solid var(--light-teal);
  padding: 0.5rem 1.4rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
}

.how-it-works {
  text-align: center;
  margin-bottom: 5rem;
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
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .providers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
  }

  .nav-links {
    display: none;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    margin-top: 0.75rem;
    order: 3;
  }

  .nav-links.open {
    display: flex;
  }

  .auth-buttons {
    display: none;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
    order: 4;
    padding-bottom: 0.5rem;
  }

  .auth-buttons.open {
    display: flex;
  }

  .mobile-menu-btn {
    display: block;
  }

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

  .top-sellers-header {
    flex-direction: column;
    text-align: center;
  }

  .benefits-badges {
    justify-content: center;
    flex-wrap: wrap;
  }

  .providers-grid {
    grid-template-columns: 1fr;
  }

  .view-all-wrapper {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .hero-text h1 {
    font-size: 1.8rem;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
  .steps-grid {
    grid-template-columns: 1fr;
  }
  .carousel-nav-btn {
    display: none;
  }
}
</style>
