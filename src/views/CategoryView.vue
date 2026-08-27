<script setup lang="ts">
import { ref } from "vue";
import logoImg from "../assets/logo.png";
import audifonosImg from "../assets/audifonos.png";
import tabletaImg from "../assets/tableta.png";
import AppFooter from "../components/common/AppFooter.vue";

interface ProductItem {
  id: number;
  title: string;
  category: string;
  price: string;
  minOrder: string;
  provider: string;
  rating: number;
  image: string;
  rank: number;
  isWishlist: boolean;
}

const activeCategoryIndex = ref(0);
const searchFilter = ref("");
const categoriesList = ref([
  { id: 1, icon: "fa-solid fa-screwdriver-wrench" },
  { id: 2, icon: "fa-solid fa-plug" },
  { id: 3, icon: "fa-solid fa-ring" },
  { id: 4, icon: "fa-solid fa-shirt" },
  { id: 5, icon: "fa-solid fa-user-tie" },
  { id: 6, icon: "fa-solid fa-horse" },
  { id: 7, icon: "fa-solid fa-utensils" },
]);

const products = ref<ProductItem[]>([
  {
    id: 1,
    title: "Laptop Adventure",
    category: "Artículos tecnológicos",
    price: "C$ 2350",
    minOrder: "Pedido mín. 12 und",
    provider: "NicaTech S.A.",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80",
    rank: 1,
    isWishlist: false,
  },
  {
    id: 2,
    title: "Samsung S26 Ultra",
    category: "Artículos tecnológicos",
    price: "C$ 23350",
    minOrder: "Pedido mín. 12 und",
    provider: "Mangua Labs S.A.",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
    rank: 2,
    isWishlist: false,
  },
  {
    id: 3,
    title: "Tablet para niños",
    category: "Artículos tecnológicos",
    price: "C$ 950",
    minOrder: "Pedido mín. 12 und",
    provider: "Mangua Labs S.A.",
    rating: 4.5,
    image: tabletaImg,
    rank: 3,
    isWishlist: false,
  },
  {
    id: 4,
    title: "Smart Watch Apple",
    category: "Artículos tecnológicos",
    price: "C$ 350",
    minOrder: "Pedido mín. 12 und",
    provider: "Apante Software",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&q=80",
    rank: 4,
    isWishlist: false,
  },
  {
    id: 5,
    title: "Consola de video",
    category: "Artículos tecnológicos",
    price: "C$ 850",
    minOrder: "Pedido mín. 12 und",
    provider: "Apante Software",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&q=80",
    rank: 1,
    isWishlist: false,
  },
  {
    id: 6,
    title: "Set de cámaras",
    category: "Artículos tecnológicos",
    price: "C$ 660",
    minOrder: "Pedido mín. 12 und",
    provider: "NicaTech S.A.",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&q=80",
    rank: 2,
    isWishlist: false,
  },
  {
    id: 7,
    title: "Usb 64Gb - HP",
    category: "Artículos tecnológicos",
    price: "C$ 250",
    minOrder: "Pedido mín. 12 und",
    provider: "Mangua Labs S.A.",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1622535056705-4171a824b7a4?w=400&q=80",
    rank: 3,
    isWishlist: false,
  },
  {
    id: 8,
    title: "Cargador Samsung",
    category: "Artículos tecnológicos",
    price: "C$ 150",
    minOrder: "Pedido mín. 12 und",
    provider: "NicaTech S.A.",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=400&q=80",
    rank: 4,
    isWishlist: false,
  },
]);

const featuredProviders = ref([
  {
    name: "NicaTech S.A.",
    rating: "4.5",
    location: "León, El viejo",
  },
  {
    name: "Apante Software",
    rating: "4.2",
    location: "San Ramón, Matagalpa",
  },
  {
    name: "Mangua Labs S.A.",
    rating: "4.0",
    location: "Managua, Managua",
  },
]);

const toggleWishlist = (product: ProductItem) => {
  product.isWishlist = !product.isWishlist;
};
</script>

