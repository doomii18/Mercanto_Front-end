<script setup lang="ts">
import { ref, onMounted } from "vue";
import { cartApi, quoteApi } from "@/api";

const cartCount = ref<number | null>(null);
const ordersCount = ref<number | null>(null);

onMounted(async () => {
  try {

    const cartPromise = cartApi.getMyCartProducts()
      .then(items => items.length)
      .catch(() => 0);


    const ordersPromise = quoteApi.getMyQuotes({ limit: 0 })
      .then(res => res.total)
      .catch(() => 0);

    const [cart, orders] = await Promise.all([cartPromise, ordersPromise]);

    cartCount.value = cart;
    ordersCount.value = orders;
  } catch (error) {
    console.error("Failed to load buyer stats:", error);
  }
});
</script>

<template>
  <div class="stats-cards">
    <div class="stat-card">
      <div class="stat-icon-circle">
        <i class="fa-solid fa-cart-shopping"></i>
      </div>
      <div class="stat-text">
        <p class="stat-title">Productos en Carrito</p>
        <h3>{{ cartCount !== null ? cartCount : '...' }}</h3>
        <router-link :to="{ name: 'orders' }" class="stat-link">ver mi carrito</router-link>
      </div>
    </div>

    <div class="stat-divider"></div>

    <div class="stat-card">
      <div class="stat-icon-circle">
        <i class="fa-solid fa-bag-shopping"></i>
      </div>
      <div class="stat-text">
        <p class="stat-title">Pedidos Realizados</p>
        <h3>{{ ordersCount !== null ? ordersCount : '...' }}</h3>
        <router-link :to="{ name: 'orders' }" class="stat-link">ver mis pedidos</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Stats Cards (Extraídos de ProfileView.vue) --- */
.stats-cards {
  display: flex;
  background: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  padding: 2rem;
  align-items: center;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  justify-content: center;
}

.stat-divider {
  width: 1px;
  height: 70px;
  background-color: var(--border-gray);
}

.stat-icon-circle {
  width: 65px;
  height: 65px;
  background-color: #d8f1ef;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--primary-blue);
  font-size: 1.6rem;
  flex-shrink: 0;
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.stat-text .stat-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--primary-blue);
  margin: 0;
}

.stat-text h3 {
  font-size: 1.8rem;
  color: var(--primary-blue);
  font-family: "Lato", "Inter", sans-serif;
  margin: 0;
  line-height: 1.2;
}

.stat-link {
  color: var(--light-teal);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  transition: color 0.2s ease, text-decoration 0.2s ease;
}

.stat-link:hover {
  color: var(--primary-blue);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .stat-card {
    width: 100%;
    justify-content: flex-start;
    text-align: left;
  }

  .stat-divider {
    display: none;
  }
}
</style>
