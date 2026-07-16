import type { ApiClient } from "../../client";
import { AuthResponseSchema, LoginRequestSchema, RegisterRequestSchema, TokenRequestSchema } from "./payloads";
import type { AuthResponse, LoginRequest, RegisterRequest, TokenRequest } from "./types";
import { z } from "zod";

export class IdentityService {
  constructor(private readonly client: ApiClient) { }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const validatedPayload = RegisterRequestSchema.parse(payload);
    const data = await this.client.request("/register", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return AuthResponseSchema.parse(data);
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const validatedPayload = LoginRequestSchema.parse(payload);
    const data = await this.client.request("/login", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return AuthResponseSchema.parse(data);
  }

  async refresh(payload: TokenRequest): Promise<AuthResponse> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    const data = await this.client.request("/refresh", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return AuthResponseSchema.parse(data);
  }

  async logout(payload: TokenRequest): Promise<void> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    const data = await this.client.request("/logout", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return z.undefined().parse(data);
  }

  async logoutAll(): Promise<void> {
    const data = await this.client.request("/logout-all", { method: "POST" });
    return z.undefined().parse(data);
  }
}
