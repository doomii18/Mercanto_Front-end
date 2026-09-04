<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { productApi, quoteApi } from "@/api";
import { useUserContextStore } from "@/stores/userContextStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import type { PublicProviderDto } from "@/api/services/organization/types";

const contextStore = useUserContextStore();
const orgStore = useOrganizationStore();

const productsCount = ref<number>(0);
const ordersCount = ref<number>(0);
const providerData = ref<PublicProviderDto | null>(null);
const isLoading = ref<boolean>(true);

const providerId = computed(() => contextStore.activeOrganization?.id ?? contextStore.activeOrganizationId);

const ratingScore = computed<number>(() => {
  if (!providerData.value) return 0;
  const rating = (providerData.value as any).rating;
  if (typeof rating === "number") return rating;
  if (typeof rating === "object" && rating !== null) {
    return rating.score ?? rating.average ?? 0;
  }
  return (providerData.value as any).score ?? 0;
});

const formattedRating = computed<string>(() => {
  return ratingScore.value > 0 ? ratingScore.value.toFixed(1) : "0.0";
});

function getStarClass(starIndex: number, score: number): string {
  if (score >= starIndex) return "fa-solid fa-star star-filled";
  if (score >= starIndex - 0.5) return "fa-solid fa-star-half-stroke star-filled";
  return "fa-regular fa-star star-empty";
}

async function fetchStats(): Promise<void> {
  const activeId = providerId.value;
  if (!activeId) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  const [productsRes, quotesRes, orgRes] = await Promise.allSettled([
    productApi.getProducts({ provider_id: activeId, limit: 0, offset: 0 }),
    quoteApi.getProviderQuotes(activeId, { limit: 0, offset: 0 }),
    orgStore.getPublicProvider(activeId),
  ]);

  if (productsRes.status === "fulfilled") {
    productsCount.value = productsRes.value.total ?? 0;
  }

  if (quotesRes.status === "fulfilled") {
    ordersCount.value = quotesRes.value.total ?? 0;
  }

  if (orgRes.status === "fulfilled") {
    providerData.value = orgRes.value;
  }

  isLoading.value = false;
}

watch(providerId, () => {
  fetchStats();
});

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <div class="stats-cards">
    <!-- Published Products -->
    <div class="stat-card">
      <div class="stat-icon-circle">
        <i class="fa-solid fa-bag-shopping"></i>
      </div>
      <div class="stat-text">
        <p class="stat-title">Productos Publicados</p>
        <template v-if="isLoading">
          <div class="stat-skeleton"></div>
        </template>
        <template v-else>
          <h3>{{ productsCount }}</h3>
        </template>
        <router-link :to="{ name: 'provider-products' }" class="stat-link">
          ver mis productos
        </router-link>
      </div>
    </div>

    <div class="stat-divider"></div>

    <!-- Received Orders -->
    <div class="stat-card">
      <div class="stat-icon-circle">
        <i class="fa-solid fa-cart-shopping"></i>
      </div>
      <div class="stat-text">
        <p class="stat-title">Pedidos Recibidos</p>
        <template v-if="isLoading">
          <div class="stat-skeleton"></div>
        </template>
        <template v-else>
          <h3>{{ ordersCount }}</h3>
        </template>
        <router-link :to="{ name: 'orders' }" class="stat-link">
          ver mis pedidos
        </router-link>
      </div>
    </div>

    <div class="stat-divider"></div>

    <!-- Average Rating -->
    <div class="stat-card">
      <div class="stat-icon-circle orange-bg">
        <i class="fa-regular fa-star"></i>
      </div>
      <div class="stat-text">
        <p class="stat-title">Calificación Promedio</p>
        <template v-if="isLoading">
          <div class="stat-skeleton wide"></div>
        </template>
        <template v-else>
          <div class="stat-rating-row">
            <h3>{{ formattedRating }}</h3>
            <div class="stars-list">
              <i v-for="star in 5" :key="star" :class="getStarClass(star, ratingScore)"></i>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.stat-icon-circle.orange-bg {
  background-color: #fde8db;
  color: #ff6a00;
}

.stat-text {
  display: flex;
  flex-direction: column;
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
  margin: 0.1rem 0;
  line-height: 1.2;
}

.stat-link {
  color: var(--light-teal);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
}

.stat-link:hover {
  text-decoration: underline;
}

.stat-rating-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.stars-list {
  display: flex;
  gap: 0.2rem;
  font-size: 0.9rem;
}

.star-filled {
  color: #ffb400;
}

.star-empty {
  color: #e0e0e0;
}

.stat-skeleton {
  height: 28px;
  width: 50px;
  background: #e2e8f0;
  border-radius: 6px;
  margin: 0.3rem 0;
  animation: pulse 1.5s ease-in-out infinite;
}

.stat-skeleton.wide {
  width: 110px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
    gap: 1.5rem;
  }
  .stat-divider {
    display: none;
  }
}
</style>
