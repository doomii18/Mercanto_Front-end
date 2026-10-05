import type { RouteRecordRaw } from "vue-router";
import { guestGuard } from "./guards";

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { guestOnly: true },
    beforeEnter: guestGuard,
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/views/auth/ResetPasswordView.vue"),
    meta: { guestOnly: true },
    beforeEnter: guestGuard,
  },
  {
    path: "/register",
    component: () => import("@/views/auth/register/RegisterLayout.vue"),
    meta: { guestOnly: true },
    beforeEnter: guestGuard,
    children: [
      {
        path: "",
        name: "register",
        component: () => import("@/views/auth/RegisterView.vue"),
        meta: { guestOnly: true },
      },
      {
        path: "buyer",
        component: () => import("@/views/auth/register/AccountRegisterView.vue"),
        meta: { guestOnly: true },
        children: [
          {
            path: "",
            name: "buyer-register",
            redirect: { name: "register-buyer-1" },
            meta: { guestOnly: true },
          },
          {
            path: "step-1",
            name: "register-buyer-1",
            component: () => import("@/views/auth/register/AccountStep1View.vue"),
            meta: { guestOnly: true },
          },
          {
            path: "step-2",
            name: "register-buyer-2",
            component: () => import("@/views/auth/register/AccountStep2View.vue"),
            meta: { guestOnly: true },
          },
        ],
      },
      {
        path: "provider",
        component: () => import("@/views/auth/register/ProviderRegisterView.vue"),
        meta: { guestOnly: true },
        children: [
          {
            path: "",
            name: "provider-register",
            redirect: { name: "register-provider-1" },
            meta: { guestOnly: true },
          },
          {
            path: "step-1",
            name: "register-provider-1",
            component: () => import("@/views/auth/register/ProviderStep1View.vue"),
            meta: { guestOnly: true },
          },
          {
            path: "step-2",
            name: "register-provider-2",
            component: () => import("@/views/auth/register/ProviderStep2View.vue"),
            meta: { guestOnly: true },
          },
          {
            path: "step-3",
            name: "register-provider-3",
            component: () => import("@/views/auth/register/ProviderStep3View.vue"),
            meta: { guestOnly: true },
          },
        ],
      },
    ],
  },
];
