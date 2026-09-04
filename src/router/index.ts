import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/modules/auth";
import { useUserContextStore } from "@/stores/userContextStore";
import { bootstrapApp } from "@/utils/bootstrap";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    requiresProvider?: boolean;
  }
}

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
        path: "privacy",
        name: "privacy",
        component: () => import("../views/PrivacyView.vue"),
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
    component: () => import("../views/register/RegisterLayout.vue"),
    meta: { guestOnly: true },
    children: [
      {
        path: "",
        name: "register",
        component: () => import("../views/RegisterView.vue"),
      },
      {
        path: "buyer",
        component: () => import("../views/register/AccountRegisterView.vue"),
        children: [
          {
            path: "",
            name: "buyer-register",
            redirect: { name: "account-step-1" },
          },
          {
            path: "step-1",
            name: "account-step-1",
            component: () => import("../views/register/AccountStep1View.vue"),
          },
          {
            path: "step-2",
            name: "account-step-2",
            component: () => import("../views/register/AccountStep2View.vue"),
          },
        ],
      },
      {
        path: "provider",
        component: () => import("../views/register/ProviderRegisterView.vue"),
        children: [
          {
            path: "",
            name: "provider-register",
            redirect: { name: "provider-step-1" },
          },
          {
            path: "step-1",
            name: "provider-step-1",
            component: () => import("../views/register/ProviderStep1View.vue"),
          },
          {
            path: "step-2",
            name: "provider-step-2",
            component: () => import("../views/register/ProviderStep2View.vue"),
          },
          {
            path: "step-3",
            name: "provider-step-3",
            component: () => import("../views/register/ProviderStep3View.vue"),
          },
        ],
      },
    ],
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
        meta: { requiresAuth: true, requiresProvider: true },
      },
      {
        path: "provider-products/add",
        name: "provider-add-product",
        component: () => import("../views/ProviderAddProductView.vue"),
        meta: { requiresAuth: true, requiresProvider: true },
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
  // Unified bootstrap: hydrates auth, provider organization context, and geo cache
  await bootstrapApp();

  const authStore = useAuthStore();
  const contextStore = useUserContextStore();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresProvider = to.matched.some((record) => record.meta.requiresProvider);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  // Unauthenticated check
  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Guest-only redirect (logged-in users accessing login/register)
  if (guestOnly && authStore.isAuthenticated) {
    return contextStore.isProvider ? { name: "provider-products" } : { name: "profile" };
  }

  // Provider authorization check (prevents buyers accessing provider panels)
  if (requiresProvider && !contextStore.isProvider) {
    return { name: "profile" };
  }

  return true;
});

export default router;
