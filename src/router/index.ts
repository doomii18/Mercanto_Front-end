import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { publicRoutes } from "./public.routes";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { authGuard } from "./guards";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    requiresProvider?: boolean;
  }
}

export const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...authRoutes,
  ...dashboardRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: (to) => ({
      name: "not-found",
      params: { pathMatch: to.params.pathMatch },
    }),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0, behavior: "smooth" };
  },
});

router.beforeEach(authGuard);

export default router;
