import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import BuyerRegisterView from "../views/BuyerRegisterView.vue";
import ProviderRegisterView from "../views/ProviderRegisterView.vue";
import ProfileView from "../views/ProfileView.vue";
import OrdersView from "../views/OrdersView.vue";
import TestLayout from "../views/test/TestLayout.vue";
import TestChatView from "../views/test/TestChatView.vue";
import TestEventsView from "../views/test/TestEventsView.vue";
import TestImageSearchView from "../views/test/TestImageSearchView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/login", name: "login", component: LoginView },
    { path: "/register", name: "register", component: RegisterView },
    {
      path: "/register/buyer",
      name: "buyer-register",
      component: BuyerRegisterView,
    },
    {
      path: "/register/provider",
      name: "provider-register",
      component: ProviderRegisterView,
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
    },
    { path: "/orders", name: "orders", component: OrdersView },
    {
      path: "/test",
      component: TestLayout,
      children: [
        { path: "chat", name: "test-chat", component: TestChatView },
        { path: "events", name: "test-events", component: TestEventsView },
        { path: "image-search", name: "test-image-search", component: TestImageSearchView },
      ]
    }
  ],
});

export default router;
