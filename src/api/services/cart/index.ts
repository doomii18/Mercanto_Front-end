import type { ApiClient } from "../../client";
import { z } from "zod";
import { CartItemResponseSchema, UpdateCartItemQuantitySchema } from "./payloads";
import type { CartItemResponse, UpdateCartItemQuantityRequest } from "./types";

export class CartService {
  constructor(private readonly client: ApiClient) {}

  async getMyCartProducts(): Promise<CartItemResponse[]> {
    const data = await this.client.request("/cart/me/products", { method: "GET" });
    return z.array(CartItemResponseSchema).parse(data);
  }

  async updateMyCartProductQuantity(productId: string, payload: UpdateCartItemQuantityRequest): Promise<CartItemResponse> {
    const validatedPayload = UpdateCartItemQuantitySchema.parse(payload);
    const data = await this.client.request(`/cart/me/products/${productId}`, {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return CartItemResponseSchema.parse(data);
  }

  async deleteMyCartProduct(productId: string): Promise<void> {
    await this.client.request(`/cart/me/products/${productId}`, { method: "DELETE" });
  }

  async clearMyCart(): Promise<void> {
    await this.client.request("/cart/me", { method: "DELETE" });
  }

  async getCartProducts(accountId: string): Promise<CartItemResponse[]> {
    const data = await this.client.request(`/account/${accountId}/cart/products`, { method: "GET" });
    return z.array(CartItemResponseSchema).parse(data);
  }

  async updateCartProductQuantity(accountId: string, productId: string, payload: UpdateCartItemQuantityRequest): Promise<CartItemResponse> {
    const validatedPayload = UpdateCartItemQuantitySchema.parse(payload);
    const data = await this.client.request(`/account/${accountId}/cart/products/${productId}`, {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return CartItemResponseSchema.parse(data);
  }

  async deleteCartProduct(accountId: string, productId: string): Promise<void> {
    await this.client.request(`/account/${accountId}/cart/products/${productId}`, { method: "DELETE" });
  }

  async clearCart(accountId: string): Promise<void> {
    await this.client.request(`/account/${accountId}/cart`, { method: "DELETE" });
  }
}
