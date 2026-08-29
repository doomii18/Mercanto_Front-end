<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../modules/auth";

const router = useRouter();
const authStore = useAuthStore();

const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: "login" });
};
</script>

<template>
  <div class="dashboard-shell">
    <!-- ── Top header ─────────────────────────────────── -->
    <header class="header">
      <!-- Hamburger -->
      <button class="hamburger" @click="toggleSidebar" :aria-expanded="sidebarOpen" aria-label="Menú">
        <span class="bar" :class="{ open: sidebarOpen }"></span>
        <span class="bar" :class="{ open: sidebarOpen }"></span>
        <span class="bar" :class="{ open: sidebarOpen }"></span>
      </button>

      <div class="logo">
        <router-link :to="{ name: 'home' }">
          <img src="../assets/logo.png" alt="Mercanto" class="logo-img" />
        </router-link>
      </div>
    </header>

    <div class="dashboard-body">
      <!-- Backdrop (mobile only) -->
      <div
        v-if="sidebarOpen"
        class="backdrop"
        @click="sidebarOpen = false"
      ></div>

      <!-- ── Sidebar ─────────────────────────────────── -->
      <aside class="sidebar" :class="{ expanded: sidebarOpen }">
        <nav class="sidebar-menu">
          <router-link
            :to="{ name: 'profile' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Mi Perfil"
          >
            <i class="fa-regular fa-user icon"></i>
            <span class="label">Mi Perfil</span>
          </router-link>

          <router-link
            :to="{ name: 'provider-products' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Mis Productos"
          >
            <i class="fa-solid fa-bag-shopping icon"></i>
            <span class="label">Mis Productos</span>
          </router-link>

          <router-link
            :to="{ name: 'home' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Favoritos"
          >
            <i class="fa-solid fa-cart-shopping icon"></i>
            <span class="label">Favoritos</span>
          </router-link>

          <router-link
            :to="{ name: 'messages' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Mensajes"
          >
            <i class="fa-regular fa-comment-dots icon"></i>
            <span class="label">Mensajes</span>
          </router-link>

          <router-link
            :to="{ name: 'smart-search' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Búsqueda Inteligente"
          >
            <i class="fa-solid fa-magnifying-glass icon"></i>
            <span class="label">Búsqueda Inteligente</span>
          </router-link>

          <router-link
            :to="{ name: 'home' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Configuración"
          >
            <i class="fa-solid fa-gear icon"></i>
            <span class="label">Configuración</span>
          </router-link>

          <router-link
            :to="{ name: 'home' }"
            class="menu-item"
            exact-active-class="active"
            @click="sidebarOpen = false"
            title="Ayuda"
          >
            <i class="fa-regular fa-circle-question icon"></i>
            <span class="label">Ayuda</span>
          </router-link>
        </nav>

        <button
          type="button"
          class="logout-btn"
          @click="handleLogout"
          title="Cerrar sesión"
        >
          <i class="fa-solid fa-arrow-right-from-bracket icon logout-icon"></i>
          <span class="label">Cerrar sesión</span>
        </button>
      </aside>

      <!-- ── Content area ────────────────────────────── -->
      <main class="content-viewport" :class="{ shifted: sidebarOpen }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Variables ──────────────────────────────────────── */
:root {
  --sidebar-collapsed: 72px;
  --sidebar-expanded: 240px;
  --header-h: 64px;
}

