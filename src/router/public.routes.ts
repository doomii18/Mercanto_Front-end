import type { RouteRecordRaw } from "vue-router";

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/views/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("@/views/HomeView.vue"),
      },
      {
        path: "privacy",
        name: "privacy",
        component: () => import("@/views/PrivacyView.vue"),
      },
      {
        path: "category/:categoryId",
        name: "category",
        component: () => import("@/views/CategoryView.vue"),
      },
      {
        path: "product/:id",
        name: "product-detail",
        component: () => import("@/views/ProductDetailView.vue"),
      },
      {
        path: "catalog/:providerId",
        name: "provider-catalog",
        component: () => import("@/views/ProviderCatalogView.vue"),
      },
      {
        path: "image-search",
        name: "image-search",
        component: () => import("@/views/ImageSearchView.vue"),
      },
      {
        path: "404/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/NotFoundView.vue"),
      },
    ],
  },
];
