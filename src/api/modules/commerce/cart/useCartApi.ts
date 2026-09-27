import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import { UpdateCartItemQuantitySchema } from "./requests";
import { CartItemResponseSchema } from "./responses";
import type { CartItemResponse, UpdateCartItemQuantityRequest } from "./types";

export const useCartApi = () => {
  // GET /cart/me/products
  async function getMyCartProducts(): Promise<CartItemResponse[]> {
    const { data, error } = await useApiFetch("/cart/me/products").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my cart products");
    }
    return z.array(CartItemResponseSchema).parse(data.value);
  }

  // POST /cart/me/products/{product_id}
  async function updateMyCartProductQuantity(
    productId: string,
    payload: UpdateCartItemQuantityRequest
  ): Promise<CartItemResponse> {
    const validatedPayload = UpdateCartItemQuantitySchema.parse(payload);
    const { data, error } = await useApiFetch(`/cart/me/products/${productId}`)
      .post(validatedPayload)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update quantity for product ${productId}`);
    }
    return CartItemResponseSchema.parse(data.value);
  }

  // DELETE /cart/me/products/{product_id}
  async function deleteMyCartProduct(productId: string): Promise<void> {
    const { error } = await useApiFetch(`/cart/me/products/${productId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // DELETE /cart/me
  async function clearMyCart(): Promise<void> {
    const { error } = await useApiFetch("/cart/me").delete();
    if (error.value) {
      throw error.value;
    }
  }

  // GET /account/{id}/cart/products
  async function getCartProducts(accountId: string): Promise<CartItemResponse[]> {
    const { data, error } = await useApiFetch(`/account/${accountId}/cart/products`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch cart products for account ${accountId}`);
    }
    return z.array(CartItemResponseSchema).parse(data.value);
  }

  // POST /account/{account_id}/cart/products/{product_id}
  async function updateCartProductQuantity(
    accountId: string,
    productId: string,
    payload: UpdateCartItemQuantityRequest
  ): Promise<CartItemResponse> {
    const validatedPayload = UpdateCartItemQuantitySchema.parse(payload);
    const { data, error } = await useApiFetch(`/account/${accountId}/cart/products/${productId}`)
      .post(validatedPayload)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update quantity for product ${productId}`);
    }
    return CartItemResponseSchema.parse(data.value);
  }

  // DELETE /account/{account_id}/cart/products/{product_id}
  async function deleteCartProduct(accountId: string, productId: string): Promise<void> {
    const { error } = await useApiFetch(`/account/${accountId}/cart/products/${productId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // DELETE /account/{id}/cart
  async function clearCart(accountId: string): Promise<void> {
    const { error } = await useApiFetch(`/account/${accountId}/cart/`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  return {
    getMyCartProducts,
    updateMyCartProductQuantity,
    deleteMyCartProduct,
    clearMyCart,
    getCartProducts,
    updateCartProductQuantity,
    deleteCartProduct,
    clearCart,
  };
};
