import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import { PlatformBankAccountResponseSchema } from "./responses";
import type {
  PlatformBankAccountResponse,
  CreatePlatformBankAccountDto,
  UpdatePlatformBankAccountDto,
} from "./types";

export const usePlatformBankAccountApi = () => {
  // GET /platform-bank-accounts (or /platform/bank-accounts)
  async function getPlatformBankAccounts(
    includeInactive = false,
  ): Promise<PlatformBankAccountResponse[]> {
    const url = includeInactive
      ? "/platform-bank-accounts?include_inactive=true"
      : "/platform-bank-accounts";
    const { data, error } = await useApiFetch(url).get().json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch platform bank accounts");
    }

    return z.array(PlatformBankAccountResponseSchema).parse(data.value);
  }

  // POST /platform-bank-accounts
  async function createPlatformBankAccount(
    dto: CreatePlatformBankAccountDto,
  ): Promise<PlatformBankAccountResponse> {
    const { data, error } = await useApiFetch("/platform-bank-accounts").post(dto).json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create platform bank account");
    }

    return PlatformBankAccountResponseSchema.parse(data.value);
  }

  // PUT /platform-bank-accounts/{id}
  async function updatePlatformBankAccount(
    id: string,
    dto: UpdatePlatformBankAccountDto,
  ): Promise<PlatformBankAccountResponse> {
    const { data, error } = await useApiFetch(`/platform-bank-accounts/${id}`).put(dto).json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to update platform bank account");
    }

    return PlatformBankAccountResponseSchema.parse(data.value);
  }

  // DELETE /platform-bank-accounts/{id}
  async function deletePlatformBankAccount(id: string): Promise<void> {
    const { error } = await useApiFetch(`/platform-bank-accounts/${id}`).delete();

    if (error.value) {
      throw error.value || new Error("Failed to deactivate platform bank account");
    }
  }

  return {
    getPlatformBankAccounts,
    createPlatformBankAccount,
    updatePlatformBankAccount,
    deletePlatformBankAccount,
  };
};
