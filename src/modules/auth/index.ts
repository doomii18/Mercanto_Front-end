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
    return tokens.access_token;
  }

  async requireAuth(redirectTo = "/login.html"): Promise<AccountResponse> {
    const account = await this.initialize();
    if (!account) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.assign(redirectUrl);
      throw new Error("Authentication required. Redirecting...");
    }
    return account;
  }

  async login(credentials: LoginRequest): Promise<AccountResponse> {
    await identityApi.login(credentials);
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
        this.currentAccount = await identityApi.getMyAccount();
      } catch (error) {
        // Clear cached promise on failure to allow re-attempts
        this.initPromise = null;
        this.currentAccount = null;
      } finally {
        this.isInitialized = true;
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
    this.isInitialized = false;
    this.notify();

    window.location.assign("/login.html");

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
    this.isInitialized = false;
    this.notify();
    window.location.assign("/login.html");
  }
}

export const authManager = new AuthManager();
