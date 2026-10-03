import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: "/admin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, requiresStaff: true },
    children: [
      {
        path: "",
        name: "admin",
        redirect: { name: "admin-home" },
      },
      {
        path: "home",
        name: "admin-home",
        component: () => import("@/views/admin/AdminInicioView.vue"),
      },
      {
        path: "payments",
        name: "admin-payments",
        component: () => import("@/views/admin/AdminPagosView.vue"),
      },
      {
        path: "payments/transactions",
        name: "admin-transactions",
        component: () => import("@/views/admin/AdminMovimientosView.vue"),
      },
      {
        path: "payments/requests/:id",
        name: "admin-payment-detail",
        component: () => import("@/views/admin/AdminSolicitudDetalleView.vue"),
      },
      {
        path: "users",
        name: "admin-users",
        component: () => import("@/views/admin/AdminUsuariosView.vue"),
      },
      {
        path: "orders",
        name: "admin-orders",
        component: () => import("@/views/admin/AdminPedidosView.vue"),
      },
      {
        path: "reports",
        name: "admin-reports",
        component: () => import("@/views/admin/AdminReportesView.vue"),
      },
      {
        path: "notifications",
        name: "admin-notifications",
        component: () => import("@/views/dashboard/NotificationsView.vue"),
      },
      {
        path: "settings",
        name: "admin-settings",
        component: () => import("@/views/admin/AdminConfiguracionView.vue"),
      },
    ],
  },
];
