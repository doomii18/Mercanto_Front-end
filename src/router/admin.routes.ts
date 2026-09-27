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
        alias: ["inicio"],
        name: "admin-home",
        component: () => import("@/views/admin/AdminInicioView.vue"),
      },
      {
        path: "payments",
        alias: ["pagos"],
        name: "admin-payments",
        component: () => import("@/views/admin/AdminPagosView.vue"),
      },
      {
        path: "payments/transactions",
        alias: ["pagos/movimientos"],
        name: "admin-transactions",
        component: () => import("@/views/admin/AdminMovimientosView.vue"),
      },
      {
        path: "payments/requests/:id",
        alias: ["payments/request/:id", "pagos/solicitud/:id"],
        name: "admin-payment-detail",
        component: () => import("@/views/admin/AdminSolicitudDetalleView.vue"),
      },
      {
        path: "users",
        alias: ["usuarios"],
        name: "admin-users",
        component: () => import("@/views/admin/AdminUsuariosView.vue"),
      },
      {
        path: "orders",
        alias: ["pedidos"],
        name: "admin-orders",
        component: () => import("@/views/admin/AdminPedidosView.vue"),
      },
      {
        path: "reports",
        alias: ["reportes"],
        name: "admin-reports",
        component: () => import("@/views/admin/AdminReportesView.vue"),
      },
      {
        path: "notifications",
        alias: ["notificaciones"],
        name: "admin-notifications",
        component: () => import("@/views/NotificationsView.vue"),
      },
      {
        path: "settings",
        alias: ["configuracion"],
        name: "admin-settings",
        component: () => import("@/views/admin/AdminConfiguracionView.vue"),
      },
    ],
  },
];
