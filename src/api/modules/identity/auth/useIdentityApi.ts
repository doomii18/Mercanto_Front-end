import { useApiFetch } from "@/api/useApiFetch";
import {
  LoginRequestSchema,
  TokenRequestSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  RegisterUserRequestSchema,
} from "./requests";
import {
  AuthResponseSchema,
  AccountResponseSchema,
} from "./responses";
import type {
  LoginRequest,
  TokenRequest,
  RequestPasswordReset,
  ResetPassword,
  RegisterUserRequest,
  AuthResponse,
  AccountResponse,
} from "./types";

export const useIdentityApi = () => {
  // POST /register
  async function register(payload: RegisterUserRequest): Promise<AccountResponse> {
    const validated = RegisterUserRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/register")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Register request failed");
    }

    return AccountResponseSchema.parse(data.value);
  }

  // POST /login
  async function login(payload: LoginRequest): Promise<AuthResponse> {
    const validated = LoginRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/login")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Login request failed");
    }

    return AuthResponseSchema.parse(data.value);
  }

  // POST /refresh
  async function refreshToken(payload: TokenRequest): Promise<AuthResponse> {
    const validated = TokenRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/refresh")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Refresh token request failed");
    }

    return AuthResponseSchema.parse(data.value);
  }

  // POST /logout
  async function logout(payload?: TokenRequest): Promise<void> {
    const validated = payload ? TokenRequestSchema.parse(payload) : undefined;
    const request = useApiFetch("/logout").post(validated);
    const { error } = await request;

    if (error.value) {
      throw error.value || new Error("Logout request failed");
    }
  }

  // POST /logout-all
  async function logoutAll(): Promise<void> {
    const { error } = await useApiFetch("/logout-all").post();
    if (error.value) {
      throw error.value || new Error("Logout-all request failed");
    }
  }

  // POST /forgot-password
  async function requestPasswordReset(payload: RequestPasswordReset): Promise<void> {
    const validated = RequestPasswordResetSchema.parse(payload);
    const { error } = await useApiFetch("/forgot-password")
      .post(validated);

    if (error.value) {
      throw error.value || new Error("Request password reset failed");
    }
  }

  // POST /reset-password
  async function resetPassword(payload: ResetPassword): Promise<void> {
    const validated = ResetPasswordSchema.parse(payload);
    const { error } = await useApiFetch("/reset-password")
      .post(validated);

    if (error.value) {
      throw error.value || new Error("Reset password failed");
    }
  }

  // GET /accounts/me
  async function getMyAccount(): Promise<AccountResponse> {
    const { data, error } = await useApiFetch("/accounts/me")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Get my account failed");
    }

    return AccountResponseSchema.parse(data.value);
  }

  // GET /accounts/{accountId}
  async function getAccount(accountId: string): Promise<AccountResponse> {
    const { data, error } = await useApiFetch(`/accounts/${accountId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Get account ${accountId} failed`);
    }

    return AccountResponseSchema.parse(data.value);
  }

  return {
    register,
    login,
    refreshToken,
    logout,
    logoutAll,
    requestPasswordReset,
    resetPassword,
    getMyAccount,
    getAccount,
  };
};
