import type { ApiClient } from "../../client";
import type { TokenProvider } from "../../token";
import { AuthResponseSchema, LoginRequestSchema, RegisterRequestSchema, TokenRequestSchema } from "./payloads";
import type { LoginRequest, RegisterRequest, TokenRequest } from "./types";

export class IdentityService {
  constructor(
    private readonly client: ApiClient,
    private readonly tokenProvider: TokenProvider
  ) {}

   async register(payload: RegisterRequest): Promise<void> {
    const validatedPayload = RegisterRequestSchema.parse(payload);
    await this.client.request("/register", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
  }

  async login(payload: LoginRequest): Promise<void> {
    const validatedPayload = LoginRequestSchema.parse(payload);
    const data = await this.client.request("/login", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    }, true);
    const tokens = AuthResponseSchema.parse(data);
    this.tokenProvider.setAccessToken(tokens.access_token);
    this.tokenProvider.setRefreshToken(tokens.refresh_token);
  }

  async refresh(payload: TokenRequest): Promise<void> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    const data = await this.client.request("/refresh", {
      method: "POST",
      body: JSON.stringify(validatedPayload),

    }, true);
    const tokens = AuthResponseSchema.parse(data);
    this.tokenProvider.setAccessToken(tokens.access_token);
    this.tokenProvider.setRefreshToken(tokens.refresh_token);
  }

  async logout(payload: TokenRequest): Promise<void> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    await this.client.request("/logout", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    this.tokenProvider.setAccessToken(null);
    this.tokenProvider.setRefreshToken(null);
  }

  async logoutAll(): Promise<void> {
    await this.client.request("/logout-all", { method: "POST" });
    this.tokenProvider.setAccessToken(null);
    this.tokenProvider.setRefreshToken(null);
  }
}
