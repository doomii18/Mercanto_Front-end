import { identityApi, tokenProvider } from "../../api";
import type { AccountResponse, LoginRequest } from "../../api";

export type AuthStateListener = (account: AccountResponse | null) => void;

export class AuthManager {
  private currentAccount: AccountResponse | null = null;
  private isInitialized = false;
  private initPromise: Promise<AccountResponse | null> | null = null;
  private listeners: Set<AuthStateListener> = new Set();

  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    if (this.isInitialized) {
      listener(this.currentAccount);
    }
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentAccount));
  }

  getAccount(): AccountResponse | null {
    return this.currentAccount;
  }

  isAuthenticated(): boolean {
    return this.currentAccount !== null;
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = tokenProvider.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const tokens = await identityApi.refresh({ refresh_token: refreshToken });
    if (tokens?.access_token) {
      tokenProvider.setAccessToken(tokens.access_token);
    }
    if (tokens?.refresh_token) {
      tokenProvider.setRefreshToken(tokens.refresh_token);
    }
    return tokens.access_token;
  }

  async login(credentials: LoginRequest): Promise<AccountResponse> {
    const authResponse = await identityApi.login(credentials);
    if (authResponse?.access_token) {
      tokenProvider.setAccessToken(authResponse.access_token);
    }
    if (authResponse?.refresh_token) {
      tokenProvider.setRefreshToken(authResponse.refresh_token);
    }

    const account = await identityApi.getMyAccount();
    this.currentAccount = account;
    this.isInitialized = true;
    this.notify();
    return account;
  }

  async initialize(): Promise<AccountResponse | null> {
    if (this.isInitialized) return this.currentAccount;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const refreshToken = tokenProvider.getRefreshToken();
      if (!refreshToken) {
        this.currentAccount = null;
        this.isInitialized = true;
        return null;
      }

      try {
        if (!tokenProvider.getAccessToken()) {
          await this.refreshAccessToken();
        }

        try {
          this.currentAccount = await identityApi.getMyAccount();
        } catch {
          await this.refreshAccessToken();
          this.currentAccount = await identityApi.getMyAccount();
        }
      } catch (error) {
        this.handleSessionExpired();
        return null;
      } finally {
        this.isInitialized = true;
        this.initPromise = null;
        this.notify();
      }

      return this.currentAccount;
    })();

    return this.initPromise;
  }

  async logout(): Promise<void> {
    const refreshToken = tokenProvider.getRefreshToken();

    tokenProvider.setAccessToken(null);
    tokenProvider.setRefreshToken(null);
    this.currentAccount = null;
    this.initPromise = null;
    this.isInitialized = true;
    this.notify();

    if (refreshToken) {
      try {
        await identityApi.logout({ refresh_token: refreshToken });
      } catch (err) {
        console.warn("Logout request failed:", err);
      }
    }
  }

  handleSessionExpired(): void {
    tokenProvider.setAccessToken(null);
    tokenProvider.setRefreshToken(null);
    this.currentAccount = null;
    this.initPromise = null;
    this.isInitialized = true;
    this.notify();
  }
}

export const authManager = new AuthManager();
