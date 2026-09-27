import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAdminStore = defineStore("admin", () => {
  const isAuthenticated = ref(
    sessionStorage.getItem("admin_auth") === "true"
  );

  const isAdmin = computed(() => isAuthenticated.value);

  function login(username: string, password: string): boolean {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Valid credentials: Admin / administrador123 (also keeping legacy adminM/123admin)
    const isValidUser = cleanUser === "admin" || cleanUser === "adminm";
    const isValidPass = cleanPass === "administrador123" || cleanPass === "123admin";

    if (isValidUser && isValidPass) {
      isAuthenticated.value = true;
      sessionStorage.setItem("admin_auth", "true");
      return true;
    }
    return false;
  }

  function logout(): void {
    isAuthenticated.value = false;
    sessionStorage.removeItem("admin_auth");
  }

  return {
    isAuthenticated,
    isAdmin,
    login,
    logout,
  };
});
