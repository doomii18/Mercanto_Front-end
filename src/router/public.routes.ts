import type { RouteRecordRaw } from "vue-router";

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/views/public/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("@/views/public/HomeView.vue"),
      },
      {
        path: "privacy",
        name: "privacy",
        component: () => import("@/views/public/PrivacyView.vue"),
      },
      {
        path: "products",
        name: "products",
        component: () => import("@/views/public/ProductsView.vue"),
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
        redirect: (to) => ({
          name: "products",
          query: { categoryId: to.params.categoryId },
        }),
      },
      {
        path: "product/:id",
        name: "product-detail",
        props: true,
        component: () => import("@/views/public/ProductDetailView.vue"),
      },
      {
        path: "catalog/:providerId",
        name: "provider-catalog",
        props: true,
        component: () => import("@/views/public/ProviderCatalogView.vue"),
      },
      {
        path: "providers",
        name: "providers",
        component: () => import("@/views/public/ProvidersView.vue"),
      },
      {
        path: "image-search",
        name: "image-search",
        component: () => import("@/views/public/ImageSearchView.vue"),
      },
      {
        path: ":pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/public/NotFoundView.vue"),
      },
    ],
  },
];

