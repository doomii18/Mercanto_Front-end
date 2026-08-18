import type { ApiClient } from "../../client";
import type { TokenProvider } from "../../token";
import {
  AccountResponseSchema,
  AuthResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  TokenRequestSchema,
} from "./payloads";
import type {
  AccountResponse,
  LoginRequest,
  RegisterRequest,
  RequestPasswordReset,
  ResetPassword,
  TokenRequest,
} from "./types";

export class IdentityService {
  constructor(
    private readonly client: ApiClient,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async register(payload: RegisterRequest): Promise<AccountResponse> {
    const validatedPayload = RegisterRequestSchema.parse(payload);
    const data = await this.client.request("/register", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return AccountResponseSchema.parse(data);
  }

  async login(payload: LoginRequest): Promise<void> {
    const validatedPayload = LoginRequestSchema.parse(payload);
    const data = await this.client.request(
      "/login",
      {
        method: "POST",
        body: JSON.stringify(validatedPayload),
      },
      true,
    );
    const tokens = AuthResponseSchema.parse(data);
    this.tokenProvider.setAccessToken(tokens.access_token);
    this.tokenProvider.setRefreshToken(tokens.refresh_token);
  }

  async refresh(payload: TokenRequest): Promise<void> {
    const validatedPayload = TokenRequestSchema.parse(payload);
    const data = await this.client.request(
      "/refresh",
      {
        method: "POST",
        body: JSON.stringify(validatedPayload),
      },
      true,
    );
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

  async forgotPassword(payload: RequestPasswordReset): Promise<void> {
    const validatedPayload = RequestPasswordResetSchema.parse(payload);
    await this.client.request("/forgot-password", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
  }

  async resetPassword(payload: ResetPassword): Promise<void> {
    const validatedPayload = ResetPasswordSchema.parse(payload);
    await this.client.request("/reset-password", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
  }

  async getAccount(accountId: string): Promise<AccountResponse> {
    const data = await this.client.request(`/accounts/${accountId}`, {
      method: "GET",
    });
    return AccountResponseSchema.parse(data);
  }

  async getMyAccount(): Promise<AccountResponse> {
    const data = await this.client.request("/accounts/me", {
      method: "GET",
    });
    return AccountResponseSchema.parse(data);
  }
}
