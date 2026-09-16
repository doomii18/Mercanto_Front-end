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
        alias: "categories/:categoryId",
        name: "category",
        props: true,
        component: () => import("@/views/CategoryView.vue"),
      },
      {
        path: "product/:id",
        alias: "products/:id",
        name: "product-detail",
        props: true,
        component: () => import("@/views/ProductDetailView.vue"),
      },
      {
        path: "catalog/:providerId",
        alias: "providers/:providerId/catalog",
        name: "provider-catalog",
        props: true,
        component: () => import("@/views/ProviderCatalogView.vue"),
      },
      {
        path: "image-search",
        name: "image-search",
        component: () => import("@/views/ImageSearchView.vue"),
      },
      {
        path: ":pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/NotFoundView.vue"),
      },
    ],
  },
];

