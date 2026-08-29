import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { authManager } from "../modules/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/category",
    name: "category",
    component: () => import("../views/CategoryView.vue"),
  },
  {
    path: "/products/:id",
    name: "product-detail",
    component: () => import("../views/ProductDetailView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register/buyer",
    name: "buyer-register",
    component: () => import("../views/BuyerRegisterView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register/provider",
    name: "provider-register",
    component: () => import("../views/ProviderRegisterView.vue"),
    meta: { guestOnly: true },
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
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: { name: "profile" },
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("../views/ProfileView.vue"),
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("../views/OrdersView.vue"),
      },
      {
        path: "orders/:id",
        name: "quote-detail",
        component: () => import("../views/QuoteDetailView.vue"),
      },
    ],
  },
  {
    path: "/test",
    component: () => import("../views/test/TestLayout.vue"),
    children: [
      {
        path: "",
        redirect: { name: "test-chat" },
      },
      {
        path: "chat",
        name: "test-chat",
        component: () => import("../views/test/TestChatView.vue"),
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

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const account = await authManager.initialize();

  if (to.meta.requiresAuth && !account) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.guestOnly && account) {
    return { name: "profile" };
  }

  return true;
});

export default router;
