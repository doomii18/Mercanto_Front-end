import { useApiFetch } from "./useApiFetch";
import {
  AccountResponseSchema,
  AuthResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  TokenRequestSchema,
} from "@/api/services/identity/payloads";
import type {
  AccountResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RequestPasswordReset,
  ResetPassword,
  TokenRequest,
} from "@/api/services/identity/types";

export const  useIdentityApi = () => {
  async function register(payload: RegisterRequest): Promise<AccountResponse> {
    const validated = RegisterRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/register")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Register request failed");
    }

    return AccountResponseSchema.parse(data.value);
  }

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

  async function refresh(payload: TokenRequest): Promise<AuthResponse> {
    const validated = TokenRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/refresh")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Token refresh request failed");
    }

    return AuthResponseSchema.parse(data.value);
  }

  async function logout(payload: TokenRequest): Promise<void> {
    const validated = TokenRequestSchema.parse(payload);
    const { error } = await useApiFetch("/logout").post(validated);

    if (error.value) {
      throw error.value;
    }
  }

  async function logoutAll(): Promise<void> {
    const { error } = await useApiFetch("/logout-all").post();

    if (error.value) {
      throw error.value;
    }
  }

  async function forgotPassword(payload: RequestPasswordReset): Promise<void> {
    const validated = RequestPasswordResetSchema.parse(payload);
    const { error } = await useApiFetch("/forgot-password").post(validated);

    if (error.value) {
      throw error.value;
    }
  }

  async function resetPassword(payload: ResetPassword): Promise<void> {
    const validated = ResetPasswordSchema.parse(payload);
    const { error } = await useApiFetch("/reset-password").post(validated);

    if (error.value) {
      throw error.value;
    }
  }

  async function getAccount(accountId: string): Promise<AccountResponse> {
    const { data, error } = await useApiFetch(`/accounts/${accountId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch account ${accountId}`);
    }

    return AccountResponseSchema.parse(data.value);
  }

  async function getMyAccount(): Promise<AccountResponse> {
    const { data, error } = await useApiFetch("/accounts/me")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch current account profile");
    }

    return AccountResponseSchema.parse(data.value);
  }

  return {
    register,
    login,
    refresh,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    getAccount,
    getMyAccount,
  };
}
