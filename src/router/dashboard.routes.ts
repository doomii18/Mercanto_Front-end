import type { RouteRecordRaw } from "vue-router";

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: "/dashboard",
    component: () => import("@/views/DashboardLayout.vue"),
    children: [
      {
        path: "",
        redirect: { name: "profile" },
      },
      {
        path: "favorites",
        name: "favorites",
        component: () => import("@/views/FavoritesView.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/views/ProfileView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("@/views/OrdersView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "orders/:id",
        name: "quote-detail",
        component: () => import("@/views/QuoteDetailView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "provider-products",
        name: "provider-products",
        component: () => import("@/views/ProviderProductsView.vue"),
        meta: { requiresAuth: true, requiresProvider: true },
      },
      {
        path: "provider-products/add",
        name: "provider-add-product",
        component: () => import("@/views/ProviderAddProductView.vue"),
        meta: { requiresAuth: true, requiresProvider: true },
      },
      {
        path: "messages",
        name: "messages",
        component: () => import("@/views/MessagesView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "notifications",
        name: "notifications",
        component: () => import("@/views/NotificationsView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "smart-search",
        name: "smart-search",
        component: () => import("@/views/SmartSearchView.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
];
