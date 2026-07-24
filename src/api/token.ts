export interface TokenProvider {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string | null): void;
  getRefreshToken(): string | null;
  setRefreshToken(refreshToken: string | null): void;
}

export class LocalStorageTokenProvider implements TokenProvider {
  private refreshToken: string | null = null;
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
  }

  getRefreshToken(): string | null {
    if (this.refreshToken == null) {
      this.refreshToken = localStorage.getItem('refreshToken');
    }
    return this.refreshToken;
  }

  setRefreshToken(refreshToken: string | null): void {
    this.refreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
}
