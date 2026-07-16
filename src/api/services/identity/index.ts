import type { ApiClient } from "../../client";
import { AuthResponseSchema } from "./payloads";

import type {  AuthResponse, LoginRequest, TokenRequest } from "./types";
import z from "zod";

export class IdentityService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    return this.client.request(
      "/login",
      { method: "POST", body: JSON.stringify(payload) },
      AuthResponseSchema,
    );
  }

  async refresh(payload: TokenRequest): Promise<AuthResponse> {
    return this.client.request(
      "/refresh",
      { method: "POST", body: JSON.stringify(payload) },
      AuthResponseSchema,
    );
  }

  async logout(payload: TokenRequest): Promise<void> {
    return this.client.request(
      "/logout",
      { method: "POST", body: JSON.stringify(payload) },
      z.undefined(),
    );
  }

  async logoutAll(): Promise<void> {
    return this.client.request(
      "/logout-all",
      { method: "POST", headers: this.client.constructAuthHeaders() },
      z.undefined(),
    );
  }
}
