<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import logoImg from "../assets/logo.png";
import tabletaImg from "../assets/tableta.png";
import AppFooter from "../components/common/AppFooter.vue";
import CategoryHeroCard from "../components/category/CategoryHeroCard.vue";
import CategoryPicker from "../components/category/CategoryPicker.vue";

const router = useRouter();

const goToProduct = (product: ProductItem) => {
  const param = product.id === 1 ? "laptop-adventure" : product.id.toString();
  router.push({ name: "product-detail", params: { id: param } });
};

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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
    minOrder: "Pedido mín. 1 und",
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
        <router-link :to="{ name: 'home' }">Inicio</router-link>
        <router-link :to="{ name: 'category' }">Categorías</router-link>
        <router-link :to="{ name: 'home', hash: '#proveedores' }">Proveedores</router-link>
        <router-link :to="{ name: 'home', hash: '#como-funciona' }">Cómo funciona</router-link>
        <router-link :to="{ name: 'orders' }">Pedidos</router-link>
      </nav>
      <div class="auth-buttons">
        <router-link :to="{ name: 'login' }" class="login-btn">Iniciar sesión</router-link>
        <router-link :to="{ name: 'register' }" class="register-btn">Registrarse</router-link>
      </div>
    </header>

    <main class="category-page-container">
      <CategoryHeroCard />

      <CategoryPicker
        v-model="activeCategoryIndex"
        :categories="categoriesList"
      />

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
          <div
            v-for="prod in products"
            :key="prod.id"
            class="product-card"
            style="cursor: pointer;"
            @click="goToProduct(prod)"
          >
            <button
              type="button"
              :class="['btn-wishlist', { active: prod.isWishlist }]"
              @click.stop="toggleWishlist(prod)"
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
  align-items: center;
  gap: 0.75rem;
}

.nav-links a {
  text-decoration: none;
  color: #023859;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1.1rem;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-links a:hover {
  background-color: #ffebd9;
  color: #ff6a00;
  box-shadow: 0 3px 10px rgba(255, 106, 0, 0.15);
  transform: translateY(-1px);
}

.nav-links a.router-link-active,
.nav-links a.router-link-exact-active {
  background-color: #ffd8bd;
  color: #ff6a00;
  font-weight: 700;
  box-shadow: 0 3px 12px rgba(255, 106, 0, 0.2);
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
  transform: scale(1.15);
}

.product-img-wrapper {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.product-img-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.category-label {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.product-title {
  font-size: 0.95rem;
  color: #023859;
  margin-bottom: 0.6rem;
  font-weight: 600;
}

.price-min-order {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.8rem;
}

.price {
  font-weight: 700;
  color: #ff6a00;
  font-size: 1.05rem;
}

.min-order {
  font-size: 0.75rem;
  color: #888;
}

.provider-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.6rem;
  margin-top: auto;
}

.provider-details {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #555;
}

.verified-icon {
  color: #00a896;
  font-size: 0.85rem;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #888;
}

.rating {
  font-weight: 600;
  color: #333;
}

.star-filled {
  color: #ffaa00;
}

.rank-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
}

.rank-1 { background-color: #ff6a00; }
.rank-2 { background-color: #00a896; }
.rank-3 { background-color: #023859; }
.rank-4 { background-color: #718096; }

.load-more-wrapper {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  background-color: #ffffff;
  border: 2px solid #00a896;
  padding: 0.65rem 2rem;
  border-radius: 25px;
  color: #00a896;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s, color 0.2s;
}

.btn-load-more:hover {
  background-color: #e6f6f5;
}

.featured-providers {
  margin-bottom: 4rem;
}

.featured-providers h2 {
  font-size: 1.8rem;
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
  background: #ffffff;
  border: 2px solid #ff6a00;
  border-radius: 20px;
  padding: 2.2rem 1.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.provider-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #f5f7f9;
  border: 2px solid #023859;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: #023859;
  margin-bottom: 1rem;
}

.provider-card h4 {
  font-size: 1.15rem;
  color: #023859;
  margin-bottom: 0.4rem;
  font-weight: 700;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #00a896;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.provider-rating {
  font-size: 1.2rem;
  color: #023859;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.provider-location {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.btn-catalog {
  background-color: #ff6a00;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: opacity 0.2s ease;
}

.btn-catalog:hover {
  opacity: 0.92;
}

@media (max-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .providers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  .top-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
  .search-sort-bar {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
