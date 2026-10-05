import type { RouteLocationRaw, RouteRecordRaw } from "vue-router";
import { useUserContextStore } from "@/stores/auth";

/**
 * Resolves the default landing dashboard depending on the user's role and context:
 * - Admin or Auditor (`isStaff`): Admin Dashboard (`admin-home` / `/admin/home`)
 * - Provider (`isProvider`): Provider Products / Management (`provider-products` / `/dashboard/products`)
 * - Buyer / Regular user (`isBuyer`): User Profile (`profile` / `/dashboard/profile`)
 */
export function resolveDefaultDashboard(): RouteLocationRaw {
  const contextStore = useUserContextStore();

  if (contextStore.isStaff) {
    return { name: "admin-home" };
  }

  if (contextStore.isProvider) {
    return { name: "provider-products" };
  }

  return { name: "profile" };
}

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: "/dashboard",
    component: () => import("@/views/dashboard/DashboardLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        redirect: () => resolveDefaultDashboard(),
      },
      {
        path: "favorites",
        name: "favorites",
        component: () => import("@/views/dashboard/FavoritesView.vue"),
        meta: { requiresAuth: true, requiresBuyer: true, userGroup: "buyer" },
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/views/dashboard/ProfileView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("@/views/dashboard/OrdersView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "orders/:id",
        name: "quote-detail",
        props: true,
        component: () => import("@/views/dashboard/QuoteDetailView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "products",
        name: "provider-products",
        component: () => import("@/views/dashboard/ProviderProductsView.vue"),
        meta: { requiresAuth: true, requiresProvider: true, userGroup: "provider" },
      },
      {
        path: "products/new",
        name: "provider-add-product",
        component: () => import("@/views/dashboard/ProviderAddProductView.vue"),
        meta: { requiresAuth: true, requiresProvider: true, userGroup: "provider" },
      },
      {
        path: "messages",
        name: "messages",
        component: () => import("@/views/dashboard/MessagesView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "wallet",
        name: "wallet",
        component: () => import("@/views/dashboard/wallet/WalletView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "wallet/recharge",
        name: "wallet-recharge",
        component: () => import("@/views/dashboard/wallet/WalletRechargeView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "wallet/recharge/confirm",
        name: "wallet-recharge-confirm",
        component: () => import("@/views/dashboard/wallet/WalletRechargeConfirmView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "wallet/recharge/success",
        name: "wallet-recharge-success",
        component: () => import("@/views/dashboard/wallet/WalletRechargeSuccessView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "wallet/transfers",
        name: "wallet-transfers",
        component: () => import("@/views/dashboard/wallet/WalletTransfersView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "notifications",
        name: "notifications",
        component: () => import("@/views/dashboard/NotificationsView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "smart-search",
        name: "smart-search",
        component: () => import("@/views/dashboard/SmartSearchView.vue"),
        meta: { requiresAuth: true, requiresBuyer: true, userGroup: "buyer" },
      },
    ],
  },
];
