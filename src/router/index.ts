import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { authManager } from "../modules/auth";

import HomeView from "../views/HomeView.vue";
import CategoryView from "../views/CategoryView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import BuyerRegisterView from "../views/BuyerRegisterView.vue";
import ProviderRegisterView from "../views/ProviderRegisterView.vue";
import ProviderProfileView from "../views/ProviderProfileView.vue";
import DashboardLayout from "../views/DashboardLayout.vue";
import ProfileView from "../views/ProfileView.vue";
import OrdersView from "../views/OrdersView.vue";
import TestLayout from "../views/test/TestLayout.vue";
import TestChatView from "../views/test/TestChatView.vue";
import TestEventsView from "../views/test/TestEventsView.vue";
import TestImageSearchView from "../views/test/TestImageSearchView.vue";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/category",
    name: "category",
    component: CategoryView,
  },
  {
    path: "/product/:id?",
    name: "product-detail",
    component: ProductDetailView,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { requiresGuest: true },
  },
  {
    path: "/register/buyer",
    name: "buyer-register",
    component: BuyerRegisterView,
    meta: { requiresGuest: true },
  },
  {
    path: "/register/provider",
    name: "provider-register",
    component: ProviderRegisterView,
    meta: { requiresGuest: true },
  },
  {
    path: "/provider/profile",
    name: "provider-profile",
    component: ProviderProfileView,
  },
  {
    path: "/",
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
      },
      {
        path: "orders",
        name: "orders",
        component: OrdersView,
      },
    ],
  },
  {
    path: "/test",
    component: TestLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "chat", name: "test-chat", component: TestChatView },
      { path: "events", name: "test-events", component: TestEventsView },
      {
        path: "image-search",
        name: "test-image-search",
        component: TestImageSearchView,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const account = await authManager.initialize();
  const isAuthenticated = account !== null;

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);

  if (requiresAuth && !isAuthenticated) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  if (requiresGuest && isAuthenticated) {
    return { name: "profile" };
  }

  return true;
});

export default router;
