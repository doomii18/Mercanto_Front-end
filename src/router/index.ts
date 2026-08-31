import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "../modules/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("../views/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("../views/HomeView.vue"),
      },
      {
        path: "category",
        name: "category",
        component: () => import("../views/CategoryView.vue"),
      },
      {
        path: "product/:id",
        name: "product-detail",
        component: () => import("../views/ProductDetailView.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    component: () => import("../views/account/RegisterLayout.vue"),
    meta: { guestOnly: true },
    children: [
      {
        path: "",
        name: "register",
        component: () => import("../views/RegisterView.vue"),
      },
      {
        path: "buyer",
        component: () => import("../views/account/AccountRegisterView.vue"),
        children: [
          {
            path: "",
            name: "buyer-register",
            redirect: { name: "account-step-1" },
          },
          {
            path: "step-1",
            name: "account-step-1",
            component: () => import("../views/account/AccountStep1View.vue"),
          },
          {
            path: "step-2",
            name: "account-step-2",
            component: () => import("../views/account/AccountStep2View.vue"),
          },
        ],
      },
      {
        path: "provider",
        name: "provider-register",
        component: () => import("../views/ProviderRegisterView.vue"),
      },
    ],
  },
  {
    path: "/provider/profile",
    name: "provider-profile",
    component: () => import("../views/ProviderProfileView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    component: () => import("../views/DashboardLayout.vue"),
    children: [
      {
        path: "",
        redirect: { name: "profile" },
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("../views/ProfileView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("../views/OrdersView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "orders/:id",
        name: "quote-detail",
        component: () => import("../views/QuoteDetailView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "provider-products",
        name: "provider-products",
        component: () => import("../views/ProviderProductsView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "provider-products/add",
        name: "provider-add-product",
        component: () => import("../views/ProviderAddProductView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "messages",
        name: "messages",
        component: () => import("../views/MessagesView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "smart-search",
        name: "smart-search",
        component: () => import("../views/SmartSearchView.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/test",
    component: () => import("../views/test/TestLayout.vue"),
    children: [
      {
        path: "",
        redirect: { name: "test-events" },
      },
      {
        path: "events",
        name: "test-events",
        component: () => import("../views/test/TestEventsView.vue"),
      },
      {
        path: "image-search",
        name: "test-image-search",
        component: () => import("../views/test/TestImageSearchView.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "home" },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0, behavior: "smooth" };
  },
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (guestOnly && authStore.isAuthenticated) {
    return { name: "profile" };
  }

  return true;
});

export default router;
