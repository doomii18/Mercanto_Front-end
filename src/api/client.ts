import { z } from "zod";
import type { ErrorPayload } from "./shared/types";
import { ErrorPayloadSchema } from "./shared/schemas";
import type { TokenProvider } from "./token";
import { AuthResponseSchema, TokenRequestSchema } from "./services/identity/payloads";
import type { AuthResponse } from "./services/identity/types";

export interface ApiClientConfig {
  baseUrl: string;
  onSessionExpired: () => void;
}

export class ApiError extends Error {
  status: number;
  payload?: ErrorPayload;

  constructor(status: number, message: string, payload?: ErrorPayload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class ApiClient {
  private isRefreshing = false;
  private tokenProvider: TokenProvider;
  private refreshQueue: Array<(token: string) => void> = [];
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig, tokenProvider: TokenProvider) {
    this.config = config;
    this.tokenProvider = tokenProvider;
  }

  private async refreshTokens(): Promise<AuthResponse> {
    const requestBody = TokenRequestSchema.parse({
       refreshToken: this.tokenProvider.getRefreshToken(),
    });
    const response = await fetch(`${this.getBaseUrl()}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error("Failed to refresh token");
      const data = AuthResponseSchema.parse(await response.json());

      this.tokenProvider.setAccessToken(data.access_token);
      this.tokenProvider.setRefreshToken(data.refresh_token);

      return data;
  }

  constructAuthHeaders(): Headers {
    const headers = new Headers();
    const token = this.tokenProvider.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  // TODO: Refactor api client retry system
  async request<T>(
    endpoint: string,
    options: RequestInit,
    schema: z.ZodSchema<T>,
  ): Promise<T> {
    const executeRequest = async (token: string | null) => {
      const headers = new Headers(options.headers);
      if (!headers.has("Content-Type") && !(options.body instanceof FormData))
        headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);

      return fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    };

    let response = await executeRequest(this.tokenProvider.getAccessToken());

    // Intercept 401s, excluding the refresh endpoint itself to prevent infinite loops
    if (
      response.status === 401 &&
      endpoint !== "/refresh" &&
      this.tokenProvider.getRefreshToken()
    ) {
      response = await this.handleUnauthorized(endpoint, options);
    }

    if (!response.ok) {
      const rawError = await response.json().catch(() => null);
      const parsedError = ErrorPayloadSchema.safeParse(rawError);
      throw new ApiError(
        response.status,
        parsedError.success
          ? parsedError.data.message
          : `HTTP Error ${response.status}`,
        parsedError.success ? parsedError.data : undefined,
      );
    }

    if (response.status === 204 || response.status === 201)
      return schema.parse(undefined);
    return schema.parse(await response.json());
  }

  private async handleUnauthorized(
    endpoint: string,
    options: RequestInit,
  ): Promise<Response> {
    if (this.isRefreshing) {
      // Suspend concurrent requests until the lock is released
      return new Promise<Response>((resolve) => {
        this.refreshQueue.push(async (newToken: string) => {
          const headers = new Headers(options.headers);
          headers.set("Authorization", `Bearer ${newToken}`);
          resolve(
            await fetch(`${this.config.baseUrl}${endpoint}`, {
              ...options,
              headers,
            }),
          );
        });
      });
    }

    this.isRefreshing = true;

    try {
      const newTokens = await this.refreshTokens();

      this.refreshQueue.forEach((cb) => cb(newTokens.access_token));

      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${newTokens.access_token}`);
      return fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    } catch (error) {
      this.refreshQueue = [];
      this.config.onSessionExpired();
      throw new ApiError(401, "Session expired and refresh failed.");
    } finally {
      this.isRefreshing = false;
      this.refreshQueue = [];
    }
  }
}
