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
        path: "inicio",
        name: "admin-home",
        component: () => import("@/views/admin/AdminInicioView.vue"),
      },
      {
        path: "pagos",
        name: "admin-payments",
        component: () => import("@/views/admin/AdminPagosView.vue"),
      },
      {
        path: "pagos/movimientos",
        name: "admin-transactions",
        component: () => import("@/views/admin/AdminMovimientosView.vue"),
      },
      {
        path: "pagos/solicitud/:id",
        name: "admin-payment-detail",
        component: () => import("@/views/admin/AdminSolicitudDetalleView.vue"),
      },
      {
        path: "usuarios",
        name: "admin-users",
        component: () => import("@/views/admin/AdminUsuariosView.vue"),
      },
      {
        path: "pedidos",
        name: "admin-orders",
        component: () => import("@/views/admin/AdminPedidosView.vue"),
      },
      {
        path: "reportes",
        name: "admin-reports",
        component: () => import("@/views/admin/AdminReportesView.vue"),
      },
      {
        path: "notificaciones",
        name: "admin-notifications",
        component: () => import("@/views/admin/AdminNotificacionesView.vue"),
      },
      {
        path: "configuracion",
        name: "admin-settings",
        component: () => import("@/views/admin/AdminConfiguracionView.vue"),
      },
    ],
  },
];