<template>
  <div class="category-view">
    <header class="top-header">
      <div class="logo">
        <router-link :to="{ name: 'home' }">
          <img :src="logoImg" alt="Mercanto" class="logo-icon" />
        </router-link>
      </div>
      <nav class="nav-links">
        <router-link :to="{ name: 'home', hash: '#inicio' }">Inicio</router-link>
        <router-link :to="{ name: 'home', hash: '#categorias' }">Categorías</router-link>
        <router-link :to="{ name: 'home', hash: '#proveedores' }">Proveedores</router-link>
        <router-link :to="{ name: 'home', hash: '#como-funciona' }">Cómo funciona</router-link>
      </nav>
      <div class="auth-buttons">
        <router-link :to="{ name: 'login' }" class="login-btn">Iniciar sesión</router-link>
        <router-link :to="{ name: 'register' }" class="register-btn">Registrarse</router-link>
      </div>
    </header>

    <main class="category-page-container">
      <section class="category-hero">
        <div class="hero-left">
          <img :src="audifonosImg" alt="Artículos Tecnológicos" class="hero-image-main" />
        </div>
        <div class="hero-center">
          <h1>Artículos Tecnológicos</h1>
          <p>Encuentra los mejores artículos tecnológicos al por mayor para tu negocio</p>
          <div class="badge-products">
            <i class="fa-solid fa-bag-shopping"></i>
            <span>200 Productos disponibles</span>
          </div>
        </div>
        <div class="hero-right">
          <div class="circles-graphic">
            <div class="circle circle-teal"></div>
            <div class="circle circle-orange"></div>
            <div class="circle circle-darkblue"></div>
          </div>
        </div>
      </section>

      <section class="explore-categories">
        <h3>Explora otras categorías</h3>
        <div class="categories-carousel-wrapper">
          <button type="button" class="carousel-arrow"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="categories-list">
            <div
              v-for="(cat, idx) in categoriesList"
              :key="cat.id"
              :class="['category-icon-item', { active: activeCategoryIndex === idx }]"
              @click="activeCategoryIndex = idx"
            >
              <div class="icon-circle">
                <i :class="cat.icon"></i>
              </div>
            </div>
          </div>
          <button type="button" class="carousel-arrow"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </section>

      <section class="search-sort-bar">
        <div class="search-box-wrapper">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input v-model="searchFilter" type="text" placeholder="Buscar en Artículos Tecnológicos" />
          <button type="button" class="btn-orange">Buscar productos</button>
        </div>
        <div class="sort-filter-wrapper">
          <div class="sort-select">
            <span>Ordenar por: <strong>Más Relevantes</strong></span>
          </div>
          <button type="button" class="btn-filter"><i class="fa-solid fa-bars"></i></button>
        </div>
      </section>

      <section class="products-catalog">
        <div class="catalog-header">
          <span>Mostrando 1-8 de 200 productos</span>
        </div>

        <div class="products-grid">
          <div v-for="prod in products" :key="prod.id" class="product-card">
            <button
              type="button"
              :class="['btn-wishlist', { active: prod.isWishlist }]"
              @click="toggleWishlist(prod)"
            >
              <i :class="prod.isWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
            </button>
            <div class="product-img-wrapper">
              <img :src="prod.image" :alt="prod.title" />
            </div>
            <div class="card-info">
              <span class="category-label">{{ prod.category }}</span>
              <h4 class="product-title">{{ prod.title }}</h4>
              <div class="price-min-order">
                <span class="price">{{ prod.price }}</span>
                <span class="min-order">{{ prod.minOrder }}</span>
              </div>
              <div class="provider-info">
                <div class="provider-details">
                  <i class="fa-solid fa-circle-check verified-icon"></i>
                  <span class="provider-name">{{ prod.provider }}</span>
                </div>
                <div class="rating-info">
                  <i class="fa-regular fa-user"></i>
                  <span class="rating">{{ prod.rating }} <i class="fa-solid fa-star star-filled"></i></span>
                </div>
              </div>
            </div>
            <div :class="['rank-badge', `rank-${prod.rank}`]">{{ prod.rank }}</div>
          </div>
        </div>

        <div class="load-more-wrapper">
          <button type="button" class="btn-load-more">
            Cargar más productos <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </section>

      <section class="featured-providers">
        <h2>Proveedores destacados de Artículos Tecnológicos</h2>
        <div class="providers-grid">
          <div v-for="(prov, idx) in featuredProviders" :key="idx" class="provider-card">
            <div class="provider-avatar">
              <i class="fa-regular fa-user"></i>
            </div>
            <h4>{{ prov.name }}</h4>
            <div class="verified-badge">
              <i class="fa-solid fa-certificate"></i>
              <span>Proveedor verificado</span>
            </div>
            <div class="provider-rating">
              <strong>{{ prov.rating }}</strong>
              <i class="fa-solid fa-star star-filled"></i>
            </div>
            <p class="provider-location">{{ prov.location }}</p>
            <button type="button" class="btn-catalog">Ver catálogo</button>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.category-view {
  min-height: 100vh;
  background-color: #ffffff;
  color: #023859;
}

