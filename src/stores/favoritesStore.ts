import { defineStore } from "pinia";
import { ref } from "vue";
import type { Router } from "vue-router";
import { useCartApi } from "@/api/modules/commerce/cart/useCartApi";
import { useAuthStore } from "./authStore";
import { useToastStore } from "./toastStore";

export const useFavoritesStore = defineStore("favorites", () => {
  const cartApi = useCartApi();
  const authStore = useAuthStore();
  const toastStore = useToastStore();

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
      const items = await cartApi.getMyCartProducts();
      favoriteProductIds.value = new Set(items.map((item) => item.product_id));
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
      toastStore.addToast({
        title: "Inicia sesión",
        message: "Debes iniciar sesión para agregar productos a tus favoritos.",
        icon: "fa-solid fa-heart",
        variant: "info",
      });

      if (options?.router) {
        options.router.push({
          name: "login",
          query: options.redirectPath ? { redirect: options.redirectPath } : undefined,
        });
      }
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