/* ── Shell ──────────────────────────────────────────── */
.dashboard-shell {
  min-height: 100vh;
  background-color: #ffffff;
  color: var(--primary-blue, #083c5a);
}

/* ── Header ─────────────────────────────────────────── */
.header {
  background-color: #ffffff;
  padding: 0 1.5rem;
  border-bottom: 1px solid #eeeeee;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 200;
  box-sizing: border-box;
}

.logo-img {
  height: 38px;
  display: block;
}

/* ── Hamburger button ───────────────────────────────── */
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.hamburger:hover {
  background: #fde8e4;
}

.bar {
  display: block;
  width: 22px;
  height: 2.5px;
  background: #083c5a;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: center;
}

/* Animate to X when open */
.bar:nth-child(1).open {
  transform: translateY(7.5px) rotate(45deg);
}
.bar:nth-child(2).open {
  opacity: 0;
  transform: scaleX(0);
}
.bar:nth-child(3).open {
  transform: translateY(-7.5px) rotate(-45deg);
}

/* ── Body ───────────────────────────────────────────── */
.dashboard-body {
  display: flex;
  min-height: calc(100vh - 64px);
  margin-top: 64px;
  position: relative;
}

/* ── Backdrop (mobile overlay) ──────────────────────── */
.backdrop {
  display: none;
}

/* ── Sidebar ────────────────────────────────────────── */
.sidebar {
  width: 72px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 0 1.5rem;
  border-right: 1px solid #f0f0f0;
  position: fixed;
  top: 64px;
  bottom: 0;
  left: 0;
  z-index: 150;
  box-sizing: border-box;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Expanded state */
.sidebar.expanded {
  width: 240px;
  align-items: flex-start;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
}

/* ── Sidebar nav ────────────────────────────────────── */
.sidebar-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.sidebar.expanded .sidebar-menu {
  align-items: flex-start;
  padding: 0 0.75rem;
}

/* ── Menu items ─────────────────────────────────────── */
.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  text-decoration: none;
  color: #9ca3af;
  font-size: 1.15rem;
  transition: background 0.2s, color 0.2s, width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.expanded .menu-item {
  width: 100%;
  justify-content: flex-start;
  gap: 0.85rem;
  padding: 0 0.85rem;
  font-size: 0.95rem;
}

.menu-item:hover {
  background-color: #fde8e4;
  color: #ff6a00;
}

.menu-item.active,
.menu-item.router-link-active {
  background-color: #fde8e4;
  color: #ff6a00;
}

/* ── Icon ────────────────────────────────────────────── */
.icon {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  font-size: 1.15rem;
}

/* Logout icon mirrored to match [← design */
.logout-icon {
  transform: scaleX(-1);
}

/* ── Label (hidden when collapsed) ──────────────────── */
.label {
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transform: translateX(-6px);
  transition: opacity 0.25s ease, max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s ease;
  pointer-events: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.sidebar.expanded .label {
  opacity: 1;
  max-width: 200px;
  transform: translateX(0);
}

/* ── Tooltip (collapsed only) ───────────────────────── */
.menu-item:not(.sidebar.expanded .menu-item)::after {
  content: attr(title);
  position: fixed;
  left: 80px;
  background: #083c5a;
  color: #fff;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s;
  z-index: 300;
}

.menu-item:hover::after {
  opacity: 1;
}

.sidebar.expanded .menu-item::after {
  display: none;
}

/* ── Logout ─────────────────────────────────────────── */
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  color: #9ca3af;
  font-size: 1.15rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
  margin: 0 auto;
}

.sidebar.expanded .logout-btn {
  width: calc(100% - 1.5rem);
  justify-content: flex-start;
  gap: 0.85rem;
  padding: 0 0.85rem;
  margin: 0 0.75rem;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.sidebar.expanded .logout-btn .label {
  font-weight: 600;
  font-size: 0.9rem;
}

/* ── Content viewport ───────────────────────────────── */
.content-viewport {
  flex: 1;
  margin-left: 72px;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
  background-color: #fdf3f0;
  transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.content-viewport.shifted {
  margin-left: 240px;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) {
  .content-viewport {
    padding: 2rem 1.5rem;
  }

  /* On tablet the expanded sidebar overlays instead of pushing content */
  .content-viewport.shifted {
    margin-left: 72px;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 64px 0 0 0;
    background: rgba(0, 0, 0, 0.25);
    z-index: 140;
  }
}

@media (max-width: 768px) {
  /* Bottom nav bar on mobile */
  .sidebar {
    width: 100% !important;
    height: 60px;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    padding: 0 0.5rem;
    border-right: none;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
    transition: none;
  }

  .sidebar.expanded {
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  }

  .sidebar-menu {
    flex-direction: row;
    gap: 0;
    padding: 0;
    width: auto;
    align-items: center !important;
  }

  .sidebar.expanded .sidebar-menu {
    padding: 0;
  }

  .menu-item,
  .sidebar.expanded .menu-item {
    width: 44px !important;
    height: 44px;
    border-radius: 12px;
    justify-content: center !important;
    padding: 0 !important;
    gap: 0 !important;
    font-size: 1.1rem;
  }

  .label {
    display: none !important;
  }

  .menu-item::after,
  .logout-btn::after {
    display: none !important;
  }

  .logout-btn,
  .sidebar.expanded .logout-btn {
    width: 44px !important;
    height: 44px;
    justify-content: center !important;
    padding: 0 !important;
    gap: 0 !important;
    margin: 0 !important;
  }

  .dashboard-body {
    flex-direction: column;
  }

  .content-viewport,
  .content-viewport.shifted {
    margin-left: 0 !important;
    padding: 1.5rem 1rem;
    margin-bottom: 60px;
    min-height: auto;
  }

  .backdrop {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .content-viewport {
    padding: 1rem 0.75rem;
  }
}
</style>
