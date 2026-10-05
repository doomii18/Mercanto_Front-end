import { useApiFetch } from "@/api/useApiFetch";
import { UpdateCartItemQuantitySchema, CartPaginationQuerySchema } from "./requests";
import { CartItemResponseSchema, PaginatedCartItemResponseSchema } from "./responses";
import type {
  CartItemResponse,
  PaginatedCartItemResponse,
  CartPaginationQuery,
  UpdateCartItemQuantityRequest,
} from "./types";

export const useCartApi = () => {
  // GET /cart/me/products
  async function getMyCartProducts(
    params?: CartPaginationQuery
  ): Promise<PaginatedCartItemResponse> {
    const validated = params ? CartPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const qs = queryParams.toString();
    const endpoint = `/cart/me/products${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my cart products");
    }
    return PaginatedCartItemResponseSchema.parse(data.value);
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
  async function getCartProducts(
    accountId: string,
    params?: CartPaginationQuery
  ): Promise<PaginatedCartItemResponse> {
    const validated = params ? CartPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const qs = queryParams.toString();
    const endpoint = `/account/${accountId}/cart/products${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch cart products for account ${accountId}`);
    }
    return PaginatedCartItemResponseSchema.parse(data.value);
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
