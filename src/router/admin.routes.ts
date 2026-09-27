import type { RouteRecordRaw } from "vue-router";
import { useAdminStore } from "@/stores/adminStore";

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("@/views/admin/AdminLoginView.vue"),
  },
  {
    path: "/admin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    beforeEnter: (_to, _from, next) => {
      const adminStore = useAdminStore();
      if (!adminStore.isAuthenticated) {
        next({ name: "admin-login" });
      } else {
        next();
      }
    },
    children: [
      {
        path: "",
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
