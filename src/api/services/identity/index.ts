import type { ApiClient } from "../../client";
import { AuthResponseSchema, LoginRequestSchema, TokenRequestSchema } from "./payloads";
import type { AuthResponse, LoginRequest, TokenRequest } from "./types";
import { z } from "zod";

export class IdentityService {
  constructor(private readonly client: ApiClient) {}

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const validatedPayload = LoginRequestSchema.parse(payload);
    return this.client.request(
      "/login",
      { method: "POST", body: JSON.stringify(validatedPayload) },
      AuthResponseSchema,
    );
  }

  async refresh(payload: TokenRequest): Promise<AuthResponse> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    return this.client.request(
      "/refresh",
      { method: "POST", body: JSON.stringify(validatedPayload) },
      AuthResponseSchema,
    );
  }

  async logout(payload: TokenRequest): Promise<void> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    return this.client.request(
      "/logout",
      { method: "POST", body: JSON.stringify(validatedPayload) },
      z.undefined(),
    );
  }

  async logoutAll(): Promise<void> {
    return this.client.request(
      "/logout-all",
      { method: "POST" },
      z.undefined(),
    );
  }
}
