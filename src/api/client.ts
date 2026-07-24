
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
  private refreshQueue: Array<(token: string) => void> = [];

  constructor(private readonly config: ApiClientConfig, private readonly tokenProvider: TokenProvider) {}

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

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  async requestRaw(
     endpoint: string,
     options: RequestInit,
     skipRetry: boolean = false
   ): Promise<Response> {
     const executeRequest = async (token: string | null) => {
       const headers = new Headers(options.headers);
       if (!headers.has("Content-Type") && !(options.body instanceof FormData))
         headers.set("Content-Type", "application/json");
       if (token && !skipRetry) headers.set("Authorization", `Bearer ${token}`);

       return fetch(`${this.config.baseUrl}${endpoint}`, {
         ...options,
         headers,
       });
     };

     let response = await executeRequest(this.tokenProvider.getAccessToken());

     if (
       response.status === 401 &&
       !skipRetry &&
       this.tokenProvider.getRefreshToken()
     ) {
       response = await this.handleUnauthorized(executeRequest);
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

     return response;
   }

   async request(
     endpoint: string,
     options: RequestInit,
     skipRetry: boolean = false
   ): Promise<unknown> {
     const response = await this.requestRaw(endpoint, options, skipRetry);

     if (response.status === 204)
       return undefined;

     return response.json();
   }

   async downloadBlob(endpoint: string): Promise<Blob> {
     const response = await this.requestRaw(endpoint, { method: "GET" });
     return response.blob();
   }

    private async handleUnauthorized(
      executeRequest: (token: string) => Promise<Response>
    ): Promise<Response> {
      if (this.isRefreshing) {
        return new Promise<Response>((resolve) => {
          this.refreshQueue.push(async (newToken: string) => resolve(await executeRequest(newToken)));
        });
      }

      this.isRefreshing = true;

      try {
        const newTokens = await this.refreshTokens();
        this.refreshQueue.forEach((cb) => cb(newTokens.access_token));
        return await executeRequest(newTokens.access_token);
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
