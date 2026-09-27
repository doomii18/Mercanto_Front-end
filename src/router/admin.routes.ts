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
        redirect: { name: "admin-inicio" },
      },
      {
        path: "inicio",
        name: "admin-inicio",
        component: () => import("@/views/admin/AdminInicioView.vue"),
      },
      {
        path: "pagos",
        name: "admin-pagos",
        component: () => import("@/views/admin/AdminPagosView.vue"),
      },
      {
        path: "pagos/movimientos",
        name: "admin-movimientos",
        component: () => import("@/views/admin/AdminMovimientosView.vue"),
      },
      {
        path: "pagos/solicitud/:id",
        name: "admin-solicitud-detalle",
        component: () => import("@/views/admin/AdminSolicitudDetalleView.vue"),
      },
      {
        path: "usuarios",
        name: "admin-usuarios",
        component: () => import("@/views/admin/AdminUsuariosView.vue"),
      },
      {
        path: "pedidos",
        name: "admin-pedidos",
        component: () => import("@/views/admin/AdminPedidosView.vue"),
      },
      {
        path: "reportes",
        name: "admin-reportes",
        component: () => import("@/views/admin/AdminReportesView.vue"),
      },
      {
        path: "notificaciones",
        name: "admin-notificaciones",
        component: () => import("@/views/admin/AdminNotificacionesView.vue"),
      },
      {
        path: "configuracion",
        name: "admin-configuracion",
        component: () => import("@/views/admin/AdminConfiguracionView.vue"),
      },
    ],
  },
];