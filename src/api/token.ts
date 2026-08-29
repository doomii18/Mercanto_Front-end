export interface TokenProvider {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string | null): void;
  getRefreshToken(): string | null;
  setRefreshToken(refreshToken: string | null): void;
  clear(): void;
}

export class HybridTokenProvider implements TokenProvider {
  private accessToken: string | null = null;
  private readonly REFRESH_TOKEN_KEY = "refresh_token";

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) ?? localStorage.getItem("refreshToken");
  }

  setRefreshToken(refreshToken: string | null): void {
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem("refreshToken");
    }
  }

  clear(): void {
    this.accessToken = null;
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
  }
}

export const tokenProvider: TokenProvider = new HybridTokenProvider();
