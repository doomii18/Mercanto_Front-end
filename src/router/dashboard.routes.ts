import type { RouteRecordRaw } from "vue-router";

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: "/dashboard",
    component: () => import("@/views/DashboardLayout.vue"),
    meta: { requiresAuth: true },
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
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("@/views/OrdersView.vue"),
      },
      {
        path: "orders/:id",
        name: "quote-detail",
        alias: ["order/:id"],
        props: true,
        component: () => import("@/views/QuoteDetailView.vue"),
      },
      {
        path: "products",
        alias: ["provider-products"],
        name: "provider-products",
        component: () => import("@/views/ProviderProductsView.vue"),
        meta: { requiresProvider: true },
      },
      {
        path: "products/new",
        alias: ["provider-products/add"],
        name: "provider-add-product",
        component: () => import("@/views/ProviderAddProductView.vue"),
        meta: { requiresProvider: true },
      },
      {
        path: "messages",
        name: "messages",
        component: () => import("@/views/MessagesView.vue"),
      },
      {
        path: "wallet",
        name: "wallet",
        component: () => import("@/views/wallet/WalletView.vue"),
      },
      {
        path: "wallet/recharge",
        name: "wallet-recharge",
        component: () => import("@/views/wallet/WalletRechargeView.vue"),
      },
      {
        path: "wallet/recharge/confirm",
        name: "wallet-recharge-confirm",
        component: () => import("@/views/wallet/WalletRechargeConfirmView.vue"),
      },
      {
        path: "wallet/recharge/success",
        name: "wallet-recharge-success",
        component: () => import("@/views/wallet/WalletRechargeSuccessView.vue"),
      },
      {
        path: "wallet/transfers",
        name: "wallet-transfers",
        component: () => import("@/views/wallet/WalletTransfersView.vue"),
      },
      {
        path: "notifications",
        name: "notifications",
        component: () => import("@/views/NotificationsView.vue"),
      },
      {
        path: "smart-search",
        name: "smart-search",
        component: () => import("@/views/SmartSearchView.vue"),
      },
    ],
  },
];
