import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    component: () => import("@/views/register/RegisterLayout.vue"),
    meta: { guestOnly: true },
    children: [
      {
        path: "",
        name: "register",
        component: () => import("@/views/RegisterView.vue"),
      },
      {
        path: "buyer",
        component: () => import("@/views/register/AccountRegisterView.vue"),
        children: [
          {
            path: "",
            name: "buyer-register",
            redirect: { name: "register-buyer-1" },
          },
          {
            path: "step-1",
            name: "register-buyer-1",
            component: () => import("@/views/register/AccountStep1View.vue"),
          },
          {
            path: "step-2",
            name: "register-buyer-2",
            component: () => import("@/views/register/AccountStep2View.vue"),
          },
        ],
      },
      {
        path: "provider",
        component: () => import("@/views/register/ProviderRegisterView.vue"),
        children: [
          {
            path: "",
            name: "provider-register",
            redirect: { name: "register-provider-1" },
          },
          {
            path: "step-1",
            name: "register-provider-1",
            component: () => import("@/views/register/ProviderStep1View.vue"),
          },
          {
            path: "step-2",
            name: "register-provider-2",
            component: () => import("@/views/register/ProviderStep2View.vue"),
          },
          {
            path: "step-3",
            name: "register-provider-3",
            component: () => import("@/views/register/ProviderStep3View.vue"),
          },
        ],
      },
    ],
  },
];