.top-header {
  background-color: #fdf5f4;
  padding: 1.25rem 3rem;
  border-bottom: 2px solid #dcdcdc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-icon {
  height: 48px;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #023859;
  font-weight: 500;
  font-size: 0.95rem;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.login-btn {
  text-decoration: none;
  color: #023859;
  font-weight: 600;
}

.register-btn {
  text-decoration: none;
  background-color: #ff6a00;
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
}

.category-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.category-hero {
  background-color: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 20px;
  padding: 2.5rem;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.hero-left {
  display: flex;
  justify-content: center;
}

.hero-image-main {
  max-height: 150px;
  object-fit: contain;
}

.hero-center h1 {
  font-size: 2.2rem;
  color: #023859;
  margin-bottom: 0.8rem;
  font-weight: 700;
}

.hero-center p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.badge-products {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e2f4f2;
  color: #00a896;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.hero-right {
  display: flex;
  justify-content: flex-end;
}

.circles-graphic {
  position: relative;
  width: 120px;
  height: 120px;
}

.circle {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.circle-teal {
  background-color: #00a896;
  top: 25px;
  left: 10px;
  z-index: 2;
}

.circle-orange {
  background-color: #ff6a00;
  top: 5px;
  left: 45px;
  z-index: 1;
}

.circle-darkblue {
  background-color: #023859;
  top: 50px;
  left: 45px;
  z-index: 3;
}

.explore-categories {
  background-color: #f5f7f9;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
}

.explore-categories h3 {
  font-size: 1rem;
  color: #023859;
  margin-bottom: 1rem;
  font-weight: 600;
}

.categories-carousel-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.carousel-arrow {
  background: transparent;
  border: none;
  color: #ff6a00;
  font-size: 1.5rem;
  cursor: pointer;
}

.categories-list {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
  overflow-x: auto;
}

.category-icon-item {
  cursor: pointer;
}

.category-icon-item .icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #cdece8;
  color: #00a896;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.category-icon-item.active .icon-circle {
  background-color: #00a896;
  color: #ffffff;
}

.search-sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.search-box-wrapper {
  flex: 2;
  display: flex;
  align-items: center;
  border: 1px solid #dcdcdc;
  border-radius: 30px;
  padding: 0.3rem 0.3rem 0.3rem 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-icon {
  color: #888;
  margin-right: 0.8rem;
  font-size: 1.1rem;
}

.search-box-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

.search-box-wrapper .btn-orange {
  background-color: #ff6a00;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.sort-filter-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.sort-select {
  border: 1px solid #dcdcdc;
  border-radius: 20px;
  padding: 0.7rem 1.5rem;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
  color: #555;
}

.sort-select strong {
  color: #ff6a00;
}

.btn-filter {
  background: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 12px;
  width: 45px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.products-catalog {
  background-color: #f5f7f9;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
}

.catalog-header {
  margin-bottom: 1.5rem;
  font-weight: 600;
  color: #023859;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.product-card {
  background-color: #ffffff;
  border: 2px solid #00a896;
  border-radius: 15px;
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.btn-wishlist {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #ff4d4d;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;
}

.btn-wishlist:hover {
  transform: scale(1.2);
}

.product-img-wrapper {
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.product-img-wrapper img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-label {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.product-title {
  font-size: 0.95rem;
  color: #023859;
  margin-bottom: 0.8rem;
  font-weight: 600;
  min-height: 38px;
}

.price-min-order {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ff6a00;
}

.min-order {
  font-size: 0.75rem;
  color: #666;
}

.provider-info {
  border-top: 1px solid #eee;
  padding-top: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.provider-details {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.verified-icon {
  color: #00a8ff;
}

.provider-name {
  color: #555;
  font-weight: 500;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #777;
}

.star-filled {
  color: #ffaa00;
}

.rank-badge {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.rank-1 { background-color: #ff6a00; }
.rank-2 { background-color: #00a896; }
.rank-3 { background-color: #023859; }
.rank-4 { background-color: #888888; }

.load-more-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
}

.btn-load-more {
  background: #ffffff;
  border: 1px solid #00a896;
  color: #00a896;
  padding: 0.8rem 2.5rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.featured-providers {
  margin-bottom: 4rem;
}

.featured-providers h2 {
  font-size: 1.6rem;
  color: #023859;
  text-align: center;
  margin-bottom: 2.5rem;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.provider-card {
  border: 2px solid #ff6a00;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.provider-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid #023859;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem auto;
  color: #023859;
}

.provider-card h4 {
  font-size: 1.2rem;
  color: #023859;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #00a8ff;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
  font-weight: 600;
}

.provider-rating {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.provider-location {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.btn-catalog {
  width: 100%;
  background-color: #ff6a00;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}

@media (max-width: 900px) {
  .category-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-right {
    justify-content: center;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .providers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .top-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  .nav-links {
    display: none;
  }
  .search-sort-bar {
    flex-direction: column;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
