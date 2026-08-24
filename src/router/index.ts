import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import BuyerRegisterView from "../views/BuyerRegisterView.vue";
import ProviderRegisterView from '../views/ProviderRegisterView.vue';

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
      path: '/register/provider',
      name: 'provider-register',
      component: ProviderRegisterView
    }
  ],
});

export default router;
