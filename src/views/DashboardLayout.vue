<script setup lang="ts">
import { useRouter } from "vue-router";
import { authManager } from "../modules/auth";

const router = useRouter();

const handleLogout = async () => {
  await authManager.logout();
  router.push({ name: "login" });
};
</script>

<template>
  <div class="dashboard-shell">
    <header class="header">
      <div class="logo">
        <router-link :to="{ name: 'home' }">
          <img src="../assets/logo.png" alt="Mercanto" class="logo-img" />
        </router-link>
      </div>
    </header>

    <div class="dashboard-body">
      <aside class="sidebar">
        <nav class="sidebar-menu">
          <router-link
            :to="{ name: 'profile' }"
            class="menu-item"
            exact-active-class="active"
          >
            <i class="fa-regular fa-user"></i> Mi Perfil
          </router-link>
          <router-link
            :to="{ name: 'orders' }"
            class="menu-item"
            exact-active-class="active"
          >
            <i class="fa-solid fa-bag-shopping"></i> Pedidos
          </router-link>
          <a href="#" class="menu-item">
            <i class="fa-solid fa-cart-shopping"></i> Favoritos
          </a>
          <a href="#" class="menu-item">
            <i class="fa-regular fa-comment-dots"></i> Mensajes
          </a>
          <a href="#" class="menu-item">
            <i class="fa-solid fa-magnifying-glass"></i> Búsqueda Inteligente
          </a>
          <a href="#" class="menu-item">
            <i class="fa-solid fa-gear"></i> Configuración
          </a>
          <a href="#" class="menu-item">
            <i class="fa-regular fa-circle-question"></i> Ayuda
          </a>
        </nav>

        <button type="button" class="logout-btn" @click="handleLogout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
        </button>
      </aside>

      <main class="content-viewport">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  background-color: #ffffff;
  color: var(--primary-blue);
}

.header {
  background-color: var(--bg-gray);
  padding: 1rem 2.5rem;
  border-bottom: 1px solid var(--border-gray);
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  z-index: 100;
}

.logo-img {
  height: 40px;
  display: block;
}

.dashboard-body {
  display: flex;
  min-height: calc(100vh - 70px);
  margin-top: 70px;
}

.sidebar {
  width: 260px;
  background-color: var(--bg-gray);
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--border-gray);
  position: fixed;
  top: 70px;
  bottom: 0;
  left: 0;
  z-index: 90;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.25rem;
  text-decoration: none;
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 12px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.menu-item i {
  font-size: 1.15rem;
  width: 22px;
  text-align: center;
}

.menu-item:hover {
  background-color: #e2e8f0;
}

.menu-item.active {
  background-color: #e2e8f0;
  color: var(--light-teal);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 2rem;
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.95rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  margin-top: auto;
}

.logout-btn:hover {
  color: #ef4444;
}

.content-viewport {
  flex: 1;
  padding: 2.5rem 3rem;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }
  .content-viewport {
    margin-left: 220px;
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  .content-viewport {
    margin-left: 0;
    padding: 1.5rem 1rem;
  }
}
</style>
