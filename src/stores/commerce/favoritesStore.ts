import { defineStore } from "pinia";
import { ref } from "vue";
import type { Router } from "vue-router";
import { useCartApi } from "@/api/modules/commerce/cart/useCartApi";
import { useAuthStore } from "@/stores/auth";
import { useToastStore, useAuthPromptStore } from "@/stores/ui";

export const useFavoritesStore = defineStore("favorites", () => {
  const cartApi = useCartApi();
  const authStore = useAuthStore();
  const toastStore = useToastStore();
  const authPromptStore = useAuthPromptStore();

  const favoriteProductIds = ref<Set<string>>(new Set());
  const isLoading = ref(false);
  const isInitialized = ref(false);

  function isFavorite(productId: string): boolean {
    return favoriteProductIds.value.has(productId);
  }

  async function fetchFavorites(force = false): Promise<void> {
    if (!authStore.isAuthenticated) {
      favoriteProductIds.value = new Set();
      isInitialized.value = true;
      return;
    }

    if (isInitialized.value && !force) {
      return;
    }

    isLoading.value = true;
    try {
      const res = await cartApi.getMyCartProducts();
      favoriteProductIds.value = new Set(res.data.map((item) => item.product_id));
      isInitialized.value = true;
    } catch (err) {
      console.warn("Error al cargar favoritos:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function toggleFavorite(
    productId: string,
    options?: { router?: Router; redirectPath?: string }
  ): Promise<boolean> {
    if (!authStore.isAuthenticated) {
      authPromptStore.promptLogin({
        title: "¿Deseas guardar tus favoritos?",
        message:
          "Para guardar y hacer seguimiento de tus productos favoritos necesitas iniciar sesión. Puedes iniciar sesión ahora o seguir explorando el catálogo.",
        confirmText: "Iniciar sesión",
        cancelText: "Seguir explorando",
        icon: "fa-solid fa-heart",
        iconColor: "text-rose-500",
        iconBg: "bg-rose-50 ring-rose-50/50",
        router: options?.router,
        redirectPath: options?.redirectPath,
      });
      return false;
    }

    const wasFavorite = favoriteProductIds.value.has(productId);
    const newSet = new Set(favoriteProductIds.value);

    // Optimistic UI update
    if (wasFavorite) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    favoriteProductIds.value = newSet;

    try {
      if (wasFavorite) {
        await cartApi.deleteMyCartProduct(productId);
        toastStore.addToast({
          title: "Eliminado de favoritos",
          message: "Producto eliminado de tus favoritos.",
          icon: "fa-regular fa-heart",
          variant: "info",
        });
      } else {
        await cartApi.updateMyCartProductQuantity(productId, { quantity_delta: 1 });
        toastStore.addToast({
          title: "Guardado en favoritos",
          message: "Producto agregado a tus favoritos.",
          icon: "fa-solid fa-heart",
          variant: "success",
        });
      }
      return !wasFavorite;
    } catch (err: any) {
      // Revert optimistic update
      const rollbackSet = new Set(favoriteProductIds.value);
      if (wasFavorite) {
        rollbackSet.add(productId);
      } else {
        rollbackSet.delete(productId);
      }
      favoriteProductIds.value = rollbackSet;

      toastStore.addToast({
        title: "Error",
        message: err?.message || "No se pudo actualizar el producto en favoritos.",
        icon: "fa-solid fa-circle-exclamation",
        variant: "error",
      });
      return wasFavorite;
    }
  }

  function reset() {
    favoriteProductIds.value = new Set();
    isInitialized.value = false;
    isLoading.value = false;
  }

  return {
    favoriteProductIds,
    isLoading,
    isInitialized,
    isFavorite,
    fetchFavorites,
    toggleFavorite,
    reset,
  };
});
