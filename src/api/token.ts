import { useTokenStore } from "@/stores/tokenStore";

export interface TokenProvider {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string | null): void;
  getRefreshToken(): string | null;
  setRefreshToken(refreshToken: string | null): void;
  clear(): void;
}

export class PiniaBridgedTokenProvider implements TokenProvider {
  getAccessToken(): string | null {
    return useTokenStore().accessToken;
  }

  setAccessToken(accessToken: string | null): void {
    useTokenStore().accessToken = accessToken;
  }

  getRefreshToken(): string | null {
    return useTokenStore().refreshToken;
  }

  setRefreshToken(refreshToken: string | null): void {
    useTokenStore().refreshToken = refreshToken;
  }

  clear(): void {
    useTokenStore().clearTokens();
  }
}

export const tokenProvider: TokenProvider = new PiniaBridgedTokenProvider();
