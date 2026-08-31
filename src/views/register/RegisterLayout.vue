<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import logoImg from "@/assets/logo.png";

const route = useRoute();

const showNavbar = computed(() => route.name !== "register");
</script>

<template>
  <div class="register-layout">
    <header v-if="showNavbar" class="register-header">
      <div class="logo">
        <router-link :to="{ name: 'home' }">
          <img :src="logoImg" alt="Mercanto" class="logo-icon" />
        </router-link>
      </div>
      <router-link :to="{ name: 'home' }" class="home-icon" aria-label="Inicio">
        <i class="fa-solid fa-house"></i>
      </router-link>
    </header>

    <main class="register-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.register-layout {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.register-header {
  background-color: var(--bg-gray, #f8fafc);
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid var(--border-gray, #e2e8f0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-icon {
  height: 48px;
  object-fit: contain;
}

.home-icon {
  font-size: 1.4rem;
  color: var(--primary-blue, #083c5a);
  text-decoration: none;
  transition: color 0.2s ease;
}

.home-icon:hover {
  color: var(--primary-orange, #ff6a00);
}

.register-content {
  flex: 1;
  width: 100%;
}
</style>
