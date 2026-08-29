export interface TokenProvider {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string | null): void;
  getRefreshToken(): string | null;
  setRefreshToken(refreshToken: string | null): void;
  clear(): void;
}

export class LocalStorageTokenProvider implements TokenProvider {
  private readonly ACCESS_TOKEN_KEY = "access_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) ?? localStorage.getItem("accessToken");
  }

  setAccessToken(accessToken: string | null): void {
    if (accessToken) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem("accessToken");
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) ?? localStorage.getItem("refreshToken");
  }

  setRefreshToken(refreshToken: string | null): void {
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.removeItem("refreshToken");
    } else {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem("refreshToken");
    }
  }

  clear(): void {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }
}
