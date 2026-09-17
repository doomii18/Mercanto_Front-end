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
        path: "products",
        alias: ["productos", "category"],
        name: "products",
        component: () => import("@/views/ProductsView.vue"),
      },
      {
        path: "categories",
        name: "category",
        redirect: (to) => ({
          name: "products",
          query: to.query,
        }),
      },
      {
        path: "category/:categoryId",
        alias: "categories/:categoryId",
        redirect: (to) => ({
          name: "products",
          query: { categoryId: to.params.categoryId },
        }),
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
        path: "providers",
        alias: "proveedores",
        name: "providers",
        component: () => import("@/views/ProvidersView.vue"),
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

